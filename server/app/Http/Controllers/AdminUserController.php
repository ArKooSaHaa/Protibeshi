<?php

namespace App\Http\Controllers;

use App\Services\AdminInboxService;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AdminUserController extends Controller
{
    public function __construct(private readonly AdminInboxService $adminInboxService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:200'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'neighborhood' => ['sometimes', 'nullable', 'string', 'max:150'],
            'verified_only' => ['sometimes', 'nullable', 'boolean'],
            'banned_only' => ['sometimes', 'nullable', 'boolean'],
        ]);

        $usersQuery = User::query()
            ->withCount([
                'posts',
                'listings',
                'services',
                'rentListings',
                'complaints',
                'reliefs',
            ])
            ->when($this->normalizedValue($validated['q'] ?? null) !== '', function (Builder $query) use ($validated) {
                $searchTerm = '%' . strtolower($this->normalizedValue($validated['q'] ?? null)) . '%';

                $query->where(function (Builder $searchQuery) use ($searchTerm) {
                    $searchQuery
                        ->whereRaw('LOWER(first_name) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(last_name) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(username) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(phone) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(city) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(neighborhood) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(full_address) LIKE ?', [$searchTerm]);
                });
            })
            ->when($this->normalizedValue($validated['city'] ?? null) !== '', function (Builder $query) use ($validated) {
                $city = $this->normalizedValue($validated['city'] ?? null);
                $query->where('city', 'like', '%' . $city . '%');
            })
            ->when($this->normalizedValue($validated['neighborhood'] ?? null) !== '', function (Builder $query) use ($validated) {
                $neighborhood = $this->normalizedValue($validated['neighborhood'] ?? null);
                $query->where('neighborhood', 'like', '%' . $neighborhood . '%');
            })
            ->when($request->boolean('verified_only'), function (Builder $query) {
                $query->whereNotNull('email_verified_at');
            })
            ->when($request->boolean('banned_only'), function (Builder $query) {
                $query->where('is_banned', true)
                    ->where(function (Builder $banQuery) {
                        $banQuery->whereNull('banned_until')
                            ->orWhere('banned_until', '>', now());
                    });
            })
            ->latest();

        $users = $usersQuery->get();
        $users->each(fn (User $user) => $this->syncBanState($user));

        $totalUsers = User::count();
        $verifiedUsers = User::query()->whereNotNull('email_verified_at')->count();
        $bannedUsers = User::query()
            ->where('is_banned', true)
            ->where(function (Builder $query) {
                $query->whereNull('banned_until')
                    ->orWhere('banned_until', '>', now());
            })
            ->count();

        $availableNeighborhoods = User::query()
            ->whereNotNull('neighborhood')
            ->pluck('neighborhood')
            ->filter(fn ($value) => is_string($value) && trim($value) !== '')
            ->map(fn ($value) => trim((string) $value))
            ->unique()
            ->sort()
            ->values();

        $availableCities = User::query()
            ->whereNotNull('city')
            ->pluck('city')
            ->filter(fn ($value) => is_string($value) && trim($value) !== '')
            ->map(fn ($value) => trim((string) $value))
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'users' => $users->map(fn (User $user) => $this->serializeUser($user))->values(),
                'summary' => [
                    'total_users' => $totalUsers,
                    'filtered_users' => $users->count(),
                    'verified_users' => $verifiedUsers,
                    'banned_users' => $bannedUsers,
                ],
                'available_neighborhoods' => $availableNeighborhoods,
                'available_cities' => $availableCities,
            ],
        ]);
    }

    private function normalizedValue(null|string|int|bool $value): string
    {
        if ($value === null || $value === false) {
            return '';
        }

        return trim((string) $value);
    }

    private function syncBanState(User $user): void
    {
        if (!(bool) $user->is_banned) {
            return;
        }

        $banEndsAt = $this->resolveBanEndAt($user->banned_until ?? null, $user->banned_at ?? null);

        if ($banEndsAt === null || now()->lessThan($banEndsAt)) {
            return;
        }

        $user->forceFill([
            'is_banned' => false,
            'banned_at' => null,
            'banned_until' => null,
            'banned_reason' => null,
            'banned_by_admin_id' => null,
        ])->save();
    }

    private function resolveBanEndAt(mixed $bannedUntil, mixed $bannedAt): ?Carbon
    {
        if ($bannedUntil instanceof Carbon) {
            return $bannedUntil;
        }

        if ($bannedAt instanceof Carbon) {
            return $bannedAt->copy()->addDays(7);
        }

        return null;
    }

    private function serializeUser(User $user): array
    {
        $fullName = trim(implode(' ', array_filter([$user->first_name, $user->last_name])));

        return [
            'id' => $user->id,
            'full_name' => $fullName,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'city' => $user->city,
            'neighborhood' => $user->neighborhood,
            'full_address' => $user->full_address,
            'profile_picture_url' => $this->resolveProfilePictureUrl($user->profile_picture),
            'bio' => $user->bio,
            'created_at' => optional($user->created_at)->toISOString(),
            'email_verified' => $user->email_verified_at !== null,
            'verification_status' => $user->email_verified_at !== null ? 'verified' : 'unverified',
            'is_banned' => (bool) $user->is_banned,
            'banned_at' => optional($user->banned_at)->toISOString(),
            'banned_until' => optional($user->banned_until)->toISOString(),
            'banned_reason' => $user->banned_reason,
            'posts_count' => (int) ($user->posts_count ?? 0),
            'listings_count' => (int) ($user->listings_count ?? 0),
            'services_count' => (int) ($user->services_count ?? 0),
            'rent_listings_count' => (int) ($user->rentListings_count ?? 0),
            'complaints_count' => (int) ($user->complaints_count ?? 0),
            'reliefs_count' => (int) ($user->reliefs_count ?? 0),
        ];
    }

    public function ban(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'duration_days' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:90'],
        ]);

        $durationDays = (int) ($validated['duration_days'] ?? 7);
        if ($durationDays < 1) {
            $durationDays = 7;
        }

        $banEndsAt = Carbon::now()->addDays($durationDays);
        $reason = trim((string) $validated['reason']);

        $user->forceFill([
            'is_banned' => true,
            'banned_at' => Carbon::now(),
            'banned_until' => $banEndsAt,
            'banned_reason' => $reason,
            'banned_by_admin_id' => Auth::guard('admin_api')->id(),
        ])->save();

        $this->adminInboxService->sendUserBanNotice($user, $banEndsAt, $reason, $durationDays);

        return response()->json([
            'status' => 'success',
            'message' => 'User banned successfully',
            'data' => [
                'user' => $this->serializeUser($user->fresh()),
            ],
        ]);
    }

    public function unban(User $user): JsonResponse
    {
        $user->forceFill([
            'is_banned' => false,
            'banned_at' => null,
            'banned_until' => null,
            'banned_reason' => null,
            'banned_by_admin_id' => null,
        ])->save();

        $this->adminInboxService->sendUserUnbanNotice($user);

        return response()->json([
            'status' => 'success',
            'message' => 'User unbanned successfully',
            'data' => [
                'user' => $this->serializeUser($user->fresh()),
            ],
        ]);
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
