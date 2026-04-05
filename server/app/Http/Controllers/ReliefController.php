<?php

namespace App\Http\Controllers;

use App\Models\Relief;
use App\Models\ReliefComment;
use App\Models\ReliefHelper;
use App\Models\ReliefReport;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Throwable;
use Tymon\JWTAuth\Facades\JWTAuth;

class ReliefController extends Controller
{
    private const ALLOWED_STATUSES = [
        'open',
        'assigned',
        'completed',
    ];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'description' => 'required|string',
            'urgency' => 'required|string|max:100',
            'time_sensitivity' => 'nullable|string|max:255',
            'visibility' => 'required|string|max:100',
            'contact_preference' => 'required|string|max:100',
            'location' => 'required|string|max:255',
            'cover_photo' => 'nullable|string|max:255',
        ]);

        $payload = [
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'type' => $validated['type'],
            'description' => $validated['description'],
            'urgency' => $validated['urgency'],
            'time_sensitivity' => $validated['time_sensitivity'] ?? null,
            'visibility' => $validated['visibility'],
            'contact_preference' => $validated['contact_preference'],
            'location' => $validated['location'],
            'status' => 'open',
            'helpers_count' => 0,
        ];

        if (Schema::hasColumn('reliefs', 'cover_photo')) {
            $payload['cover_photo'] = $validated['cover_photo'] ?? null;
        }

        $relief = Relief::create($payload)->load(['user', 'comments.user']);
        $this->appendReliefMetadata($relief, false);

        return response()->json([
            'success' => true,
            'message' => 'Relief request created successfully',
            'relief' => $relief,
        ], 201);
    }

    public function index(Request $request)
    {
        $viewerId = $this->resolveViewerId($request);
        $reliefs = Relief::with(['user', 'comments.user'])->latest()->get();

        $offeredReliefLookup = [];
        if ($viewerId && Schema::hasTable('relief_helpers') && $reliefs->isNotEmpty()) {
            $offeredReliefIds = ReliefHelper::query()
                ->where('user_id', $viewerId)
                ->whereIn('relief_id', $reliefs->pluck('id'))
                ->pluck('relief_id')
                ->all();

            $offeredReliefLookup = array_fill_keys($offeredReliefIds, true);
        }

        $reliefs->each(function (Relief $relief) use ($offeredReliefLookup) {
            $this->appendReliefMetadata($relief, isset($offeredReliefLookup[$relief->id]));
        });

        return response()->json([
            'success' => true,
            'message' => 'Relief requests fetched successfully',
            'reliefs' => $reliefs,
        ], 200);
    }

    public function show(Request $request, $id)
    {
        try {
            $viewerId = $this->resolveViewerId($request);
            $relief = Relief::with(['user', 'comments.user'])->findOrFail($id);
            $hasOfferedHelp = false;

            if ($viewerId && Schema::hasTable('relief_helpers')) {
                $hasOfferedHelp = ReliefHelper::query()
                    ->where('relief_id', $relief->id)
                    ->where('user_id', $viewerId)
                    ->exists();
            }

            $this->appendReliefMetadata($relief, $hasOfferedHelp);

            return response()->json([
                'success' => true,
                'message' => 'Relief request fetched successfully',
                'relief' => $relief,
            ], 200);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }
    }

    public function offerHelp($id)
    {
        $currentUserId = (int) Auth::id();

        try {
            $relief = Relief::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        if (!Schema::hasTable('relief_helpers')) {
            $relief->increment('helpers_count');

            $freshRelief = $relief->fresh('user');
            $this->appendReliefMetadata($freshRelief, true);

            return response()->json([
                'success' => true,
                'message' => 'Help offer submitted successfully',
                'helpers_count' => (int) $freshRelief->helpers_count,
                'relief' => $freshRelief,
            ], 200);
        }

        $helpRecord = ReliefHelper::firstOrCreate([
            'relief_id' => $relief->id,
            'user_id' => $currentUserId,
        ]);

        if (!$helpRecord->wasRecentlyCreated) {
            $freshRelief = $relief->fresh('user');
            $this->appendReliefMetadata($freshRelief, true);

            return response()->json([
                'success' => false,
                'message' => 'You have already offered help for this request',
                'helpers_count' => (int) $freshRelief->helpers_count,
                'relief' => $freshRelief,
            ], 409);
        }

        $relief->increment('helpers_count');

        $freshRelief = $relief->fresh('user');
        $this->appendReliefMetadata($freshRelief, true);

        return response()->json([
            'success' => true,
            'message' => 'Help offer submitted successfully',
            'helpers_count' => (int) $freshRelief->helpers_count,
            'relief' => $freshRelief,
        ], 200);
    }

    public function addComment(Request $request, $id)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        try {
            $relief = Relief::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        $comment = ReliefComment::create([
            'relief_id' => $relief->id,
            'user_id' => Auth::id(),
            'comment' => $validated['comment'],
        ])->load('user');

        $this->appendCommentMetadata($comment);

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully',
            'comment' => $comment,
        ], 201);
    }

    public function report(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $reason = trim($validated['reason']);
        if (mb_strlen($reason) < 5) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide at least 5 characters for the report reason',
            ], 422);
        }

        try {
            $relief = Relief::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        if ((int) $relief->user_id === (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report your own relief request',
            ], 403);
        }

        $report = ReliefReport::firstOrCreate(
            [
                'relief_id' => $relief->id,
                'user_id' => Auth::id(),
            ],
            [
                'reason' => $reason,
            ]
        );

        $isUpdated = false;

        if (!$report->wasRecentlyCreated && $report->reason !== $reason) {
            $report->reason = $reason;
            $report->save();
            $isUpdated = true;
        }

        $message = 'Relief request reported successfully. Admin team will review it.';

        if (!$report->wasRecentlyCreated && !$isUpdated) {
            $message = 'Relief report already submitted. Admin team will review it.';
        } elseif ($isUpdated) {
            $message = 'Relief report updated successfully. Admin team will review it.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'report_id' => $report->id,
        ], $report->wasRecentlyCreated ? 201 : 200);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::ALLOWED_STATUSES)],
        ]);

        try {
            $relief = Relief::with('user')->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        if ((int) $relief->user_id !== (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this relief request',
            ], 403);
        }

        $relief->status = $validated['status'];
        $relief->save();

        return response()->json([
            'success' => true,
            'message' => 'Relief request status updated successfully',
            'relief' => $relief->fresh('user'),
        ], 200);
    }

    public function destroy($id)
    {
        try {
            $relief = Relief::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        if ((int) $relief->user_id !== (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this relief request',
            ], 403);
        }

        $relief->delete();

        return response()->json([
            'success' => true,
            'message' => 'Relief request deleted successfully',
        ], 200);
    }

    private function resolveViewerId(Request $request): ?int
    {
        try {
            $viewerId = Auth::guard('api')->id();

            if ($viewerId) {
                return (int) $viewerId;
            }
        } catch (Throwable $exception) {
            // Continue to token-based fallback for public routes.
        }

        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        try {
            $user = JWTAuth::setToken($token)->authenticate();

            if ($user && isset($user->id)) {
                return (int) $user->id;
            }
        } catch (Throwable $exception) {
            return null;
        }

        return null;
    }

    private function appendReliefMetadata(Relief $relief, bool $hasOfferedHelp): void
    {
        $relief->setAttribute('has_offered_help', $hasOfferedHelp);

        if ($relief->relationLoaded('user') && $relief->user) {
            $relief->user->setAttribute(
                'profile_picture_url',
                $this->resolveProfilePictureUrl($relief->user->profile_picture)
            );
        }

        if ($relief->relationLoaded('comments')) {
            $relief->comments->each(function (ReliefComment $comment) {
                $this->appendCommentMetadata($comment);
            });
        }
    }

    private function appendCommentMetadata(ReliefComment $comment): void
    {
        if ($comment->relationLoaded('user') && $comment->user) {
            $comment->user->setAttribute(
                'profile_picture_url',
                $this->resolveProfilePictureUrl($comment->user->profile_picture)
            );
        }
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
