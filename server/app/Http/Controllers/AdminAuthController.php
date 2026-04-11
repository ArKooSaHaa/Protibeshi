<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminAuthController extends Controller
{
    private const DEFAULT_ADMIN_NAME = 'Protibeshi Admin';
    private const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
    private const DEFAULT_ADMIN_PASSWORD = 'Admin@123';

    private function ensureDefaultAdminAccount(): void
    {
        $adminName = trim((string) env('ADMIN_NAME', self::DEFAULT_ADMIN_NAME));
        $adminEmail = strtolower(trim((string) env('ADMIN_EMAIL', self::DEFAULT_ADMIN_EMAIL)));
        $adminPassword = (string) env('ADMIN_PASSWORD', self::DEFAULT_ADMIN_PASSWORD);

        if ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL) || $adminPassword === '') {
            return;
        }

        $admin = Admin::whereRaw('LOWER(email) = ?', [$adminEmail])->first();

        if (!$admin) {
            Admin::create([
                'name' => $adminName !== '' ? $adminName : self::DEFAULT_ADMIN_NAME,
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
            ]);

            return;
        }

        $shouldSave = false;

        if ($admin->email !== $adminEmail) {
            $admin->email = $adminEmail;
            $shouldSave = true;
        }

        if ($adminName !== '' && $admin->name !== $adminName) {
            $admin->name = $adminName;
            $shouldSave = true;
        }

        if (!Hash::check($adminPassword, (string) $admin->password)) {
            $admin->password = Hash::make($adminPassword);
            $shouldSave = true;
        }

        if ($shouldSave) {
            $admin->save();
        }
    }

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
            'email' => strtolower(trim((string) $request->input('email'))),
            'password' => (string) $request->input('password'),
        ];

        try {
            $this->ensureDefaultAdminAccount();

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
