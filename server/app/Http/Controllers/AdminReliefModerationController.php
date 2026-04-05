<?php

namespace App\Http\Controllers;

use App\Models\Relief;
use App\Models\ReliefReport;
use App\Models\User;
use App\Services\AdminInboxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminReliefModerationController extends Controller
{
    private AdminInboxService $adminInboxService;

    public function __construct(AdminInboxService $adminInboxService)
    {
        $this->adminInboxService = $adminInboxService;
    }

    public function index()
    {
        $reliefs = Relief::query()
            ->with([
                'user',
                'reports.user',
            ])
            ->withCount(['reports', 'helpers', 'comments'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'reliefs' => $reliefs
                ->map(fn (Relief $relief) => $this->formatRelief($relief))
                ->values(),
        ], 200);
    }

    public function ignoreReports($id)
    {
        $relief = Relief::query()
            ->with(['user', 'reports.user'])
            ->withCount(['reports', 'helpers', 'comments'])
            ->find($id);

        if (!$relief) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        $clearedReports = (int) ($relief->reports_count ?? $relief->reports()->count());
        $relief->reports()->delete();

        $this->loadModerationRelations($relief);

        return response()->json([
            'success' => true,
            'message' => 'Reports ignored and cleared successfully',
            'cleared_reports' => $clearedReports,
            'relief' => $this->formatRelief($relief),
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $relief = Relief::query()
            ->with(['user', 'reports.user'])
            ->withCount(['reports', 'helpers', 'comments'])
            ->find($id);

        if (!$relief) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        $deletedSnapshot = $this->formatRelief($relief);

        $notificationSent = false;
        try {
            $this->adminInboxService->sendReliefDeletedNotice($relief, $validated['reason']);
            $notificationSent = true;
        } catch (\Throwable $exception) {
            Log::warning('Failed to deliver relief deletion inbox notice', [
                'relief_id' => $relief->id,
                'user_id' => $relief->user_id,
                'error' => $exception->getMessage(),
            ]);
        }

        $relief->delete();

        return response()->json([
            'success' => true,
            'message' => 'Relief request removed from board',
            'notification_sent' => $notificationSent,
            'deleted_relief' => $deletedSnapshot,
        ], 200);
    }

    private function loadModerationRelations(Relief $relief): void
    {
        $relief->load([
            'user',
            'reports.user',
        ]);

        $relief->loadCount(['reports', 'helpers', 'comments']);
    }

    private function formatRelief(Relief $relief): array
    {
        $reportCount = (int) ($relief->reports_count ?? $relief->reports->count());

        return [
            'id' => $relief->id,
            'title' => $relief->title,
            'type' => $relief->type,
            'description' => $relief->description,
            'urgency' => $relief->urgency,
            'time_sensitivity' => $relief->time_sensitivity,
            'visibility' => $relief->visibility,
            'contact_preference' => $relief->contact_preference,
            'location' => $relief->location,
            'status' => $relief->status,
            'helpers_count' => (int) ($relief->helpers_count ?? 0),
            'comment_count' => (int) ($relief->comments_count ?? 0),
            'report_count' => $reportCount,
            'created_at' => optional($relief->created_at)->toISOString(),
            'updated_at' => optional($relief->updated_at)->toISOString(),
            'risk_level' => $this->resolveRiskLevel($relief, $reportCount),
            'reports' => $relief->reports
                ->map(fn (ReliefReport $report) => $this->formatReport($report, $reportCount))
                ->values(),
            'requester' => $relief->user ? $this->formatRequester($relief->user) : null,
            'user' => $relief->user ? $this->formatRequester($relief->user) : null,
        ];
    }

    private function formatReport(ReliefReport $report, int $totalReports): array
    {
        $reason = trim((string) ($report->reason ?? ''));
        $message = $reason !== '' ? $reason : 'No additional details provided.';

        return [
            'id' => $report->id,
            'reason' => $reason !== '' ? $reason : 'Reported by community member',
            'message' => $message,
            'severity' => $this->resolveReportSeverity($reason, $totalReports),
            'created_at' => optional($report->created_at)->toISOString(),
            'reporter' => $report->user ? [
                'id' => $report->user->id,
                'name' => $this->resolveUserName($report->user),
                'username' => $report->user->username,
            ] : null,
        ];
    }

    private function resolveRiskLevel(Relief $relief, int $reportCount): string
    {
        $score = 0;
        $urgency = strtolower(trim((string) ($relief->urgency ?? '')));
        $description = strtolower(trim((string) ($relief->description ?? '')));

        if ($reportCount >= 4) {
            $score += 45;
        } elseif ($reportCount >= 2) {
            $score += 28;
        } elseif ($reportCount >= 1) {
            $score += 14;
        }

        if ($urgency === 'critical' || $urgency === 'urgent') {
            $score += 10;
        }

        if (str_contains($description, 'cash only')
            || str_contains($description, 'send money')
            || str_contains($description, 'wire transfer')
            || str_contains($description, 'personal bkash')) {
            $score += 24;
        }

        if ($score >= 50) {
            return 'high';
        }

        if ($score >= 25) {
            return 'medium';
        }

        return 'low';
    }

    private function resolveReportSeverity(string $reason, int $totalReports): string
    {
        $normalizedReason = strtolower($reason);

        if ($totalReports >= 3
            || str_contains($normalizedReason, 'fraud')
            || str_contains($normalizedReason, 'scam')
            || str_contains($normalizedReason, 'fake')
            || str_contains($normalizedReason, 'money')) {
            return 'high';
        }

        if (str_contains($normalizedReason, 'mislead')
            || str_contains($normalizedReason, 'inappropriate')
            || str_contains($normalizedReason, 'abuse')
            || str_contains($normalizedReason, 'spam')) {
            return 'medium';
        }

        return 'low';
    }

    private function resolveUserName(User $user): string
    {
        $firstName = trim((string) ($user->first_name ?? ''));
        $lastName = trim((string) ($user->last_name ?? ''));
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        if (!empty($user->username)) {
            return (string) $user->username;
        }

        return (string) ($user->email ?? 'Unknown User');
    }

    private function formatRequester(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $this->resolveUserName($user),
            'username' => $user->username,
            'email' => $user->email,
            'profile_picture' => $this->resolveProfilePictureUrl($user->profile_picture),
            'profile_picture_url' => $this->resolveProfilePictureUrl($user->profile_picture),
            'is_banned' => (bool) ($user->is_banned ?? false),
            'banned_until' => optional($user->banned_until)->toISOString(),
            'created_at' => optional($user->created_at)->toISOString(),
        ];
    }

    private function resolveProfilePictureUrl(?string $profilePicture): ?string
    {
        $profilePicture = $profilePicture !== null ? trim($profilePicture) : null;

        if ($profilePicture === null || $profilePicture === '') {
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
}
