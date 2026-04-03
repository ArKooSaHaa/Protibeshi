<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserNotBanned
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && (bool) ($user->is_banned ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is banned. Please contact support.',
            ], 403);
        }

        return $next($request);
    }
}
