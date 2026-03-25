<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultUserSeeder extends Seeder
{
    private const DEFAULT_EMAIL = 'test@example.com';
    private const DEFAULT_PASSWORD = '123456';

    /**
     * Seed a deterministic default user for local/dev environments.
     */
    public function run(): void
    {
        $user = User::withTrashed()->where('email', self::DEFAULT_EMAIL)->first();

        if (!$user) {
            $user = new User();
            $user->email = self::DEFAULT_EMAIL;
            $user->username = $this->nextAvailableUsername('testuser');
        }

        $user->first_name = 'Test';
        $user->last_name = 'User';
        $user->phone = null;
        $user->city = 'Default City';
        $user->neighborhood = 'Default Neighborhood';
        $user->bio = 'Default seeded account for local development login.';
        $user->profile_picture = null;
        $user->password = Hash::make(self::DEFAULT_PASSWORD);
        $user->email_verified_at = now();
        $user->save();

        if (method_exists($user, 'restore') && $user->trashed()) {
            $user->restore();
        }
    }

    private function nextAvailableUsername(string $base): string
    {
        $candidate = $base;
        $counter = 1;

        while (User::withTrashed()->where('username', $candidate)->exists()) {
            $candidate = $base . $counter;
            $counter++;
        }

        return $candidate;
    }
}
