<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\CallStarted;
use App\Events\CallAccepted;
use App\Events\CallEnded;
use App\Events\CallSignal;
use App\Models\Conversation;
use App\Models\ConversationCallSession;
use App\Models\Message;
use App\Services\AdminInboxService;
use App\Services\GeminiInboxService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    private AdminInboxService $adminInboxService;
    private GeminiInboxService $geminiInboxService;

    public function __construct(AdminInboxService $adminInboxService, GeminiInboxService $geminiInboxService)
    {
        $this->adminInboxService = $adminInboxService;
        $this->geminiInboxService = $geminiInboxService;
    }

    public function startConversation(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|integer|exists:users,id',
            'listing_id' => 'nullable|integer|exists:listings,id',
        ]);

        $authId = (int) Auth::id();
        $receiverId = (int) $validated['receiver_id'];

        if ($receiverId === $authId) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot start a conversation with yourself',
            ], 422);
        }

        if ($this->adminInboxService->isInboxUserId($receiverId)) {
            return response()->json([
                'success' => false,
                'message' => 'Direct messaging to admin inbox is not allowed',
            ], 403);
        }

        $existingConversation = Conversation::with(['userOne', 'userTwo'])
            ->where(function ($query) use ($authId, $receiverId) {
                $query->where('user_one_id', $authId)
                    ->where('user_two_id', $receiverId);
            })
            ->orWhere(function ($query) use ($authId, $receiverId) {
                $query->where('user_one_id', $receiverId)
                    ->where('user_two_id', $authId);
            })
            ->first();

        if ($existingConversation) {
            return response()->json([
                'success' => true,
                'conversation' => $this->formatConversation($existingConversation, $authId),
            ], 200);
        }

        $userOneId = min($authId, $receiverId);
        $userTwoId = max($authId, $receiverId);

        $conversation = Conversation::create([
            'user_one_id' => $userOneId,
            'user_two_id' => $userTwoId,
            'listing_id' => $validated['listing_id'] ?? null,
            'last_message' => null,
        ])->load(['userOne', 'userTwo']);

        return response()->json([
            'success' => true,
            'conversation' => $this->formatConversation($conversation, $authId),
        ], 201);
    }

    public function getUserConversations()
    {
        $authId = (int) Auth::id();

        // Ensure each user always has a Gemini inbox conversation persisted in DB.
        $this->geminiInboxService->getOrCreateConversationForRecipient($authId);

        $conversations = Conversation::with(['userOne', 'userTwo'])
            ->withCount([
                'messages as unread_count' => function ($query) use ($authId) {
                    $query->where('sender_id', '!=', $authId)
                        ->where('is_read', false);
                },
            ])
            ->where('user_one_id', $authId)
            ->orWhere('user_two_id', $authId)
            ->latest('updated_at')
            ->get()
            ->map(function (Conversation $conversation) use ($authId) {
                return $this->formatConversation($conversation, $authId);
            })
            ->values();

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ], 200);
    }

    public function saveGeminiReply(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|integer|exists:conversations,id',
            'message' => 'required|string|max:5000',
        ]);

        $authId = (int) Auth::id();

        try {
            $conversation = Conversation::findOrFail($validated['conversation_id']);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to send messages in this conversation',
            ], 403);
        }

        if (!$this->geminiInboxService->isGeminiInboxConversation($conversation)) {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is only for Gemini inbox conversations',
            ], 422);
        }

        if ($this->geminiInboxService->isInboxUserId($authId)) {
            return response()->json([
                'success' => false,
                'message' => 'Gemini inbox user cannot call this endpoint',
            ], 403);
        }

        $message = $this->geminiInboxService
            ->saveAssistantReply($conversation, (string) $validated['message'])
            ->load('sender');

        return response()->json([
            'success' => true,
            'message' => $this->formatMessage($message),
        ], 201);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|integer|exists:conversations,id',
            'message' => 'required|string|max:5000',
        ]);

        $authId = (int) Auth::id();

        try {
            $conversation = Conversation::findOrFail($validated['conversation_id']);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to send messages in this conversation',
            ], 403);
        }

        if ($this->adminInboxService->isAdminInboxConversation($conversation)
            && !$this->adminInboxService->isInboxUserId($authId)) {
            return response()->json([
                'success' => false,
                'message' => 'This admin inbox is read-only. Contact on ' . AdminInboxService::ADMIN_CONTACT_EMAIL,
            ], 403);
        }

        $message = Message::create([
            'conversation_id' => (int) $validated['conversation_id'],
            'sender_id' => $authId,
            'message' => trim($validated['message']),
            'is_read' => false,
        ])->load('sender');

        $conversation->last_message = $message->message;
        $conversation->save();

        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'success' => true,
            'message' => $this->formatMessage($message),
        ], 201);
    }

    public function getMessages($id)
    {
        $authId = (int) Auth::id();

        try {
            $conversation = Conversation::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view these messages',
            ], 403);
        }

        $messages = Message::with('sender')
            ->where('conversation_id', (int) $id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function (Message $message) {
                return $this->formatMessage($message);
            })
            ->values();

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ], 200);
    }

    public function markAsRead(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|integer|exists:conversations,id',
        ]);

        $authId = (int) Auth::id();

        try {
            $conversation = Conversation::findOrFail($validated['conversation_id']);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this conversation',
            ], 403);
        }

        $updatedCount = Message::where('conversation_id', (int) $validated['conversation_id'])
            ->where('sender_id', '!=', $authId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
            ]);

        return response()->json([
            'success' => true,
            'updated_count' => $updatedCount,
        ], 200);
    }

    public function deleteConversation($id)
    {
        $authId = (int) Auth::id();

        try {
            $conversation = Conversation::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this conversation',
            ], 403);
        }

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully',
        ], 200);
    }

    public function startAudioCall(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|integer|exists:conversations,id',
        ]);

        $authId = (int) Auth::id();

        try {
            $conversation = Conversation::with(['userOne', 'userTwo'])->findOrFail($validated['conversation_id']);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to start calls in this conversation',
            ], 403);
        }

        if ($this->adminInboxService->isAdminInboxConversation($conversation)
            && !$this->adminInboxService->isInboxUserId($authId)) {
            return response()->json([
                'success' => false,
                'message' => 'Calls are not available in the admin inbox',
            ], 422);
        }

        if ($this->geminiInboxService->isGeminiInboxConversation($conversation)) {
            return response()->json([
                'success' => false,
                'message' => 'Calls are not available in the Gemini inbox',
            ], 422);
        }

        $roomName = sprintf('protibeshi-%d-%s', (int) $conversation->id, Str::lower(Str::random(12)));
        $joinUrl = sprintf('webrtc://%s', $roomName);

        $callSession = ConversationCallSession::create([
            'conversation_id' => (int) $conversation->id,
            'initiator_id' => $authId,
            'call_type' => 'audio',
            'status' => 'active',
            'room_name' => $roomName,
            'jitsi_join_url' => $joinUrl,
            'started_at' => now(),
            'accepted_at' => null,
            'duration_seconds' => 0,
        ])->load('initiator');

        $recipientId = (int) ($conversation->user_one_id === $authId ? $conversation->user_two_id : $conversation->user_one_id);
        broadcast(new CallStarted($callSession, $recipientId))->toOthers();

        return response()->json([
            'success' => true,
            'call_session' => $this->formatCallSession($callSession),
        ], 201);
    }

    public function getConversationCalls($id)
    {
        $authId = (int) Auth::id();

        try {
            $conversation = Conversation::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view these call logs',
            ], 403);
        }

        $callSessions = ConversationCallSession::with('initiator')
            ->where('conversation_id', (int) $id)
            ->orderByDesc('started_at')
            ->get()
            ->map(function (ConversationCallSession $callSession) {
                return $this->formatCallSession($callSession);
            })
            ->values();

        return response()->json([
            'success' => true,
            'call_sessions' => $callSessions,
        ], 200);
    }

    public function getCallSession($id)
    {
        $authId = (int) Auth::id();

        try {
            $callSession = ConversationCallSession::with(['initiator', 'conversation.userOne', 'conversation.userTwo'])
                ->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Call session not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($callSession->conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view this call session',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'call_session' => $this->formatCallSession($callSession),
        ], 200);
    }

    public function getActiveIncomingCall()
    {
        $authId = (int) Auth::id();

        $callSession = ConversationCallSession::with(['initiator', 'conversation.userOne', 'conversation.userTwo'])
            ->where('status', 'active')
            ->whereNull('ended_at')
            ->whereHas('conversation', function ($query) use ($authId) {
                $query->where(function ($nested) use ($authId) {
                    $nested->where('user_one_id', $authId)
                        ->orWhere('user_two_id', $authId);
                });
            })
            ->where('initiator_id', '!=', $authId)
            ->latest('started_at')
            ->first();

        return response()->json([
            'success' => true,
            'call_session' => $callSession ? $this->formatCallSession($callSession) : null,
        ], 200);
    }

    public function endCallSession(Request $request, $id)
    {
        $authId = (int) Auth::id();

        try {
            $callSession = ConversationCallSession::with('conversation')->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Call session not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($callSession->conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this call session',
            ], 403);
        }

        if ($callSession->ended_at === null) {
            $endedAt = now();
            $callSession->ended_at = $endedAt;
            $callSession->status = 'ended';
            $callSession->duration_seconds = max(0, $callSession->started_at?->diffInSeconds($endedAt) ?? 0);
            $callSession->save();
            $recipientId = (int) ($callSession->conversation->user_one_id === $authId
                ? $callSession->conversation->user_two_id
                : $callSession->conversation->user_one_id);

            broadcast(new CallEnded($callSession, $recipientId))->toOthers();
        }

        return response()->json([
            'success' => true,
            'call_session' => $this->formatCallSession($callSession->load('initiator')),
        ], 200);
    }

    public function acceptCallSession(Request $request, $id)
    {
        $authId = (int) Auth::id();

        try {
            $callSession = ConversationCallSession::with('conversation')->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Call session not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($callSession->conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to accept this call',
            ], 403);
        }

        if ($callSession->status !== 'active') {
            // if already accepted/ended, just return current state
            return response()->json([
                'success' => true,
                'call_session' => $this->formatCallSession($callSession->load('initiator')),
            ], 200);
        }

        $callSession->status = 'accepted';
        $callSession->accepted_at = $callSession->accepted_at ?? now();
        $callSession->save();

        $recipientId = (int) ($callSession->conversation->user_one_id === $authId
            ? $callSession->conversation->user_two_id
            : $callSession->conversation->user_one_id);

        broadcast(new CallAccepted($callSession, $recipientId))->toOthers();

        return response()->json([
            'success' => true,
            'call_session' => $this->formatCallSession($callSession->load('initiator')),
        ], 200);
    }

    public function sendCallSignal(Request $request, $id)
    {
        $validated = $request->validate([
            'signal_type' => 'required|string|in:offer,answer,ice-candidate,leave',
            'signal_payload' => 'required|array',
        ]);

        $authId = (int) Auth::id();

        try {
            $callSession = ConversationCallSession::with('conversation')->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Call session not found',
            ], 404);
        }

        if (!$this->isConversationParticipant($callSession->conversation, $authId)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to send signaling messages for this call',
            ], 403);
        }

        $recipientId = $this->getOtherParticipantId($callSession->conversation, $authId);

        broadcast(new CallSignal($callSession, $authId, $validated['signal_type'], $validated['signal_payload']))->toOthers();

        return response()->json([
            'success' => true,
            'recipient_id' => $recipientId,
        ], 200);
    }

    private function isConversationParticipant(Conversation $conversation, int $authId): bool
    {
        return (int) $conversation->user_one_id === $authId
            || (int) $conversation->user_two_id === $authId;
    }

    private function getOtherParticipantId(Conversation $conversation, int $authId): int
    {
        return (int) ($conversation->user_one_id === $authId
            ? $conversation->user_two_id
            : $conversation->user_one_id);
    }

    private function formatConversation(Conversation $conversation, int $authId): array
    {
        $otherUser = (int) $conversation->user_one_id === $authId
            ? $conversation->userTwo
            : $conversation->userOne;

        $isAdminInboxConversation = $this->adminInboxService->isAdminInboxConversation($conversation);
        $isGeminiInboxConversation = $this->geminiInboxService->isGeminiInboxConversation($conversation);
        $isReadOnlyForCurrentUser = $isAdminInboxConversation && !$this->adminInboxService->isInboxUserId($authId);

        return [
            'id' => $conversation->id,
            'listing_id' => $conversation->listing_id,
            'last_message' => $conversation->last_message,
            'created_at' => $conversation->created_at,
            'updated_at' => $conversation->updated_at,
            'unread_count' => isset($conversation->unread_count) ? (int) $conversation->unread_count : 0,
            'is_admin_inbox' => $isAdminInboxConversation,
            'is_gemini_inbox' => $isGeminiInboxConversation,
            'is_read_only' => $isReadOnlyForCurrentUser,
            'admin_contact_email' => $isAdminInboxConversation ? AdminInboxService::ADMIN_CONTACT_EMAIL : null,
            'user' => $otherUser ? [
                'id' => $otherUser->id,
                'name' => trim(($otherUser->first_name ?? '') . ' ' . ($otherUser->last_name ?? '')) ?: ($otherUser->username ?? null),
                'first_name' => $otherUser->first_name,
                'last_name' => $otherUser->last_name,
                'username' => $otherUser->username,
                'profile_picture' => $this->resolveProfilePictureUrl($otherUser->profile_picture),
            ] : null,
        ];
    }

    private function formatMessage(Message $message): array
    {
        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'message' => $message->message,
            'sender_id' => $message->sender_id,
            'is_read' => (bool) $message->is_read,
            'created_at' => $message->created_at,
            'updated_at' => $message->updated_at,
            'sender' => $message->sender ? [
                'id' => $message->sender->id,
                'name' => trim(($message->sender->first_name ?? '') . ' ' . ($message->sender->last_name ?? '')) ?: ($message->sender->username ?? null),
                'first_name' => $message->sender->first_name,
                'last_name' => $message->sender->last_name,
                'username' => $message->sender->username,
                'profile_picture' => $this->resolveProfilePictureUrl($message->sender->profile_picture),
            ] : null,
        ];
    }

    private function formatCallSession(ConversationCallSession $callSession): array
    {
        return [
            'id' => $callSession->id,
            'conversation_id' => $callSession->conversation_id,
            'initiator_id' => $callSession->initiator_id,
            'call_type' => $callSession->call_type,
            'status' => $callSession->status,
            'room_name' => $callSession->room_name,
            'jitsi_join_url' => $callSession->jitsi_join_url,
            'started_at' => $callSession->started_at,
            'accepted_at' => $callSession->accepted_at,
            'ended_at' => $callSession->ended_at,
            'duration_seconds' => (int) $callSession->duration_seconds,
            'initiator' => $callSession->initiator ? [
                'id' => $callSession->initiator->id,
                'name' => trim(($callSession->initiator->first_name ?? '') . ' ' . ($callSession->initiator->last_name ?? '')) ?: ($callSession->initiator->username ?? null),
                'first_name' => $callSession->initiator->first_name,
                'last_name' => $callSession->initiator->last_name,
                'username' => $callSession->initiator->username,
                'profile_picture' => $this->resolveProfilePictureUrl($callSession->initiator->profile_picture),
            ] : null,
        ];
    }

    private function resolveProfilePictureUrl(?string $profilePicture): string
    {
        if (!$profilePicture) {
            return '';
        }

        if (filter_var($profilePicture, FILTER_VALIDATE_URL)) {
            return $profilePicture;
        }

        if (str_starts_with($profilePicture, '/')) {
            return url($profilePicture);
        }

        return url(Storage::url($profilePicture));
    }
}
