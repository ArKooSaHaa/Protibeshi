<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\ListingReport;
use App\Models\User;
use App\Services\AdminInboxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminListingModerationController extends Controller
{
    private const LISTING_BAN_DAYS = 7;

    private AdminInboxService $adminInboxService;

    public function __construct(AdminInboxService $adminInboxService)
    {
        $this->adminInboxService = $adminInboxService;
    }

    public function index()
    {
        $listings = Listing::query()
            ->with([
                'user' => function ($query) {
                    $query->withCount([
                        'listings as active_listings_count' => function ($listingQuery) {
                            $listingQuery->where('is_active', true);
                        },
                    ]);
                },
                'reports.user',
            ])
            ->withCount('reports')
            ->where('is_active', true)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'listings' => $listings
                ->map(fn (Listing $listing) => $this->formatListing($listing))
                ->values(),
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $listing = Listing::query()
            ->with(['user', 'reports'])
            ->find($id);

        if (!$listing) {
            return response()->json([
                'success' => false,
                'message' => 'Listing not found',
            ], 404);
        }

        if ((bool) $listing->is_active) {
            $listing->is_active = false;
            $listing->save();
        }

        $notificationSent = false;
        try {
            $this->adminInboxService->sendListingDeletedNotice($listing, $validated['reason']);
            $notificationSent = true;
        } catch (\Throwable $exception) {
            Log::warning('Failed to deliver listing deletion inbox notice', [
                'listing_id' => $listing->id,
                'user_id' => $listing->user_id,
                'error' => $exception->getMessage(),
            ]);
        }

        $this->loadModerationRelations($listing);

        return response()->json([
            'success' => true,
            'message' => 'Listing removed from marketplace',
            'notification_sent' => $notificationSent,
            'listing' => $this->formatListing($listing),
        ], 200);
    }

    public function banSeller(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $listing = Listing::query()->with('user')->find($id);

        if (!$listing) {
            return response()->json([
                'success' => false,
                'message' => 'Listing not found',
            ], 404);
        }

        if (!$listing->user) {
            return response()->json([
                'success' => false,
                'message' => 'Listing seller not found',
            ], 404);
        }

        $seller = $listing->user;
        $banStartedAt = now();
        $banEndsAt = $banStartedAt->copy()->addDays(self::LISTING_BAN_DAYS);

        $seller->is_banned = true;
        $seller->banned_at = $banStartedAt;
        $seller->banned_until = $banEndsAt;
        $seller->banned_reason = $validated['reason'];
        $seller->banned_by_admin_id = Auth::guard('admin_api')->id();
        $seller->save();

        $affectedListingCount = Listing::query()
            ->where('user_id', $seller->id)
            ->where('is_active', true)
            ->count();

        Listing::query()
            ->where('user_id', $seller->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

        $notificationSent = false;
        try {
            $this->adminInboxService->sendListingBanNotice(
                $seller,
                $banEndsAt,
                $validated['reason'],
                self::LISTING_BAN_DAYS,
            );
            $notificationSent = true;
        } catch (\Throwable $exception) {
            Log::warning('Failed to deliver listing ban inbox notice', [
                'seller_id' => $seller->id,
                'listing_id' => $listing->id,
                'error' => $exception->getMessage(),
            ]);
        }

        $seller->loadCount([
            'listings as active_listings_count' => function ($query) {
                $query->where('is_active', true);
            },
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User is banned from posting listings for 7 days and active listings were removed',
            'affected_listings' => $affectedListingCount,
            'ban_duration_days' => self::LISTING_BAN_DAYS,
            'banned_until' => $banEndsAt->toISOString(),
            'notification_sent' => $notificationSent,
            'seller' => $this->formatSeller($seller),
        ], 200);
    }

    private function loadModerationRelations(Listing $listing): void
    {
        $listing->load([
            'user' => function ($query) {
                $query->withCount([
                    'listings as active_listings_count' => function ($listingQuery) {
                        $listingQuery->where('is_active', true);
                    },
                ]);
            },
            'reports.user',
        ]);

        $listing->loadCount('reports');
    }

    private function formatListing(Listing $listing): array
    {
        $reportCount = (int) ($listing->reports_count ?? $listing->reports->count());

        return [
            'id' => $listing->id,
            'title' => $listing->title,
            'price' => (float) $listing->price,
            'category' => $listing->category,
            'location' => $listing->location,
            'details' => $listing->details,
            'photo' => $listing->photo,
            'photo_url' => $listing->photo_url,
            'is_active' => (bool) $listing->is_active,
            'created_at' => optional($listing->created_at)->toISOString(),
            'updated_at' => optional($listing->updated_at)->toISOString(),
            'status' => $reportCount > 0 ? 'reported' : 'active',
            'report_count' => $reportCount,
            'reports' => $listing->reports
                ->map(fn (ListingReport $report) => $this->formatReport($report, $reportCount))
                ->values(),
            'seller' => $listing->user ? $this->formatSeller($listing->user) : null,
        ];
    }

    private function formatSeller(User $seller): array
    {
        return [
            'id' => $seller->id,
            'first_name' => $seller->first_name,
            'last_name' => $seller->last_name,
            'username' => $seller->username,
            'email' => $seller->email,
            'profile_picture' => $this->resolveProfilePictureUrl($seller->profile_picture),
            'profile_picture_url' => $this->resolveProfilePictureUrl($seller->profile_picture),
            'created_at' => optional($seller->created_at)->toISOString(),
            'is_banned' => $this->isSellerCurrentlyBanned($seller),
            'banned_at' => optional($seller->banned_at)->toISOString(),
            'banned_until' => optional($seller->banned_until)->toISOString(),
            'banned_reason' => $seller->banned_reason,
            'total_active_listings' => (int) ($seller->active_listings_count ?? 0),
        ];
    }

    private function isSellerCurrentlyBanned(User $seller): bool
    {
        if (!(bool) $seller->is_banned) {
            return false;
        }

        if ($seller->banned_until === null) {
            return true;
        }

        return now()->lessThan($seller->banned_until);
    }

    private function formatReport(ListingReport $report, int $totalReports): array
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
            || str_contains($normalizedReason, 'abuse')) {
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
