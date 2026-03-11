<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            'profile_picture_url' => $this->resolveProfilePictureUrl($user->profile_picture),
            'bio' => $user->bio,
            'created_at' => optional($user->created_at)->toJSON(),
            'email_verified' => $user->email_verified_at !== null,
            'verification_status' => $user->email_verified_at !== null ? 'verified' : 'unverified',
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