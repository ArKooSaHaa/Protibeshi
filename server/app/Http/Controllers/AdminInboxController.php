<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\AdminInboxService;
use App\Services\GeminiInboxService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminInboxController extends Controller
{
    public function __construct(
        private readonly AdminInboxService $adminInboxService,
        private readonly GeminiInboxService $geminiInboxService,
    ) {
    }

    public function getConversations(): JsonResponse
    {
        $inboxUserId = $this->adminInboxService->getInboxUserId();

        $conversations = Conversation::with(['userOne', 'userTwo'])
            ->withCount([
                'messages as unread_count' => function (Builder $query) use ($inboxUserId) {
                    $query->where('sender_id', '!=', $inboxUserId)
                        ->where('is_read', false);
                },
            ])
            ->where('user_one_id', $inboxUserId)
            ->orWhere('user_two_id', $inboxUserId)
            ->latest('updated_at')
            ->get()
            ->map(function (Conversation $conversation) use ($inboxUserId) {
                return $this->formatConversation($conversation, $inboxUserId);
            })
            ->values();

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ], 200);
    }

    public function searchUsers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'max:200'],
        ]);

        $term = strtolower(trim((string) $validated['q']));
        if ($term === '') {
            return response()->json([
                'success' => true,
                'users' => [],
            ], 200);
        }

        $like = '%' . $term . '%';

        $users = User::query()
            ->where(function (Builder $query) use ($like) {
                $query->whereRaw('LOWER(username) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(first_name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like]);
            })
            ->whereNotIn('username', [
                AdminInboxService::ADMIN_INBOX_USERNAME,
                GeminiInboxService::GEMINI_INBOX_USERNAME,
            ])
            ->orderByRaw('CASE WHEN LOWER(username) LIKE ? THEN 0 ELSE 1 END', [$like])
            ->orderBy('username')
            ->limit(8)
            ->get()
            ->map(function (User $user) {
                $fullName = trim(implode(' ', array_filter([$user->first_name, $user->last_name])));

                return [
                    'id' => $user->id,
                    'name' => $fullName !== '' ? $fullName : ($user->username ?? 'Unknown user'),
                    'username' => $user->username,
                    'profile_picture' => $this->resolveProfilePictureUrl($user->profile_picture),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'users' => $users,
        ], 200);
    }

    public function startConversation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $recipientId = (int) $validated['user_id'];
        $inboxUserId = $this->adminInboxService->getInboxUserId();

        if ($recipientId === $inboxUserId || $this->geminiInboxService->isInboxUserId($recipientId)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot start a conversation with a system inbox.',
            ], 422);
        }

        $userOneId = min($recipientId, $inboxUserId);
        $userTwoId = max($recipientId, $inboxUserId);

        $conversation = Conversation::firstOrCreate(
            [
                'user_one_id' => $userOneId,
                'user_two_id' => $userTwoId,
            ],
            [
                'listing_id' => null,
                'last_message' => null,
            ],
        )->load(['userOne', 'userTwo']);

        return response()->json([
            'success' => true,
            'conversation' => $this->formatConversation($conversation, $inboxUserId),
        ], 201);
    }

    public function getMessages(int $id): JsonResponse
    {
        $inboxUserId = $this->adminInboxService->getInboxUserId();

        try {
            $conversation = Conversation::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->adminInboxService->isAdminInboxConversation($conversation)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to view these messages',
            ], 403);
        }

        $messages = Message::with('sender')
            ->where('conversation_id', $conversation->id)
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

    public function sendMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => ['required', 'integer', 'exists:conversations,id'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $inboxUserId = $this->adminInboxService->getInboxUserId();

        try {
            $conversation = Conversation::findOrFail($validated['conversation_id']);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->adminInboxService->isAdminInboxConversation($conversation)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to send messages in this conversation',
            ], 403);
        }

        $message = Message::create([
            'conversation_id' => (int) $conversation->id,
            'sender_id' => $inboxUserId,
            'message' => trim((string) $validated['message']),
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

    public function markAsRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => ['required', 'integer', 'exists:conversations,id'],
        ]);

        $inboxUserId = $this->adminInboxService->getInboxUserId();

        try {
            $conversation = Conversation::findOrFail($validated['conversation_id']);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        if (!$this->adminInboxService->isAdminInboxConversation($conversation)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this conversation',
            ], 403);
        }

        $updatedCount = Message::where('conversation_id', (int) $conversation->id)
            ->where('sender_id', '!=', $inboxUserId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
            ]);

        return response()->json([
            'success' => true,
            'updated_count' => $updatedCount,
        ], 200);
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
                'name' => trim(($otherUser->first_name ?? '') . ' ' . ($otherUser->last_name ?? ''))
                    ?: ($otherUser->username ?? null),
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
                'name' => trim(($message->sender->first_name ?? '') . ' ' . ($message->sender->last_name ?? ''))
                    ?: ($message->sender->username ?? null),
                'first_name' => $message->sender->first_name,
                'last_name' => $message->sender->last_name,
                'username' => $message->sender->username,
                'profile_picture' => $this->resolveProfilePictureUrl($message->sender->profile_picture),
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
