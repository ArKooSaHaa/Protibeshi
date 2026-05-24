<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Listing;
use App\Models\Message;
use App\Models\Post;
use App\Models\Relief;
use App\Models\RentListing;
use App\Models\User;
use Illuminate\Support\Carbon;
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

    public function sendListingBanNotice(User $recipient, Carbon $banEndsAt, ?string $reason, int $durationDays): Message
    {
        $conversation = $this->getOrCreateConversationForRecipient((int) $recipient->id);

        $messageBody = $this->buildListingBanMessage($recipient, $banEndsAt, $reason, $durationDays);

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

    public function sendUserBanNotice(User $recipient, Carbon $banEndsAt, ?string $reason, int $durationDays): Message
    {
        $conversation = $this->getOrCreateConversationForRecipient((int) $recipient->id);

        $messageBody = $this->buildUserBanMessage($recipient, $banEndsAt, $reason, $durationDays);

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

    public function sendUserUnbanNotice(User $recipient): Message
    {
        $conversation = $this->getOrCreateConversationForRecipient((int) $recipient->id);

        $messageBody = $this->buildUserUnbanMessage($recipient);

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

    public function sendListingDeletedNotice(Listing $listing, ?string $reason = null): Message
    {
        $recipientId = (int) $listing->user_id;
        $conversation = $this->getOrCreateConversationForRecipient($recipientId);

        $messageBody = $this->buildListingDeletionMessage($listing, $reason);

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

    public function sendRentListingDeletedNotice(RentListing $listing, ?string $reason = null): Message
    {
        $recipientId = (int) $listing->user_id;
        $conversation = $this->getOrCreateConversationForRecipient($recipientId);

        $messageBody = $this->buildRentListingDeletionMessage($listing, $reason);

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

    public function sendReliefDeletedNotice(Relief $relief, ?string $reason = null): Message
    {
        $recipientId = (int) $relief->user_id;
        $conversation = $this->getOrCreateConversationForRecipient($recipientId);

        $messageBody = $this->buildReliefDeletionMessage($relief, $reason);

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

    private function buildListingBanMessage(User $recipient, Carbon $banEndsAt, ?string $reason, int $durationDays): string
    {
        $recipientName = trim((string) ($recipient->first_name ?? ''));
        if ($recipientName === '') {
            $recipientName = 'Neighbor';
        }

        $normalizedReason = trim((string) ($reason ?? ''));

        $parts = [
            'Hello ' . $recipientName . ',',
            '',
            'Your account is temporarily banned from posting listings for the next ' . $durationDays . ' days.',
            'Ban ends on: ' . $banEndsAt->toDayDateTimeString(),
            'Your active listings were removed by the moderation team during this period.',
            'After the ban period ends, you can post listings again.',
        ];

        if ($normalizedReason !== '') {
            $parts[] = 'Reason: ' . $normalizedReason;
        }

        $parts[] = '';
        $parts[] = 'If you think this action is a mistake, contact on ' . self::ADMIN_CONTACT_EMAIL . '.';

        return implode("\n", $parts);
    }

    private function buildUserBanMessage(User $recipient, Carbon $banEndsAt, ?string $reason, int $durationDays): string
    {
        $recipientName = trim((string) ($recipient->first_name ?? ''));
        if ($recipientName === '') {
            $recipientName = 'Neighbor';
        }

        $normalizedReason = trim((string) ($reason ?? ''));

        $parts = [
            'Hello ' . $recipientName . ',',
            '',
            'You have been banned for ' . ($normalizedReason !== '' ? $normalizedReason : 'violating the community guidelines') . '.',
            'During this period, you cannot create feed posts, marketplace listings, rent listings, services, complaints, or relief requests.',
            'Ban ends on: ' . $banEndsAt->toDayDateTimeString(),
        ];

        if ($durationDays > 0) {
            $parts[] = 'Ban duration: ' . $durationDays . ' day' . ($durationDays === 1 ? '' : 's') . '.';
        }

        $parts[] = '';
        $parts[] = 'If you think this action is a mistake, contact on ' . self::ADMIN_CONTACT_EMAIL . '.';

        return implode("\n", $parts);
    }

    private function buildUserUnbanMessage(User $recipient): string
    {
        $recipientName = trim((string) ($recipient->first_name ?? ''));
        if ($recipientName === '') {
            $recipientName = 'Neighbor';
        }

        $parts = [
            'Hello ' . $recipientName . ',',
            '',
            'Your ban has been lifted by the admin moderation team.',
            'You can create posts, listings, services, complaints, and relief requests again.',
            '',
            'If you need help, contact on ' . self::ADMIN_CONTACT_EMAIL . '.',
        ];

        return implode("\n", $parts);
    }

    private function buildListingDeletionMessage(Listing $listing, ?string $reason): string
    {
        $title = trim((string) $listing->title);
        $category = trim((string) ($listing->category ?? ''));
        $location = trim((string) ($listing->location ?? ''));
        $details = trim((string) ($listing->details ?? ''));
        $detailsSnippet = Str::limit($details, 260, '...');
        $price = is_numeric($listing->price) ? number_format((float) $listing->price, 2) : 'N/A';

        $parts = [
            'Your marketplace listing has been deleted by the admin moderation team.',
            '',
            'Listing details:',
            '- Listing ID: ' . (string) $listing->id,
            '- Title: ' . ($title !== '' ? $title : 'N/A'),
            '- Category: ' . ($category !== '' ? $category : 'N/A'),
            '- Price: BDT ' . $price,
            '- Location: ' . ($location !== '' ? $location : 'N/A'),
        ];

        if ($detailsSnippet !== '') {
            $parts[] = '- Details: ' . $detailsSnippet;
        }

        $parts[] = 'Reason: ' . $this->resolveListingDeletionReason($listing, $reason);
        $parts[] = '';
        $parts[] = 'If you think this action is a mistake, contact on ' . self::ADMIN_CONTACT_EMAIL . '.';

        return implode("\n", $parts);
    }

    private function resolveListingDeletionReason(Listing $listing, ?string $reason): string
    {
        $normalizedReason = trim((string) ($reason ?? ''));
        if ($normalizedReason !== '') {
            return $normalizedReason;
        }

        $reports = $listing->relationLoaded('reports') ? $listing->reports : $listing->reports()->get();

        $reportReasons = $reports
            ->pluck('reason')
            ->filter(fn ($value) => is_string($value) && trim($value) !== '')
            ->map(fn ($value) => trim((string) $value))
            ->unique()
            ->values();

        if ($reportReasons->count() > 0) {
            $reportCount = (int) $reports->count();
            $reasonPreview = $reportReasons->take(3)->implode('; ');

            if ($reasonPreview !== '') {
                return 'Reported by community members ('
                    .$reportCount
                    .' report'
                    .($reportCount === 1 ? '' : 's')
                    .'): '
                    .$reasonPreview;
            }

            return 'Deleted after receiving community reports.';
        }

        return 'Violating marketplace community rules.';
    }

    private function buildRentListingDeletionMessage(RentListing $listing, ?string $reason): string
    {
        $title = trim((string) $listing->title);
        $location = trim((string) ($listing->location ?? ''));
        $propertyType = trim((string) ($listing->type ?? ''));
        $availability = trim((string) ($listing->availability ?? ''));
        $furnishing = trim((string) ($listing->furnishing ?? ''));
        $price = is_numeric($listing->price) ? number_format((float) $listing->price, 2) : 'N/A';
        $deposit = is_numeric($listing->deposit) ? number_format((float) $listing->deposit, 2) : 'N/A';

        $normalizedReason = trim((string) ($reason ?? ''));
        if ($normalizedReason === '') {
            $normalizedReason = 'Violating rent community rules.';
        }

        $parts = [
            'Your rent listing has been deleted by the admin moderation team.',
            '',
            'Listing details:',
            '- Listing ID: ' . (string) $listing->id,
            '- Title: ' . ($title !== '' ? $title : 'N/A'),
            '- Price: BDT ' . $price,
            '- Deposit: BDT ' . $deposit,
            '- Location: ' . ($location !== '' ? $location : 'N/A'),
            '- Type: ' . ($propertyType !== '' ? $propertyType : 'N/A'),
            '- Furnishing: ' . ($furnishing !== '' ? $furnishing : 'N/A'),
            '- Availability: ' . ($availability !== '' ? $availability : 'N/A'),
            'Reason: ' . $normalizedReason,
            '',
            'If you think this action is a mistake, contact on ' . self::ADMIN_CONTACT_EMAIL . '.',
        ];

        return implode("\n", $parts);
    }

    private function buildReliefDeletionMessage(Relief $relief, ?string $reason): string
    {
        $title = trim((string) $relief->title);
        $type = trim((string) ($relief->type ?? ''));
        $urgency = trim((string) ($relief->urgency ?? ''));
        $status = trim((string) ($relief->status ?? ''));
        $location = trim((string) ($relief->location ?? ''));
        $description = trim((string) ($relief->description ?? ''));
        $descriptionSnippet = Str::limit($description, 260, '...');
        $normalizedReason = trim((string) ($reason ?? ''));

        if ($normalizedReason === '') {
            $normalizedReason = 'Violating relief board community guidelines.';
        }

        $parts = [
            'Your relief request has been removed by the admin moderation team.',
            '',
            'Relief details:',
            '- Relief ID: ' . (string) $relief->id,
            '- Title: ' . ($title !== '' ? $title : 'N/A'),
            '- Type: ' . ($type !== '' ? $type : 'N/A'),
            '- Urgency: ' . ($urgency !== '' ? $urgency : 'N/A'),
            '- Status: ' . ($status !== '' ? $status : 'N/A'),
            '- Location: ' . ($location !== '' ? $location : 'N/A'),
        ];

        if ($descriptionSnippet !== '') {
            $parts[] = '- Description: ' . $descriptionSnippet;
        }

        $parts[] = 'Reason: ' . $normalizedReason;
        $parts[] = '';
        $parts[] = 'If you think this action is a mistake, contact on ' . self::ADMIN_CONTACT_EMAIL . '.';

        return implode("\n", $parts);
    }
}
