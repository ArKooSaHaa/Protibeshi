<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminAuthController extends Controller
{
    public function signin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = [
            'email' => strtolower((string) $request->input('email')),
            'password' => (string) $request->input('password'),
        ];

        try {
            if (!$token = auth('admin_api')->attempt($credentials)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid admin email or password',
                ], 401);
            }

            $admin = auth('admin_api')->user();

            return response()->json([
                'status' => 'success',
                'message' => 'Admin login successful',
                'token' => $token,
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ],
            ], 200);
        } catch (\Throwable $exception) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin login failed',
            ], 500);
        }
    }
}
