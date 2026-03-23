<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
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

    private function isConversationParticipant(Conversation $conversation, int $authId): bool
    {
        return (int) $conversation->user_one_id === $authId
            || (int) $conversation->user_two_id === $authId;
    }

    private function formatConversation(Conversation $conversation, int $authId): array
    {
        $otherUser = (int) $conversation->user_one_id === $authId
            ? $conversation->userTwo
            : $conversation->userOne;

        return [
            'id' => $conversation->id,
            'listing_id' => $conversation->listing_id,
            'last_message' => $conversation->last_message,
            'created_at' => $conversation->created_at,
            'updated_at' => $conversation->updated_at,
            'unread_count' => isset($conversation->unread_count) ? (int) $conversation->unread_count : 0,
            'user' => $otherUser ? [
                'id' => $otherUser->id,
                'name' => trim(($otherUser->first_name ?? '') . ' ' . ($otherUser->last_name ?? '')) ?: ($otherUser->username ?? null),
                'first_name' => $otherUser->first_name,
                'last_name' => $otherUser->last_name,
                'username' => $otherUser->username,
                'profile_picture' => $otherUser->profile_picture,
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
            ] : null,
        ];
    }
}
