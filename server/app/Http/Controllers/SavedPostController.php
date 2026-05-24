<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\SavedPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SavedPostController extends Controller
{
    public function toggleSave(Request $request, $id)
    {
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
                'message' => 'Event posts cannot be saved',
            ], 422);
        }

        $userId = (int) Auth::id();

        $saved = SavedPost::where('post_id', $post->id)
            ->where('user_id', $userId)
            ->first();

        if ($saved) {
            $saved->delete();

            return response()->json([
                'saved' => false,
            ], 200);
        }

        SavedPost::create([
            'post_id' => $post->id,
            'user_id' => $userId,
        ]);

        return response()->json([
            'saved' => true,
        ], 200);
    }
}
