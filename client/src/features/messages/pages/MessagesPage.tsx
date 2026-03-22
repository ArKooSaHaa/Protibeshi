import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCheck,
  CircleDot,
  Mic,
  Paperclip,
  Phone,
  Search,
  SendHorizonal,
  Smile,
  Video,
} from 'lucide-react';
import styles from './MessagesPage.module.css';

type Sender = 'me' | 'them';

interface MessageItem {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface ConversationItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  online: boolean;
  unread: number;
  typing?: boolean;
  messages: MessageItem[];
}

const seedConversations: ConversationItem[] = [
  {
    id: 'c-1',
    name: 'Shanta Akter',
    handle: 'Last seen 2m ago',
    avatar: 'SA',
    online: true,
    unread: 2,
    typing: true,
    messages: [
      { id: 'm-1', sender: 'them', text: 'Assalamu alaikum. Are you free for a quick call?', time: '9:18 PM' },
      { id: 'm-2', sender: 'me', text: 'Wa alaikum assalam. Yes, give me 10 minutes.', time: '9:20 PM', status: 'read' },
      { id: 'm-3', sender: 'them', text: 'Perfect. I can also send the details here.', time: '9:21 PM' },
    ],
  },
  {
    id: 'c-2',
    name: 'Rafid Hasan',
    handle: 'Online',
    avatar: 'RH',
    online: true,
    unread: 0,
    messages: [
      { id: 'm-4', sender: 'them', text: 'Can we meet tomorrow at 6 PM?', time: '8:55 PM' },
      { id: 'm-5', sender: 'me', text: 'Yes, near Shahbagh works for me.', time: '8:58 PM', status: 'delivered' },
    ],
  },
  {
    id: 'c-3',
    name: 'Nabila Rahman',
    handle: 'Last seen today',
    avatar: 'NR',
    online: false,
    unread: 4,
    messages: [
      { id: 'm-6', sender: 'them', text: 'Shared the updated notes in the group.', time: '7:12 PM' },
      { id: 'm-7', sender: 'me', text: 'Got it, thank you.', time: '7:30 PM', status: 'read' },
      { id: 'm-8', sender: 'them', text: 'Please check section 3 before tonight.', time: '7:45 PM' },
    ],
  },
];

const getPreview = (messages: MessageItem[]) => messages[messages.length - 1]?.text || 'No messages yet';

export const MessagesPage = () => {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(seedConversations[0].id);
  const [conversations, setConversations] = useState(seedConversations);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const preview = getPreview(conversation.messages).toLowerCase();
      return (
        conversation.name.toLowerCase().includes(normalizedQuery) ||
        preview.includes(normalizedQuery)
      );
    });
  }, [conversations, query]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0];

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [activeConversationId]);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeConversation?.messages.length]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeConversation) {
      return;
    }

    const newMessage: MessageItem = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text,
      time: 'Now',
      status: 'sent',
    };

    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              unread: 0,
              typing: false,
              messages: [...conversation.messages, newMessage],
            }
          : conversation
      )
    );

    setDraft('');
  };

  return (
    <section className={styles.page}>
      <div className={styles.messagingShell}>
        <aside className={styles.chatListPane}>
          <div className={styles.searchWrap}>
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
            />
          </div>

          <div className={styles.chatList}>
            {filteredConversations.map((conversation) => {
              const preview = getPreview(conversation.messages);
              const isActive = conversation.id === activeConversation?.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ''}`}
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    setConversations((previousConversations) =>
                      previousConversations.map((item) =>
                        item.id === conversation.id ? { ...item, unread: 0 } : item
                      )
                    );
                  }}
                >
                  <div className={styles.avatar}>
                    {conversation.avatar}
                    {conversation.online && <span className={styles.onlineDot} aria-hidden="true" />}
                  </div>
                  <div className={styles.chatMeta}>
                    <div className={styles.chatMetaHead}>
                      <h3>{conversation.name}</h3>
                      <span>{conversation.messages[conversation.messages.length - 1]?.time}</span>
                    </div>
                    <div className={styles.chatMetaBody}>
                      <p>{conversation.typing ? 'Typing...' : preview}</p>
                      {conversation.unread > 0 && <small>{conversation.unread}</small>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <article className={styles.chatPane}>
          {activeConversation ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatIdentity}>
                  <div className={styles.avatar}>{activeConversation.avatar}</div>
                  <div>
                    <h2>{activeConversation.name}</h2>
                    <p>
                      {activeConversation.online ? (
                        <>
                          <CircleDot size={12} /> Active now
                        </>
                      ) : (
                        activeConversation.handle
                      )}
                    </p>
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <button type="button" aria-label="Voice call">
                    <Phone size={16} />
                  </button>
                  <button type="button" aria-label="Video call">
                    <Video size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.messageStream}>
                {activeConversation.messages.map((message) => {
                  const mine = message.sender === 'me';
                  return (
                    <div
                      key={message.id}
                      className={`${styles.messageRow} ${mine ? styles.messageRowMine : ''}`}
                    >
                      <div className={`${styles.messageBubble} ${mine ? styles.messageBubbleMine : ''}`}>
                        <p>{message.text}</p>
                        <div className={styles.messageMeta}>
                          <span>{message.time}</span>
                          {mine && (
                            <span className={styles.statusWrap}>
                              <CheckCheck size={12} />
                              {message.status || 'sent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomAnchorRef} />
              </div>

              <form
                className={styles.composer}
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
              >
                <button type="button" className={styles.composerAction} aria-label="Attach file">
                  <Paperclip size={17} />
                </button>
                <button type="button" className={styles.composerAction} aria-label="Open emoji picker">
                  <Smile size={17} />
                </button>
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a message"
                  aria-label="Type message"
                />
                <button type="button" className={styles.composerAction} aria-label="Record voice message">
                  <Mic size={17} />
                </button>
                <button type="submit" className={styles.sendButton} aria-label="Send message">
                  <SendHorizonal size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className={styles.emptyState}>Choose a conversation to start messaging.</div>
          )}
        </article>
      </div>
    </section>
  );
};
