<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceReport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AdminServiceModerationController extends Controller
{
    private const SERVICE_BAN_DAYS = 7;

    public function index()
    {
        $services = Service::query()
            ->with([
                'user' => function ($query) {
                    $query->withCount([
                        'services as active_services_count' => function ($serviceQuery) {
                            $serviceQuery->where('is_active', true);
                        },
                    ]);
                },
                'reports.user',
                'reports.admin',
            ])
            ->withCount('reports')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'services' => $services
                ->map(fn (Service $service) => $this->formatService($service))
                ->values(),
        ], 200);
    }

    public function verify($id)
    {
        $service = Service::query()->find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
            ], 404);
        }

        $service->verified_provider = true;
        $service->is_active = true;
        $service->save();

        $clearedReports = $service->reports()->count();
        if ($clearedReports > 0) {
            $service->reports()->delete();
        }

        $this->loadModerationRelations($service);

        return response()->json([
            'success' => true,
            'message' => 'Service verified successfully',
            'cleared_reports' => $clearedReports,
            'service' => $this->formatService($service),
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $service = Service::query()->find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
            ], 404);
        }

        if ((bool) $service->is_active) {
            $service->is_active = false;
            $service->save();
        }

        $this->loadModerationRelations($service);

        return response()->json([
            'success' => true,
            'message' => 'Service hidden from public feed',
            'moderation_reason' => $validated['reason'],
            'service' => $this->formatService($service),
        ], 200);
    }

    public function flag(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $service = Service::query()->find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
            ], 404);
        }

        ServiceReport::create([
            'service_id' => $service->id,
            'user_id' => null,
            'admin_id' => Auth::guard('admin_api')->id(),
            'source' => 'admin',
            'reason' => $validated['reason'],
        ]);

        $this->loadModerationRelations($service);

        return response()->json([
            'success' => true,
            'message' => 'Service flagged for review',
            'service' => $this->formatService($service),
        ], 200);
    }

    public function ignoreReports($id)
    {
        $service = Service::query()->find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
            ], 404);
        }

        $clearedReports = $service->reports()->count();

        if ($clearedReports > 0) {
            $service->reports()->delete();
        }

        $this->loadModerationRelations($service);

        return response()->json([
            'success' => true,
            'message' => 'Service reports dismissed successfully',
            'cleared_reports' => $clearedReports,
            'service' => $this->formatService($service),
        ], 200);
    }

    public function banProvider(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $service = Service::query()->with('user')->find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
            ], 404);
        }

        if (!$service->user) {
            return response()->json([
                'success' => false,
                'message' => 'Service provider not found',
            ], 404);
        }

        $provider = $service->user;
        $banStartedAt = now();
        $banEndsAt = $banStartedAt->copy()->addDays(self::SERVICE_BAN_DAYS);

        $provider->is_banned = true;
        $provider->banned_at = $banStartedAt;
        $provider->banned_until = $banEndsAt;
        $provider->banned_reason = $validated['reason'];
        $provider->banned_by_admin_id = Auth::guard('admin_api')->id();
        $provider->save();

        $affectedServiceCount = Service::query()
            ->where('user_id', $provider->id)
            ->where('is_active', true)
            ->count();

        Service::query()
            ->where('user_id', $provider->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

        $provider->loadCount([
            'services as active_services_count' => function ($query) {
                $query->where('is_active', true);
            },
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Provider banned from posting services for 7 days and active services were hidden',
            'affected_services' => $affectedServiceCount,
            'ban_duration_days' => self::SERVICE_BAN_DAYS,
            'banned_until' => $banEndsAt->toISOString(),
            'seller' => $this->formatProvider($provider),
            'user' => $this->formatProvider($provider),
        ], 200);
    }

    private function loadModerationRelations(Service $service): void
    {
        $service->load([
            'user' => function ($query) {
                $query->withCount([
                    'services as active_services_count' => function ($serviceQuery) {
                        $serviceQuery->where('is_active', true);
                    },
                ]);
            },
            'reports.user',
            'reports.admin',
        ]);

        $service->loadCount('reports');
    }

    private function formatService(Service $service): array
    {
        $reportCount = (int) ($service->reports_count ?? $service->reports->count());
        $isActive = (bool) $service->is_active;

        return [
            'id' => $service->id,
            'title' => $service->title,
            'category' => $service->category,
            'short_description' => $service->short_description,
            'full_description' => $service->full_description,
            'price' => (float) $service->price,
            'price_type' => $service->price_type,
            'availability' => $service->availability,
            'experience_years' => $service->experience_years,
            'service_radius' => $service->service_radius,
            'location' => $service->location,
            'working_hours' => $service->working_hours,
            'cover_photo' => $service->cover_photo,
            'cover_photo_url' => $this->resolveStorageUrl($service->cover_photo),
            'verified_provider' => (bool) $service->verified_provider,
            'is_active' => $isActive,
            'created_at' => optional($service->created_at)->toISOString(),
            'updated_at' => optional($service->updated_at)->toISOString(),
            'status' => !$isActive ? 'hidden' : ($reportCount > 0 ? 'reported' : 'active'),
            'report_count' => $reportCount,
            'reports' => $service->reports
                ->map(fn (ServiceReport $report) => $this->formatReport($report, $reportCount))
                ->values(),
            'seller' => $service->user ? $this->formatProvider($service->user) : null,
            'user' => $service->user ? $this->formatProvider($service->user) : null,
        ];
    }

    private function formatProvider(User $provider): array
    {
        return [
            'id' => $provider->id,
            'first_name' => $provider->first_name,
            'last_name' => $provider->last_name,
            'username' => $provider->username,
            'email' => $provider->email,
            'profile_picture' => $this->resolveStorageUrl($provider->profile_picture),
            'profile_picture_url' => $this->resolveStorageUrl($provider->profile_picture),
            'created_at' => optional($provider->created_at)->toISOString(),
            'is_banned' => $this->isProviderCurrentlyBanned($provider),
            'banned_at' => optional($provider->banned_at)->toISOString(),
            'banned_until' => optional($provider->banned_until)->toISOString(),
            'banned_reason' => $provider->banned_reason,
            'total_active_services' => (int) ($provider->active_services_count ?? 0),
        ];
    }

    private function formatReport(ServiceReport $report, int $totalReports): array
    {
        $reason = trim((string) ($report->reason ?? ''));
        $source = $report->source ?: ($report->admin_id ? 'admin' : 'user');

        $reporter = null;
        if ($report->admin) {
            $reporter = [
                'id' => $report->admin->id,
                'name' => (string) $report->admin->name,
                'username' => null,
                'type' => 'admin',
            ];
        } elseif ($report->user) {
            $reporter = [
                'id' => $report->user->id,
                'name' => $this->resolveUserName($report->user),
                'username' => $report->user->username,
                'type' => 'user',
            ];
        }

        return [
            'id' => $report->id,
            'reason' => $reason !== '' ? $reason : 'Reported by community member',
            'message' => $reason !== '' ? $reason : 'No additional details provided.',
            'severity' => $this->resolveReportSeverity($reason, $totalReports),
            'source' => $source,
            'created_at' => optional($report->created_at)->toISOString(),
            'reporter' => $reporter,
        ];
    }

    private function resolveReportSeverity(string $reason, int $totalReports): string
    {
        $normalizedReason = strtolower($reason);

        if ($totalReports >= 3
            || str_contains($normalizedReason, 'fraud')
            || str_contains($normalizedReason, 'scam')
            || str_contains($normalizedReason, 'fake')) {
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

    private function resolveStorageUrl(?string $path): ?string
    {
        $path = $path !== null ? trim($path) : null;

        if ($path === null || $path === '') {
            return null;
        }

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        if (str_starts_with($path, '/')) {
            return url($path);
        }

        return url(Storage::url($path));
    }

    private function isProviderCurrentlyBanned(User $provider): bool
    {
        if (!(bool) $provider->is_banned) {
            return false;
        }

        if ($provider->banned_until === null) {
            return true;
        }

        return now()->lessThan($provider->banned_until);
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
}
