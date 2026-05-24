<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class EnsureUserNotBanned
{
    private const BAN_DURATION_DAYS = 7;

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !(bool) ($user->is_banned ?? false)) {
            return $next($request);
        }

        $banEndsAt = $this->resolveBanEndAt($user->banned_until ?? null, $user->banned_at ?? null);

        if ($banEndsAt !== null && now()->greaterThanOrEqualTo($banEndsAt)) {
            $user->is_banned = false;
            $user->banned_at = null;
            $user->banned_until = null;
            $user->banned_reason = null;
            $user->banned_by_admin_id = null;
            $user->save();

            return $next($request);
        }

        $banReason = trim((string) ($user->banned_reason ?? ''));
        $message = 'You have been banned from posting content.';

        if ($banReason !== '') {
            $message = 'You have been banned for ' . $banReason . '.';
        }

        if ($banEndsAt !== null) {
            $message .= ' Ban ends on ' . $banEndsAt->toDayDateTimeString() . '.';
        }

        return response()->json([
            'success' => false,
            'message' => $message,
            'banned_reason' => $banReason !== '' ? $banReason : null,
            'banned_until' => $banEndsAt?->toISOString(),
        ], 403);
    }

    private function resolveBanEndAt(?Carbon $bannedUntil, ?Carbon $bannedAt): ?Carbon
    {
        if ($bannedUntil instanceof Carbon) {
            return $bannedUntil;
        }

        if ($bannedAt instanceof Carbon) {
            return $bannedAt->copy()->addDays(self::BAN_DURATION_DAYS);
        }

        return null;
    }
}
