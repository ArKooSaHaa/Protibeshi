<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

class OptionalAuthenticateApiOrSanctum
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->bearerToken()) {
            $user = Auth::guard('sanctum')->user();

            if (!$user) {
                try {
                    $user = JWTAuth::parseToken()->authenticate();
                    if ($user) {
                        Auth::guard('api')->setUser($user);
                        Auth::shouldUse('api');
                    }
                } catch (\Throwable) {
                    // Public route — invalid token is ignored.
                }
            } else {
                Auth::setUser($user);
            }
        }

        return $next($request);
    }
}
