<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostReportController extends Controller
{
    public function report(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $post = Post::find($id);

        if (!$post || !$post->is_active || $post->moderation_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        if ((int) $post->user_id === (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report your own post',
            ], 403);
        }

        $report = PostReport::firstOrCreate([
            'post_id' => $post->id,
            'user_id' => Auth::id(),
        ], [
            'reason' => $validated['reason'] ?? null,
        ]);

        if (!$report->wasRecentlyCreated && array_key_exists('reason', $validated)) {
            $report->reason = $validated['reason'];
            $report->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Post reported successfully',
            'report_id' => $report->id,
        ], 201);
    }
}
