<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthenticateApiOrSanctum
{
    public function handle(Request $request, Closure $next)
    {
        if ($this->authenticateSanctum($request) || $this->authenticateJwt($request)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated',
        ], 401);
    }

    protected function authenticateSanctum(Request $request): bool
    {
        $user = Auth::guard('sanctum')->user();

        if ($user) {
            Auth::setUser($user);

            return true;
        }

        return false;
    }

    protected function authenticateJwt(Request $request): bool
    {
        if (!$request->bearerToken()) {
            return false;
        }

        try {
            $user = JWTAuth::parseToken()->authenticate();

            if ($user) {
                Auth::guard('api')->setUser($user);
                Auth::shouldUse('api');

                return true;
            }
        } catch (\Throwable) {
            return false;
        }

        return false;
    }
}
