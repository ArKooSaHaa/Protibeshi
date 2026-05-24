<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostLike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostLikeController extends Controller
{
    public function toggleLike(Request $request, $id)
    {
        $userId = (int) Auth::id();
        $post = Post::find($id);

        if (!$post || !$post->is_active || $post->moderation_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        if ($post->isEventPost()) {
            return response()->json([
                'success' => false,
                'message' => 'Event posts support yes/no votes instead of likes',
            ], 422);
        }

        $existingLike = PostLike::where('post_id', $post->id)
            ->where('user_id', $userId)
            ->first();

        $liked = false;

        if ($existingLike) {
            $existingLike->delete();
            if ((int) $post->likes_count > 0) {
                $post->decrement('likes_count');
            }
        } else {
            PostLike::create([
                'post_id' => $post->id,
                'user_id' => $userId,
            ]);
            $post->increment('likes_count');
            $liked = true;
        }

        $post->refresh();

        return response()->json([
            'liked' => $liked,
            'likes_count' => (int) $post->likes_count,
        ], 200);
    }
}
