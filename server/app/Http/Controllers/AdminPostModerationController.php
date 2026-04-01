<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostReport;
use App\Services\AdminInboxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminPostModerationController extends Controller
{
    private AdminInboxService $adminInboxService;

    public function __construct(AdminInboxService $adminInboxService)
    {
        $this->adminInboxService = $adminInboxService;
    }

    public function index()
    {
        $posts = Post::with(['user', 'reports.user'])
            ->withCount('reports')
            ->latest()
            ->paginate(60);

        $formattedPosts = array_map(
            fn (Post $post) => $this->formatModerationPost($post),
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
            ],
        ], 200);
    }

    public function verify(Request $request, $id)
    {
        $post = Post::with(['user', 'reports.user'])
            ->withCount('reports')
            ->find($id);

        if (!$post || !$post->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        $post->moderation_status = 'verified';
        $post->moderated_by_admin_id = Auth::guard('admin_api')->id();
        $post->moderated_at = now();

        $post->save();
        $post->reports()->delete();
        $post->refresh();
        $post->load(['user', 'reports.user']);
        $post->loadCount('reports');

        return response()->json([
            'success' => true,
            'message' => 'Post verified successfully',
            'post' => $this->formatModerationPost($post),
        ], 200);
    }

    public function destroy($id)
    {
        $post = Post::with(['user', 'reports.user'])
            ->withCount('reports')
            ->find($id);

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        $post->is_active = false;
        $post->moderated_by_admin_id = Auth::guard('admin_api')->id();
        $post->moderated_at = now();
        $post->save();

        $notificationSent = false;
        try {
            $this->adminInboxService->sendPostDeletedNotice($post);
            $notificationSent = true;
        } catch (\Throwable $exception) {
            Log::warning('Failed to deliver post deletion inbox notice', [
                'post_id' => $post->id,
                'user_id' => $post->user_id,
                'error' => $exception->getMessage(),
            ]);
        }

        $post->refresh();
        $post->load(['user', 'reports.user']);
        $post->loadCount('reports');

        return response()->json([
            'success' => true,
            'message' => 'Post removed from public feed',
            'post' => $this->formatModerationPost($post),
            'notification_sent' => $notificationSent,
        ], 200);
    }

    public function ignoreReports(Request $request, $id)
    {
        $post = Post::with(['user', 'reports.user'])
            ->withCount('reports')
            ->find($id);

        if (!$post || !$post->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        $post->moderated_by_admin_id = Auth::guard('admin_api')->id();
        $post->moderated_at = now();
        $post->save();

        $post->reports()->delete();

        $post->refresh();
        $post->load(['user', 'reports.user']);
        $post->loadCount('reports');

        return response()->json([
            'success' => true,
            'message' => 'Reports ignored and cleared successfully',
            'post' => $this->formatModerationPost($post),
        ], 200);
    }

    private function formatModerationPost(Post $post): array
    {
        $reportCount = (int) ($post->reports_count ?? 0);

        $status = 'pending';
        if ($reportCount > 0) {
            $status = 'reported';
        } elseif ((string) $post->moderation_status === 'verified') {
            $status = 'verified';
        }

        $reports = $post->reports->map(function (PostReport $report) {
            return [
                'id' => (string) $report->id,
                'reason' => $report->reason ?: 'Reported by community member',
                'reported_by' => $report->user ? $this->resolveUserName($report->user) : 'Unknown User',
                'created_at' => optional($report->created_at)->toISOString(),
                'details' => $report->reason ?: 'No additional details provided.',
            ];
        })->values();

        return [
            'id' => (string) $post->id,
            'user' => $post->user ? [
                'id' => (string) $post->user->id,
                'name' => $this->resolveUserName($post->user),
                'avatar_url' => $this->resolveProfilePictureUrl($post->user->profile_picture),
            ] : [
                'id' => '0',
                'name' => 'Unknown User',
                'avatar_url' => null,
            ],
            'content' => (string) $post->content,
            'created_at' => optional($post->created_at)->toISOString(),
            'location' => $post->location ?: 'Unknown',
            'status' => $status,
            'report_count' => $reportCount,
            'is_deleted' => !(bool) $post->is_active,
            'reports' => $reports,
            'pinned' => (bool) $post->is_pinned,
        ];
    }

    private function resolveProfilePictureUrl(?string $profilePicture): ?string
    {
        if (!$profilePicture) {
            return null;
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
