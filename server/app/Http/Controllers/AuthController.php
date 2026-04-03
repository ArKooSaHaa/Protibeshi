<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\QueryException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{

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
                    'user' => [
                        'id' => $user->id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'username' => $user->username,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'city' => $user->city,
                        'neighborhood' => $user->neighborhood,
                        'profile_picture' => $this->resolveProfilePictureUrl($user->profile_picture),
                        'profile_picture_url' => $this->resolveProfilePictureUrl($user->profile_picture),
                        'bio' => $user->bio,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ],
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
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower((string) $request->input('email'));
        $password = (string) $request->input('password');

        try {

            $user = User::query()->where('email', $email)->first();

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid email or password',
                ], 401);
            }

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'city' => $user->city,
                    'neighborhood' => $user->neighborhood,
                    'profile_picture' => $this->resolveProfilePictureUrl($user->profile_picture),
                    'profile_picture_url' => $this->resolveProfilePictureUrl($user->profile_picture),
                    'bio' => $user->bio,
                ],
            ], 200);
        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Login failed',
            ], 500);
        }
    }
}
