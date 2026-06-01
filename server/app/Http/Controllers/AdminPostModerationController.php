<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostReport;
use App\Services\AdminInboxService;
use App\Services\GeminiPostModerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

class AdminPostModerationController extends Controller
{
    private AdminInboxService $adminInboxService;
    private GeminiPostModerationService $geminiPostModerationService;

    public function __construct(
        AdminInboxService $adminInboxService,
        GeminiPostModerationService $geminiPostModerationService,
    )
    {
        $this->adminInboxService = $adminInboxService;
        $this->geminiPostModerationService = $geminiPostModerationService;
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'queue' => ['sometimes', 'nullable', 'string', 'in:all,gemini,gemini-approved,gemini-rejected'],
        ]);

        $postsQuery = Post::with(['user', 'reports.user'])
            ->withCount('reports')
            ->latest();

        $queue = $validated['queue'] ?? 'all';

        if (Schema::hasColumn('posts', 'moderation_source') && in_array($queue, ['gemini', 'gemini-approved', 'gemini-rejected'], true)) {
            $postsQuery->where('moderation_source', 'gemini');

            if ($queue === 'gemini') {
                // Gemini queue shows posts that Gemini did not approve (pending/manual review)
                $postsQuery->where('moderation_status', 'pending');
            } elseif ($queue === 'gemini-approved') {
                $postsQuery->where('moderation_status', 'verified');
            } elseif ($queue === 'gemini-rejected') {
                $postsQuery->where('moderation_status', 'pending');
            }
        }

        $posts = $postsQuery->paginate(60);

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

        if (!$post || (!$post->is_active && (string) $post->moderation_status !== 'pending')) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        $post->moderation_status = 'verified';
        $post->is_active = true;
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

    public function geminiReview(Request $request, $id)
    {
        $post = Post::with(['user', 'reports.user'])
            ->withCount('reports')
            ->find($id);

        if (!$post || (!$post->is_active && (string) $post->moderation_status !== 'pending')) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        $image = null;
        if (!empty($post->image)) {
            $image = storage_path('app/public/' . ltrim($post->image, '/'));
        }

        $review = $this->geminiPostModerationService->reviewPost([
            'title' => (string) $post->title,
            'short_description' => $post->short_description,
            'content' => (string) $post->content,
            'label' => $post->label,
            'post_type' => $post->post_type,
            'visibility' => $post->visibility,
            'location' => $post->location,
        ], $image);

        if (Schema::hasColumn('posts', 'moderation_source')) {
            $post->moderation_source = $review['provider'] ?? 'gemini';
        }
        $post->moderation_status = $review['allow'] ? 'verified' : 'pending';
        $adminNote = $review['allow']
            ? 'All good: no scam, hate, or threat speech detected.'
            : 'Flagged: possible scam, hate, or threat speech detected.';
        if (!empty($review['allow'])) {
            $post->is_active = true;
        }
        $post->moderated_by_admin_id = null;
        $post->moderated_at = now();
        $post->moderation_note = $adminNote . (!empty($review['reason']) ? (' ' . $review['reason']) : '');
        $post->save();

        $post->refresh();
        $post->load(['user', 'reports.user']);
        $post->loadCount('reports');

        return response()->json([
            'success' => true,
            'message' => $review['allow']
                ? 'All good: Gemini did not detect scam, hate, or threat speech.'
                : 'Gemini flagged the post for possible scam, hate, or threat speech.',
            'post' => $this->formatModerationPost($post),
            'gemini_review' => [
                'allow' => (bool) $review['allow'],
                'reason' => $review['reason'] ?? null,
                'model' => $review['model'] ?? null,
                'provider' => $review['provider'] ?? null,
            ],
        ], 200);
    }

    public function aiReject(Request $request, $id)
    {
        $post = Post::with(['user', 'reports.user'])
            ->withCount('reports')
            ->find($id);

        if (!$post || (!$post->is_active && (string) $post->moderation_status !== 'pending')) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found',
            ], 404);
        }

        $image = null;
        if (!empty($post->image)) {
            $image = storage_path('app/public/' . ltrim($post->image, '/'));
        }

        $review = $this->geminiPostModerationService->reviewPost([
            'title' => (string) $post->title,
            'short_description' => $post->short_description,
            'content' => (string) $post->content,
            'label' => $post->label,
            'post_type' => $post->post_type,
            'visibility' => $post->visibility,
            'location' => $post->location,
        ], $image);

        if (Schema::hasColumn('posts', 'moderation_source')) {
            $post->moderation_source = $review['provider'] ?? 'ai';
        }

        if (!empty($review['allow'])) {
            $post->moderation_status = 'verified';
            $post->is_active = true;
            $message = 'AI approved the post and it is now visible in the feed.';
        } else {
            $post->moderation_status = 'rejected';
            $post->is_active = false;
            $message = 'AI rejected the post and it has been removed from the feed.';
        }

        $post->moderated_by_admin_id = Auth::guard('admin_api')->id();
        $post->moderated_at = now();
        if (!empty($review['reason'])) {
            $post->moderation_note = !empty($review['allow'])
                ? ('AI approved: ' . $review['reason'])
                : ('Rejected by AI: ' . $review['reason']);
        } else {
            $post->moderation_note = $review['reason'] ?? null;
        }
        $post->save();

        $post->refresh();
        $post->load(['user', 'reports.user']);
        $post->loadCount('reports');

        return response()->json([
            'success' => true,
            'message' => $message,
            'post' => $this->formatModerationPost($post),
            'ai_review' => [
                'allow' => (bool) $review['allow'],
                'reason' => $review['reason'] ?? null,
                'model' => $review['model'] ?? null,
                'provider' => $review['provider'] ?? null,
            ],
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

        if (!$post || (!$post->is_active && (string) $post->moderation_status !== 'pending')) {
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
        } elseif ((string) $post->moderation_status === 'rejected') {
            $status = 'rejected';
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
            'title' => (string) ($post->title ?? ''),
            'short_description' => $post->short_description !== null ? (string) $post->short_description : null,
            'content' => (string) $post->content,
            'created_at' => optional($post->created_at)->toISOString(),
            'location' => $post->location ?: 'Unknown',
            'status' => $status,
            'moderation_source' => Schema::hasColumn('posts', 'moderation_source') ? ($post->moderation_source ?? null) : null,
            'report_count' => $reportCount,
            'is_deleted' => !(bool) $post->is_active && $status !== 'pending',
            'reports' => $reports,
            'pinned' => (bool) $post->is_pinned,
            'moderation_note' => $post->moderation_note ?? null,
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
