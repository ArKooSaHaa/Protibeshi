<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AccountController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => $this->serializeUser($request->user()),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:150'],
            'username' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('users', 'username')->ignore($user->id)],
            // `sometimes` ensures we only update explicitly submitted fields and keep existing values intact.
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'neighborhood' => ['sometimes', 'nullable', 'string', 'max:150'],
            'full_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'profile_picture' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        if (array_key_exists('full_name', $validated)) {
            [$firstName, $lastName] = $this->splitFullName($validated['full_name']);
            $validated['first_name'] = $firstName;
            $validated['last_name'] = $lastName;
            unset($validated['full_name']);
        }

        $user->fill($validated);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $this->serializeUser($user->fresh()),
            ],
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Validate the input
        $validated = $request->validate([
            'current_password' => 'required|string|min:8',
            'new_password' => 'required|string|min:8',
            'new_password_confirmation' => 'required|string',
        ]);

        // Verify password confirmation matches
        if ($validated['new_password'] !== $validated['new_password_confirmation']) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => [
                    'new_password' => ['Password confirmation does not match.'],
                ],
            ], 422);
        }

        // Verify current password matches
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ], 422);
        }

        $newPassword = $validated['new_password'];

        // Verify new password is different from current
        if (Hash::check($newPassword, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => [
                    'new_password' => ['New password must be different from the current password.'],
                ],
            ], 422);
        }

        // Validate password strength
        $passwordErrors = [];

        if (!preg_match('/[a-z]/', $newPassword)) {
            $passwordErrors[] = 'Password must contain at least one lowercase letter.';
        }
        if (!preg_match('/[A-Z]/', $newPassword)) {
            $passwordErrors[] = 'Password must contain at least one uppercase letter.';
        }
        if (!preg_match('/\d/', $newPassword)) {
            $passwordErrors[] = 'Password must contain at least one number.';
        }
        if (!preg_match('/[@$!%*?&]/', $newPassword)) {
            $passwordErrors[] = 'Password must contain at least one special character (@$!%*?&).';
        }

        if (!empty($passwordErrors)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => [
                    'new_password' => $passwordErrors,
                ],
            ], 422);
        }

        $user->password = Hash::make($newPassword);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Password changed successfully',
            'data' => [
                'user' => $this->serializeUser($user->fresh()),
            ],
        ]);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'password' => 'required|string',
            'confirmation' => 'required|string',
        ]);

        if ($validated['confirmation'] !== 'DELETE') {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => [
                    'confirmation' => ['You must type DELETE to confirm account deletion.'],
                ],
            ], 422);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => [
                    'password' => ['The password is incorrect.'],
                ],
            ], 422);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Account deleted successfully',
        ]);
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
            'created_at' => optional($user->created_at)->toJSON(),
            'email_verified' => $user->email_verified_at !== null,
            'verification_status' => $user->email_verified_at !== null ? 'verified' : 'unverified',
            'is_banned' => (bool) $user->is_banned,
            'banned_at' => optional($user->banned_at)->toJSON(),
            'banned_until' => optional($user->banned_until)->toJSON(),
            'banned_reason' => $user->banned_reason,
        ];
    }

    private function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $firstName = array_shift($parts) ?? '';
        $lastName = implode(' ', $parts);

        return [$firstName, $lastName];
    }

    private function resolveProfilePictureUrl(?string $profilePicture): string
    {
        if (!$profilePicture) {
            return '';
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
