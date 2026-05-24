<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostVote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostVoteController extends Controller
{
    public function vote(Request $request, $id)
    {
        $validated = $request->validate([
            'vote' => 'required|in:yes,no',
        ]);

        $post = Post::find($id);

        if (!$post || !$post->is_active || $post->moderation_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        if (!$post->isEventPost()) {
            return response()->json([
                'success' => false,
                'message' => 'Voting is only available for event posts',
            ], 422);
        }

        if (!$post->isEventVotingOpen()) {
            return response()->json([
                'success' => false,
                'message' => 'Voting closed after 2 days',
            ], 410);
        }

        $userId = (int) Auth::id();

        $existingVote = PostVote::where('post_id', $post->id)
            ->where('user_id', $userId)
            ->first();

        if ($existingVote && $existingVote->vote === $validated['vote']) {
            $existingVote->delete();
        } elseif ($existingVote) {
            $existingVote->vote = $validated['vote'];
            $existingVote->save();
        } else {
            PostVote::create([
                'post_id' => $post->id,
                'user_id' => $userId,
                'vote' => $validated['vote'],
            ]);
        }

        $yesVotes = PostVote::where('post_id', $post->id)
            ->where('vote', 'yes')
            ->count();
        $noVotes = PostVote::where('post_id', $post->id)
            ->where('vote', 'no')
            ->count();

        $currentVote = PostVote::where('post_id', $post->id)
            ->where('user_id', $userId)
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Vote recorded successfully',
            'yes_votes_count' => $yesVotes,
            'no_votes_count' => $noVotes,
            'current_user_vote' => $currentVote?->vote,
        ], 200);
    }
}
