import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Loader2, Mic, MicOff, Phone, PhoneOff, Users, Volume2 } from 'lucide-react';
import {
  ChatConversation,
  ConversationCallSession,
  sendCallSignal,
  type CallSignalType,
} from '@/api/chatApi';
import { getEcho } from '@/lib/echo';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import styles from '@/features/messages/pages/MessagesPage.module.css';

type AudioCallDialogProps = {
  open: boolean;
  callSession: ConversationCallSession | null;
  conversation: ChatConversation | null;
  currentUserId: number | null;
  onOpenChange: (open: boolean) => void;
  onEndCall: () => void;
  onRemoteHangup?: () => void;
};

type CallSignalEvent = {
  sender_id?: number;
  signal_type?: CallSignalType;
  signal_payload?: Record<string, unknown>;
};

type RTCSignalDescription = RTCSessionDescriptionInit & { type: RTCSdpType };

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const formatStartedAt = (value: string | null | undefined) => {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getDisplayName = (conversation: ChatConversation | null) => {
  if (!conversation) {
    return 'Conversation';
  }

  return conversation.user?.name || 'Conversation';
};

const getInitials = (name: string | null | undefined) => {
  if (!name) {
    return 'U';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const attachStreamToAudioElement = (element: HTMLAudioElement | null, stream: MediaStream | null) => {
  if (!element) {
    return;
  }

  element.srcObject = stream;

  if (stream) {
    void element.play().catch(() => {
      // Browser autoplay policy can briefly block audio until the user has interacted.
    });
  }
};

export const AudioCallDialog = ({
  open,
  callSession,
  conversation,
  currentUserId,
  onOpenChange,
  onEndCall,
  onRemoteHangup,
}: AudioCallDialogProps) => {
  const [connectionState, setConnectionState] = useState<'idle' | 'waiting' | 'connecting' | 'connected' | 'error' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remotePlaybackContextRef = useRef<AudioContext | null>(null);
  const remotePlaybackSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingSignalsRef = useRef<CallSignalEvent[]>([]);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const offerSentRef = useRef(false);
  const isMountedRef = useRef(false);

  const isInitiator = useMemo(() => {
    if (!callSession || currentUserId === null) {
      return false;
    }

    return Number(callSession.initiator_id) === Number(currentUserId);
  }, [callSession, currentUserId]);

  const statusText = useMemo(() => {
    if (!callSession) {
      return '';
    }

    if (connectionState === 'error') {
      return 'Connection failed';
    }

    if (connectionState === 'ended' || callSession.status === 'ended') {
      return 'Call ended';
    }

    if (connectionState === 'connected' || callSession.status === 'accepted') {
      return 'Connected';
    }

    if (isInitiator) {
      return 'Waiting for answer';
    }

    return 'Connecting...';
  }, [callSession, connectionState, isInitiator]);

  const stopTracks = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
  };

  const stopRemotePlayback = () => {
    try {
      remotePlaybackSourceRef.current?.disconnect();
    } catch {
      // ignore
    }

    remotePlaybackSourceRef.current = null;

    try {
      remotePlaybackContextRef.current?.close();
    } catch {
      // ignore
    }

    remotePlaybackContextRef.current = null;
  };

  const cleanupPeer = () => {
    peerRef.current?.getSenders().forEach((sender) => sender.track?.stop());
    peerRef.current?.close();
    peerRef.current = null;
    stopTracks();
    stopRemotePlayback();

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.muted = true;
    }
  };

  const attachRemotePlayback = async (stream: MediaStream) => {
    const audioElement = remoteAudioRef.current;

    if (audioElement) {
      audioElement.srcObject = stream;
    }

    try {
      if (!remotePlaybackContextRef.current) {
        remotePlaybackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playbackContext = remotePlaybackContextRef.current;
      if (!playbackContext) {
        throw new Error('No audio context');
      }

      await playbackContext.resume().catch(() => {
        // Ignore resume failures; we may fallback to the audio element.
      });

      if (playbackContext.state !== 'running') {
        setNeedsAudioUnlock(true);
        throw new Error('Audio context not running');
      }

      try {
        remotePlaybackSourceRef.current?.disconnect();
      } catch {
        // ignore
      }

      remotePlaybackSourceRef.current = playbackContext.createMediaStreamSource(stream);
      remotePlaybackSourceRef.current.connect(playbackContext.destination);

      if (audioElement) {
        audioElement.muted = true;
      }
      setNeedsAudioUnlock(false);
      return;
    } catch {
      if (!audioElement) {
        return;
      }

      audioElement.muted = false;
      void audioElement.play().then(() => {
        setNeedsAudioUnlock(false);
      }).catch(() => {
        setNeedsAudioUnlock(true);
      });
    }
  };

  const unlockAudioPlayback = async () => {
    const audioElement = remoteAudioRef.current;

    try {
      if (!remotePlaybackContextRef.current) {
        remotePlaybackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playbackContext = remotePlaybackContextRef.current;
      if (playbackContext) {
        await playbackContext.resume().catch(() => {
          // ignore
        });
      }
    } catch {
      // ignore
    }

    if (audioElement) {
      audioElement.muted = false;
      await audioElement.play().catch(() => {
        // ignore
      });
    }

    setNeedsAudioUnlock(false);
  };

  const flushPendingIceCandidates = async (peer: RTCPeerConnection) => {
    const candidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore malformed/late candidates.
      }
    }
  };

  const sendSignal = async (signalType: CallSignalType, signalPayload: Record<string, unknown>) => {
    if (!callSession) {
      return;
    }

    try {
      await sendCallSignal(callSession.id, signalType, signalPayload);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to send call signal';
      setError(message);
    }
  };

  const createAndSendOffer = async () => {
    const peer = peerRef.current;
    if (!peer || offerSentRef.current) {
      return;
    }

    offerSentRef.current = true;
    setConnectionState('connecting');

    try {
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
      await peer.setLocalDescription(offer);
      await sendSignal('offer', { description: offer });
    } catch (requestError) {
      offerSentRef.current = false;
      const message = requestError instanceof Error ? requestError.message : 'Failed to create call offer';
      setError(message);
      setConnectionState('error');
    }
  };

  const processSignal = async (event: CallSignalEvent) => {
    if (!callSession || currentUserId === null) {
      return;
    }

    if (Number(event.sender_id) === Number(currentUserId)) {
      return;
    }

    const peer = peerRef.current;
    if (!peer) {
      pendingSignalsRef.current.push(event);
      return;
    }

    try {
      if (event.signal_type === 'offer') {
        const description = event.signal_payload?.description as RTCSignalDescription | undefined;
        if (!description) {
          return;
        }

        await peer.setRemoteDescription(new RTCSessionDescription(description));
        await flushPendingIceCandidates(peer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await sendSignal('answer', { description: answer });
        setConnectionState('connecting');
        return;
      }

      if (event.signal_type === 'answer') {
        const description = event.signal_payload?.description as RTCSignalDescription | undefined;
        if (!description) {
          return;
        }

        await peer.setRemoteDescription(new RTCSessionDescription(description));
        await flushPendingIceCandidates(peer);
        setConnectionState('connected');
        return;
      }

      if (event.signal_type === 'ice-candidate') {
        const candidate = event.signal_payload?.candidate as RTCIceCandidateInit | undefined;
        if (!candidate) {
          return;
        }

        if (!peer.remoteDescription) {
          pendingIceCandidatesRef.current.push(candidate);
          return;
        }

        await peer.addIceCandidate(new RTCIceCandidate(candidate));
        return;
      }

      if (event.signal_type === 'leave') {
        setConnectionState('ended');
        onRemoteHangup?.();
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'WebRTC signaling failed';
      setError(message);
      setConnectionState('error');
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open || !callSession) {
      cleanupPeer();
      offerSentRef.current = false;
      pendingSignalsRef.current = [];
      pendingIceCandidatesRef.current = [];
      setConnectionState('idle');
      setIsMuted(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setIsMuted(false);
    setNeedsAudioUnlock(false);
    setConnectionState(callSession.status === 'ended' ? 'ended' : (isInitiator ? 'waiting' : 'connecting'));

    const channelName = `call.${callSession.id}`;
    const echo = getEcho();
    const channel = echo?.channel(channelName);

    channel?.listen('.call.signal', (event: CallSignalEvent) => {
      void processSignal(event);
    });

    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

        if (cancelled || !isMountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        attachStreamToAudioElement(localAudioRef.current, stream);

        const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerRef.current = peer;

        remoteStreamRef.current = new MediaStream();
        if (remoteAudioRef.current) {
          remoteAudioRef.current.muted = true;
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
        }

        // Make sure this peer is prepared to both send and receive audio.
        peer.addTransceiver('audio', { direction: 'sendrecv' });

        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        peer.ontrack = (event) => {
          const [remoteStream] = event.streams;
          const mediaStream = remoteStream || remoteStreamRef.current || new MediaStream();

          if (event.track) {
            const alreadyPresent = mediaStream.getTracks().some((track) => track.id === event.track.id);
            if (!alreadyPresent) {
              mediaStream.addTrack(event.track);
            }
          }

          remoteStreamRef.current = mediaStream;
          void attachRemotePlayback(mediaStream);
          setConnectionState('connected');
        };

        peer.onicecandidate = (event) => {
          if (!event.candidate) {
            return;
          }

          const candidate = event.candidate.toJSON?.() ?? {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: (event.candidate as RTCIceCandidate & { usernameFragment?: string }).usernameFragment,
          };

          void sendSignal('ice-candidate', { candidate });
        };

        peer.onnegotiationneeded = () => {
          if (isInitiator) {
            void createAndSendOffer();
          }
        };

        peer.onconnectionstatechange = () => {
          if (peer.connectionState === 'connected') {
            if (remoteAudioRef.current && remoteStreamRef.current) {
              void attachRemotePlayback(remoteStreamRef.current);
            }

            setConnectionState('connected');
            return;
          }

          if (peer.connectionState === 'failed') {
            setConnectionState('error');
            setError('Peer connection failed.');
            return;
          }

          if (peer.connectionState === 'disconnected' || peer.connectionState === 'closed') {
            setConnectionState('ended');
          }
        };

        for (const bufferedSignal of pendingSignalsRef.current) {
          await processSignal(bufferedSignal);
        }

        pendingSignalsRef.current = [];

        if (isInitiator && callSession.status === 'accepted') {
          await createAndSendOffer();
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        const message = requestError instanceof Error ? requestError.message : 'Microphone access is required for WebRTC audio calls.';
        setError(message);
        setConnectionState('error');
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      echo?.leave(channelName);
      cleanupPeer();
      offerSentRef.current = false;
      pendingSignalsRef.current = [];
      pendingIceCandidatesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, callSession?.id]);

  useEffect(() => {
    if (!open || !callSession || !peerRef.current || !localStreamRef.current) {
      return;
    }

    if (isInitiator && callSession.status === 'accepted' && !offerSentRef.current) {
      void createAndSendOffer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, callSession?.status, callSession?.id, isInitiator]);

  useEffect(() => {
    if (!localStreamRef.current) {
      return;
    }

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  const handleEndClick = async () => {
    try {
      if (callSession) {
        await sendSignal('leave', {});
      }
    } catch {
      // Ignore signalling failure when ending locally.
    }

    onEndCall();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    void handleEndClick();
  };

  if (!callSession) {
    return null;
  }

  const callTitle = callSession.status === 'ended' ? 'Audio call ended' : 'Live audio call';
  const displayName = getDisplayName(conversation);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={true}
        className={styles.callDialogContent}
        overlayClassName={styles.callDialogOverlay}
      >
        <DialogHeader className={styles.callDialogHeader}>
          <div>
            <DialogTitle className={styles.callDialogTitle}>{callTitle}</DialogTitle>
            <DialogDescription className={styles.callDialogDescription}>
              WebRTC call with {displayName}
            </DialogDescription>
          </div>

          <div className={styles.callDialogMeta}>
            <span>
              <Users size={12} />
              {callSession.initiator?.name || 'You'}
            </span>
            <span>
              <Clock3 size={12} />
              {formatStartedAt(callSession.started_at)}
            </span>
            <span>
              <Volume2 size={12} />
              {statusText}
            </span>
          </div>
        </DialogHeader>

        <div className={styles.webrtcCallPanel}>
          <video
            className={styles.webrtcCallBackground}
            src="/callbackground.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className={styles.webrtcCallOverlay} />

          {conversation?.user?.profile_picture ? (
            <img
              src={conversation.user.profile_picture}
              alt={displayName}
              className={styles.webrtcCallAvatar}
            />
          ) : (
            <div className={styles.webrtcCallAvatar}>{getInitials(displayName)}</div>
          )}
          <div className={styles.webrtcCallBody}>
            <strong>{displayName}</strong>
            <p>{statusText}</p>
            {needsAudioUnlock ? (
              <button
                type="button"
                className={styles.webrtcCallUnlock}
                onClick={() => {
                  void unlockAudioPlayback();
                }}
              >
                Enable audio
              </button>
            ) : null}
            {connectionState === 'waiting' ? (
              <span className={styles.webrtcCallHint}>Waiting for the other user to answer.</span>
            ) : null}
            {connectionState === 'connecting' ? (
              <span className={styles.webrtcCallHint}>Negotiating the audio connection.</span>
            ) : null}
            {connectionState === 'connected' ? (
              <span className={styles.webrtcCallHint}>Secure audio link established.</span>
            ) : null}
            {error ? <span className={styles.webrtcCallError}>{error}</span> : null}
          </div>
        </div>

        <audio ref={localAudioRef} muted autoPlay playsInline />
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className={styles.webrtcCallFooter}>
          <button
            type="button"
            className={styles.webrtcCallToggle}
            onClick={() => setIsMuted((previous) => !previous)}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>

          <button type="button" className={styles.callDialogHangup} onClick={handleEndClick}>
            <PhoneOff size={16} />
            End call
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
