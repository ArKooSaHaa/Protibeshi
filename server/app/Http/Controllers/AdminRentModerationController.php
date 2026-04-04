<?php

namespace App\Http\Controllers;

use App\Models\RentListing;
use App\Models\RentListingReport;
use App\Models\User;
use App\Services\AdminInboxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminRentModerationController extends Controller
{
    private const LISTING_BAN_DAYS = 7;

    private AdminInboxService $adminInboxService;

    public function __construct(AdminInboxService $adminInboxService)
    {
        $this->adminInboxService = $adminInboxService;
    }

    public function index()
    {
        $listings = RentListing::query()
            ->with([
                'user' => function ($query) {
                    $query->withCount([
                        'rentListings as active_rent_listings_count' => function ($rentQuery) {
                            $rentQuery->where('is_active', true);
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
                ->map(fn (RentListing $listing) => $this->formatListing($listing))
                ->values(),
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $listing = RentListing::query()
            ->with(['user', 'reports'])
            ->find($id);

        if (!$listing) {
            return response()->json([
                'success' => false,
                'message' => 'Rent listing not found',
            ], 404);
        }

        if ((bool) $listing->is_active) {
            $listing->is_active = false;
            $listing->save();
        }

        $notificationSent = false;
        try {
            $this->adminInboxService->sendRentListingDeletedNotice($listing, $validated['reason']);
            $notificationSent = true;
        } catch (\Throwable $exception) {
            Log::warning('Failed to deliver rent listing deletion inbox notice', [
                'listing_id' => $listing->id,
                'user_id' => $listing->user_id,
                'error' => $exception->getMessage(),
            ]);
        }

        $this->loadModerationRelations($listing);

        return response()->json([
            'success' => true,
            'message' => 'Rent listing removed from feed',
            'notification_sent' => $notificationSent,
            'listing' => $this->formatListing($listing),
        ], 200);
    }

    public function banLandlord(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $listing = RentListing::query()->with('user')->find($id);

        if (!$listing) {
            return response()->json([
                'success' => false,
                'message' => 'Rent listing not found',
            ], 404);
        }

        if (!$listing->user) {
            return response()->json([
                'success' => false,
                'message' => 'Rent listing owner not found',
            ], 404);
        }

        $landlord = $listing->user;
        $banStartedAt = now();
        $banEndsAt = $banStartedAt->copy()->addDays(self::LISTING_BAN_DAYS);

        $landlord->is_banned = true;
        $landlord->banned_at = $banStartedAt;
        $landlord->banned_until = $banEndsAt;
        $landlord->banned_reason = $validated['reason'];
        $landlord->banned_by_admin_id = Auth::guard('admin_api')->id();
        $landlord->save();

        $affectedListingCount = RentListing::query()
            ->where('user_id', $landlord->id)
            ->where('is_active', true)
            ->count();

        RentListing::query()
            ->where('user_id', $landlord->id)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

        $notificationSent = false;
        try {
            $this->adminInboxService->sendListingBanNotice(
                $landlord,
                $banEndsAt,
                $validated['reason'],
                self::LISTING_BAN_DAYS,
            );
            $notificationSent = true;
        } catch (\Throwable $exception) {
            Log::warning('Failed to deliver rent listing ban inbox notice', [
                'landlord_id' => $landlord->id,
                'listing_id' => $listing->id,
                'error' => $exception->getMessage(),
            ]);
        }

        $landlord->loadCount([
            'rentListings as active_rent_listings_count' => function ($query) {
                $query->where('is_active', true);
            },
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User is banned from posting listings for 7 days and active rent listings were removed',
            'affected_listings' => $affectedListingCount,
            'ban_duration_days' => self::LISTING_BAN_DAYS,
            'banned_until' => $banEndsAt->toISOString(),
            'notification_sent' => $notificationSent,
            'seller' => $this->formatLandlord($landlord),
        ], 200);
    }

    private function loadModerationRelations(RentListing $listing): void
    {
        $listing->load([
            'user' => function ($query) {
                $query->withCount([
                    'rentListings as active_rent_listings_count' => function ($rentQuery) {
                        $rentQuery->where('is_active', true);
                    },
                ]);
            },
            'reports.user',
        ]);

        $listing->loadCount('reports');
    }

    private function formatListing(RentListing $listing): array
    {
        $reportCount = (int) ($listing->reports_count ?? $listing->reports->count());

        return [
            'id' => $listing->id,
            'title' => $listing->title,
            'location' => $listing->location,
            'price' => (float) $listing->price,
            'deposit' => $listing->deposit !== null ? (float) $listing->deposit : null,
            'distance' => $listing->distance,
            'beds' => $listing->beds,
            'baths' => $listing->baths,
            'size_sqft' => $listing->size_sqft,
            'type' => $listing->type,
            'furnishing' => $listing->furnishing,
            'availability' => $listing->availability,
            'badge' => $listing->badge,
            'verified_landlord' => (bool) $listing->verified_landlord,
            'photo' => $listing->photo,
            'photo_url' => $this->resolvePhotoUrl($listing->photo),
            'is_active' => (bool) $listing->is_active,
            'created_at' => optional($listing->created_at)->toISOString(),
            'updated_at' => optional($listing->updated_at)->toISOString(),
            'status' => $reportCount > 0 ? 'reported' : 'active',
            'report_count' => $reportCount,
            'reports' => $listing->reports
                ->map(fn (RentListingReport $report) => $this->formatReport($report, $reportCount))
                ->values(),
            'seller' => $listing->user ? $this->formatLandlord($listing->user) : null,
            'user' => $listing->user ? $this->formatLandlord($listing->user) : null,
        ];
    }

    private function formatReport(RentListingReport $report, int $totalReports): array
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

    private function formatLandlord(User $landlord): array
    {
        return [
            'id' => $landlord->id,
            'first_name' => $landlord->first_name,
            'last_name' => $landlord->last_name,
            'username' => $landlord->username,
            'email' => $landlord->email,
            'profile_picture' => $this->resolveProfilePictureUrl($landlord->profile_picture),
            'profile_picture_url' => $this->resolveProfilePictureUrl($landlord->profile_picture),
            'created_at' => optional($landlord->created_at)->toISOString(),
            'is_banned' => $this->isLandlordCurrentlyBanned($landlord),
            'banned_at' => optional($landlord->banned_at)->toISOString(),
            'banned_until' => optional($landlord->banned_until)->toISOString(),
            'banned_reason' => $landlord->banned_reason,
            'total_active_rent_listings' => (int) ($landlord->active_rent_listings_count ?? 0),
        ];
    }

    private function isLandlordCurrentlyBanned(User $landlord): bool
    {
        if (!(bool) $landlord->is_banned) {
            return false;
        }

        if ($landlord->banned_until === null) {
            return true;
        }

        return now()->lessThan($landlord->banned_until);
    }

    private function resolvePhotoUrl(?string $photo): ?string
    {
        $photo = $photo !== null ? trim($photo) : null;

        if ($photo === null || $photo === '') {
            return null;
        }

        if (filter_var($photo, FILTER_VALIDATE_URL)) {
            return $photo;
        }

        if (str_starts_with($photo, '/')) {
            return url($photo);
        }

        return url(Storage::url($photo));
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
