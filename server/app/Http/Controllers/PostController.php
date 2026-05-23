<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function createPost(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'short_description' => 'nullable|string',
            'label' => 'nullable|string|in:Emergency,Community,Event',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'post_type' => 'nullable|string|max:60',
            'visibility' => 'nullable|string|max:60',
            'location' => 'nullable|string|max:255',
            'distance' => 'nullable|integer|min:0',
        ]);

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts', 'public');
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'short_description' => $validated['short_description'] ?? null,
            'content' => $validated['content'],
            'label' => $validated['label'] ?? null,
            'image' => $imagePath,
            'post_type' => $this->resolvePostType($validated['label'] ?? null, $validated['post_type'] ?? null),
            'visibility' => $validated['visibility'] ?? 'public',
            'location' => $validated['location'] ?? null,
            'distance' => $validated['distance'] ?? null,
            'is_active' => true,
            'is_pinned' => false,
            'moderation_status' => 'pending',
            'moderated_by_admin_id' => null,
            'moderated_at' => null,
            'moderation_note' => null,
        ]);

        $post->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Post submitted for admin verification',
            'post' => $this->formatPost($post, (int) Auth::id()),
            'requires_verification' => true,
        ], 201);
    }

    public function index()
    {
        $viewerUserId = Auth::guard('api')->id();

        $postsQuery = Post::with('user')
            ->where('is_active', true)
            ->where('moderation_status', 'verified')
            ->where('created_at', '>=', now()->subDays(7))
            ->orderByRaw("CASE WHEN LOWER(COALESCE(label, post_type, '')) = 'emergency' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at');

        if ($viewerUserId) {
            $postsQuery->with(['votes' => function ($query) use ($viewerUserId) {
                $query->where('user_id', (int) $viewerUserId);
            }]);
            $postsQuery->withCount([
                'likes as liked_by_current_user' => function ($query) use ($viewerUserId) {
                    $query->where('user_id', (int) $viewerUserId);
                },
            ]);
        }

        $postsQuery->withCount([
            'votes as yes_votes_count' => function ($query) {
                $query->where('vote', 'yes');
            },
            'votes as no_votes_count' => function ($query) {
                $query->where('vote', 'no');
            },
        ]);

        $posts = $postsQuery->get();

        $formattedPosts = array_map(
            fn (Post $post) => $this->formatPost($post, $viewerUserId ? (int) $viewerUserId : null),
            $posts->all()
        );

        return response()->json([
            'success' => true,
            'posts' => $formattedPosts,
            'feed_window_days' => 7,
        ], 200);
    }

    public function myPosts(Request $request)
    {
        $authId = (int) Auth::id();

        $postsQuery = Post::with('user')
            ->withCount([
                'likes as liked_by_current_user' => function ($query) use ($authId) {
                    $query->where('user_id', $authId);
                },
                'votes as yes_votes_count' => function ($query) {
                    $query->where('vote', 'yes');
                },
                'votes as no_votes_count' => function ($query) {
                    $query->where('vote', 'no');
                },
            ])
            ->where('user_id', $authId)
            ->where('is_active', true)
            ->latest();

        $postsQuery->with(['votes' => function ($query) use ($authId) {
            $query->where('user_id', $authId);
        }]);

        $posts = $postsQuery->paginate(30);

        $formattedPosts = array_map(
            fn (Post $post) => $this->formatPost($post, $authId),
            $posts->items()
        );

        return response()->json([
            'success' => true,
            'posts' => $formattedPosts,
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'from' => $posts->firstItem(),
                'to' => $posts->lastItem(),
            ],
        ], 200);
    }

    public function show($id)
    {
        $viewerUserId = Auth::guard('api')->id();

        $postQuery = Post::with(['user', 'comments.user'])
            ->withCount(['likes as likes_relation_count'])
            ->withCount([
                'votes as yes_votes_count' => function ($query) {
                    $query->where('vote', 'yes');
                },
                'votes as no_votes_count' => function ($query) {
                    $query->where('vote', 'no');
                },
            ]);

        if ($viewerUserId) {
            $postQuery->with(['votes' => function ($query) use ($viewerUserId) {
                $query->where('user_id', (int) $viewerUserId);
            }]);
            $postQuery->withCount([
                'likes as liked_by_current_user' => function ($query) use ($viewerUserId) {
                    $query->where('user_id', (int) $viewerUserId);
                },
            ]);
        }

        $post = $postQuery->find($id);

        if (!$post || !$post->is_active || $post->moderation_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        $formatted = $this->formatPost($post, $viewerUserId ? (int) $viewerUserId : null);
        $formatted['likes_count'] = (int) $post->likes_count;
        $formatted['likes_relation_count'] = (int) $post->likes_relation_count;
        $formatted['comments'] = $post->isEventPost() ? [] : $post->comments->map(function ($comment) {
            return [
                'id' => $comment->id,
                'comment' => $comment->comment,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'user' => $comment->user ? [
                    'id' => $comment->user->id,
                    'name' => $this->resolveUserName($comment->user),
                    'profile_picture' => $this->resolveProfilePictureUrl($comment->user->profile_picture),
                    'profile_picture_url' => $this->resolveProfilePictureUrl($comment->user->profile_picture),
                ] : null,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'post' => $formatted,
        ], 200);
    }

    public function deletePost($id)
    {
        $post = Post::find($id);

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        if ((int) $post->user_id !== (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this post',
            ], 403);
        }

        if ($post->image) {
            Storage::disk('public')->delete($post->image);
        }

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully',
        ], 200);
    }

    private function formatPost(Post $post, ?int $viewerUserId = null): array
    {
        $liked = false;
        $currentUserVote = null;

        if ($viewerUserId !== null && $viewerUserId > 0) {
            $liked = (int) ($post->liked_by_current_user ?? 0) > 0;
            if ($post->relationLoaded('votes')) {
                $currentUserVote = $post->votes->first()?->vote;
            }
        }

        $isEventPost = $post->isEventPost();

        return [
            'id' => $post->id,
            'title' => $post->title,
            'short_description' => $post->short_description,
            'content' => $post->content,
            'label' => $post->label,
            'image' => $post->image ? Storage::url($post->image) : null,
            'post_type' => $post->post_type,
            'is_event' => $isEventPost,
            'interaction_mode' => $isEventPost ? 'poll' : 'standard',
            'event_vote_open' => $isEventPost ? $post->isEventVotingOpen() : null,
            'event_vote_expires_at' => $isEventPost && $post->eventVotingExpiresAt() ? $post->eventVotingExpiresAt()?->toISOString() : null,
            'visibility' => $post->visibility,
            'likes_count' => (int) $post->likes_count,
            'liked' => $liked,
            'comments_count' => (int) $post->comments_count,
            'shares_count' => (int) $post->shares_count,
            'yes_votes_count' => (int) ($post->yes_votes_count ?? 0),
            'no_votes_count' => (int) ($post->no_votes_count ?? 0),
            'current_user_vote' => $currentUserVote,
            'is_active' => (bool) $post->is_active,
            'is_pinned' => (bool) $post->is_pinned,
            'moderation_status' => (string) $post->moderation_status,
            'location' => $post->location,
            'distance' => $post->distance,
            'created_at' => $post->created_at,
            'updated_at' => $post->updated_at,
            'user' => $post->user ? [
                'id' => $post->user->id,
                'name' => $this->resolveUserName($post->user),
                'profile_picture' => $this->resolveProfilePictureUrl($post->user->profile_picture),
                'profile_picture_url' => $this->resolveProfilePictureUrl($post->user->profile_picture),
            ] : null,
        ];
    }

    private function resolvePostType(?string $label, ?string $fallbackType = null): string
    {
        $normalizedLabel = strtolower(trim((string) $label));
        if ($normalizedLabel === 'event') {
            return 'event';
        }

        if ($normalizedLabel === 'emergency') {
            return 'emergency';
        }

        if ($normalizedLabel === 'community') {
            return 'community';
        }

        $normalizedFallback = strtolower(trim((string) $fallbackType));
        if (in_array($normalizedFallback, ['event', 'emergency', 'community'], true)) {
            return $normalizedFallback;
        }

        return 'community';
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

    private function resolveUserName($user): string
    {
        $firstName = trim((string) ($user->first_name ?? ''));
        $lastName = trim((string) ($user->last_name ?? ''));
        $fullName = trim($firstName . ' ' . $lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        if (!empty($user->username)) {
            return (string) $user->username;
        }

        return (string) ($user->email ?? 'Unknown User');
    }
}
