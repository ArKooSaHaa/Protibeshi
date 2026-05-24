<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GeminiInboxService
{
    public const GEMINI_INBOX_USERNAME = 'gemini_ai';
    public const GEMINI_INBOX_EMAIL = 'gemini-inbox@protibeshi.local';

    private ?User $cachedInboxUser = null;

    public function getInboxUser(): User
    {
        if ($this->cachedInboxUser instanceof User) {
            return $this->cachedInboxUser;
        }

        $inboxUser = User::withTrashed()
            ->where('username', self::GEMINI_INBOX_USERNAME)
            ->first();

        if ($inboxUser) {
            if (method_exists($inboxUser, 'trashed') && $inboxUser->trashed()) {
                $inboxUser->restore();
            }

            $this->cachedInboxUser = $inboxUser;
            return $inboxUser;
        }

        $inboxUser = User::create([
            'first_name' => 'Gemini',
            'last_name' => 'Inbox',
            'username' => self::GEMINI_INBOX_USERNAME,
            'email' => self::GEMINI_INBOX_EMAIL,
            'password' => Hash::make(Str::random(48)),
            'bio' => 'System-managed AI assistant inbox.',
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

    public function isGeminiInboxConversation(Conversation $conversation): bool
    {
        $inboxUserId = $this->getInboxUserId();

        return (int) $conversation->user_one_id === $inboxUserId
            || (int) $conversation->user_two_id === $inboxUserId;
    }

    public function getOrCreateConversationForRecipient(int $recipientId): Conversation
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

    public function saveAssistantReply(Conversation $conversation, string $reply): Message
    {
        $message = Message::create([
            'conversation_id' => (int) $conversation->id,
            'sender_id' => $this->getInboxUserId(),
            'message' => trim($reply),
            'is_read' => true,
        ]);

        $conversation->last_message = $message->message;
        $conversation->save();

        return $message;
    }

    public function getGeminiApiKey(): ?string
    {
        $apiKey = env('GEMINI_API_KEY') ?: env('VITE_GEMINI_API_KEY');

        if (!is_string($apiKey)) {
            return null;
        }

        $apiKey = trim($apiKey);

        return $apiKey !== '' ? $apiKey : null;
    }
}
