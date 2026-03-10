<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\QueryException;

class AuthController extends Controller
{
    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'username' => 'required|string|max:100|unique:users,username',
            'email' => 'required|email|max:150|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'city' => 'nullable|string|max:100',
            'neighborhood' => 'nullable|string|max:150',
            'bio' => 'nullable|string|max:500',
            'password' => 'required|string|min:8',
            'profile_picture' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ], [
            'email.unique' => 'Email already exists',
            'username.unique' => 'Username already taken',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors();

            if (in_array('Email already exists', $errors->get('email'), true)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Email already exists',
                ], 409);
            }

            if (in_array('Username already taken', $errors->get('username'), true)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Username already taken',
                ], 409);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $errors,
            ], 422);
        }

        $profilePicturePath = null;

        try {
            if ($request->hasFile('profile_picture')) {
                $profilePicturePath = $request->file('profile_picture')->store('profile_images', 'public');
            }

            $user = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'username' => $request->username,
                'email' => $request->email,
                'phone' => $request->phone,
                'city' => $request->city,
                'neighborhood' => $request->neighborhood,
                'bio' => $request->bio,
                'profile_picture' => $profilePicturePath,
                'password' => Hash::make($request->password),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $user->only([
                        'id',
                        'first_name',
                        'last_name',
                        'username',
                        'email',
                        'phone',
                        'city',
                        'neighborhood',
                        'profile_picture',
                        'bio',
                        'created_at',
                        'updated_at',
                    ]),
                ],
            ], 201);
        } catch (QueryException $exception) {
            if ($profilePicturePath) {
                Storage::disk('public')->delete($profilePicturePath);
            }

            $isDuplicate = (int) ($exception->errorInfo[1] ?? 0) === 1062;
            $dbMessage = (string) ($exception->errorInfo[2] ?? '');

            if ($isDuplicate && stripos($dbMessage, 'email') !== false) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Email already exists',
                ], 409);
            }

            if ($isDuplicate && stripos($dbMessage, 'username') !== false) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Username already taken',
                ], 409);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to register user',
            ], 500);
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

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Incorrect password',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'user' => $user->only([
                'id',
                'first_name',
                'last_name',
                'username',
                'email',
                'city',
                'neighborhood',
                'profile_picture',
                'bio',
            ]),
        ], 200);
    }
}
