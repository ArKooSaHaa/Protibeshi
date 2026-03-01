<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Exception;

class CheckAdminCredentials
{
    public function handle(Request $request, Closure $next)
    {
        $sessionData = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        if (!$sessionData) {
            throw new Exception("Credentials required");
        }

        if ($request->username !== 'admin' || $request->password !== 'adminadmin') {
            throw new Exception("Incorrect credentials");
        }

        return $next($request);
    }
}
