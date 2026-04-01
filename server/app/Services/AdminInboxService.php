<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminInboxService
{
    public const ADMIN_INBOX_USERNAME = 'admin_inbox_system';
    public const ADMIN_INBOX_EMAIL = 'admin-inbox@protibeshi.local';
    public const ADMIN_CONTACT_EMAIL = 'admin@gmail.com';

    private ?User $cachedInboxUser = null;

    public function getInboxUser(): User
    {
        if ($this->cachedInboxUser instanceof User) {
            return $this->cachedInboxUser;
        }

        $inboxUser = User::withTrashed()
            ->where('username', self::ADMIN_INBOX_USERNAME)
            ->first();

        if ($inboxUser) {
            if (method_exists($inboxUser, 'trashed') && $inboxUser->trashed()) {
                $inboxUser->restore();
            }

            $this->cachedInboxUser = $inboxUser;
            return $inboxUser;
        }

        $inboxUser = User::create([
            'first_name' => 'Admin',
            'last_name' => 'Support',
            'username' => self::ADMIN_INBOX_USERNAME,
            'email' => self::ADMIN_INBOX_EMAIL,
            'password' => Hash::make(Str::random(48)),
            'bio' => 'System-managed inbox for moderation updates.',
        ]);

        $this->cachedInboxUser = $inboxUser;

        return $inboxUser;
    }

    public function getInboxUserId(): int
    {
        return (int) $this->getInboxUser()->id;
    }

    public function isInboxUserId(int $userId): bool
    {
        return $userId === $this->getInboxUserId();
    }

    public function isAdminInboxConversation(Conversation $conversation): bool
    {
        $inboxUserId = $this->getInboxUserId();

        return (int) $conversation->user_one_id === $inboxUserId
            || (int) $conversation->user_two_id === $inboxUserId;
    }

    public function sendPostDeletedNotice(Post $post): Message
    {
        $recipientId = (int) $post->user_id;
        $conversation = $this->getOrCreateConversationForRecipient($recipientId);

        $messageBody = $this->buildDeletionMessage($post);

        $message = Message::create([
            'conversation_id' => (int) $conversation->id,
            'sender_id' => $this->getInboxUserId(),
            'message' => $messageBody,
            'is_read' => false,
        ]);

        $conversation->last_message = $messageBody;
        $conversation->save();

        return $message;
    }

    private function getOrCreateConversationForRecipient(int $recipientId): Conversation
    {
        $inboxUserId = $this->getInboxUserId();

        $userOneId = min($recipientId, $inboxUserId);
        $userTwoId = max($recipientId, $inboxUserId);

        return Conversation::firstOrCreate(
            [
                'user_one_id' => $userOneId,
                'user_two_id' => $userTwoId,
            ],
            [
                'listing_id' => null,
                'last_message' => null,
            ],
        );
    }

    private function buildDeletionMessage(Post $post): string
    {
        $title = trim((string) $post->title);
        $content = trim((string) $post->content);
        $location = trim((string) ($post->location ?? ''));

        $contentSnippet = Str::limit($content, 260, '...');

        $parts = [
            'Your post has been deleted by the admin moderation team.',
            '',
            'Post details:',
            '- Post ID: ' . (string) $post->id,
            '- Title: ' . ($title !== '' ? $title : 'N/A'),
            '- Content: ' . ($contentSnippet !== '' ? $contentSnippet : 'N/A'),
        ];

        if ($location !== '') {
            $parts[] = '- Location: ' . $location;
        }

        $parts[] = '';
        $parts[] = 'If you think this action is a mistake, contact on ' . self::ADMIN_CONTACT_EMAIL . '.';

        return implode("\n", $parts);
    }
}
