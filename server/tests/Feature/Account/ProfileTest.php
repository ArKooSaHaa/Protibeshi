<?php

namespace Tests\Feature\Account;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(array $attributes = []): User
    {
        $emailVerifiedAt = $attributes['email_verified_at'] ?? null;
        unset($attributes['email_verified_at']);

        $user = User::query()->create(array_merge([
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'testuser_'.uniqid(),
            'email' => uniqid('user_', true).'@example.com',
            'password' => Hash::make('password123'),
            'phone' => null,
            'city' => null,
            'neighborhood' => null,
            'bio' => null,
            'profile_picture' => null,
        ], $attributes));

        if ($emailVerifiedAt !== null) {
            $user->forceFill(['email_verified_at' => $emailVerifiedAt])->save();
        }

        return $user->fresh();
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = $this->createUser([
            'first_name' => 'Arko',
            'last_name' => 'Saha',
            'username' => 'arkosaha',
            'email' => 'arko@example.com',
            'city' => 'Dhaka',
            'neighborhood' => 'Motijheel',
            'bio' => 'Building safer neighborhoods.',
            'profile_picture' => 'profile_images/avatar.png',
            'email_verified_at' => now(),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/account/profile');

        $response
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.full_name', 'Arko Saha')
            ->assertJsonPath('data.user.username', 'arkosaha')
            ->assertJsonPath('data.user.email_verified', true)
            ->assertJsonPath('data.user.verification_status', 'verified');

        $this->assertStringContainsString('/storage/profile_images/avatar.png', $response->json('data.user.profile_picture_url'));
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = $this->createUser([
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'testuser',
            'email' => 'testuser@example.com',
            'city' => 'Dhaka',
            'neighborhood' => 'Old Town',
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->putJson('/api/account/profile', [
            'full_name' => 'Arko Saha',
            'username' => 'arkosaha',
            'phone' => '+8801711223344',
            'city' => 'Dhaka',
            'neighborhood' => 'Motijheel',
            'bio' => 'Local resident and volunteer.',
            'profile_picture' => 'https://example.com/avatar.png',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.full_name', 'Arko Saha')
            ->assertJsonPath('data.user.username', 'arkosaha')
            ->assertJsonPath('data.user.profile_picture_url', 'https://example.com/avatar.png');

        $user->refresh();

        $this->assertSame('Arko', $user->first_name);
        $this->assertSame('Saha', $user->last_name);
        $this->assertSame('arkosaha', $user->username);
        $this->assertSame('Motijheel', $user->neighborhood);
        $this->assertSame('https://example.com/avatar.png', $user->profile_picture);
    }

    public function test_partial_profile_update_preserves_existing_values(): void
    {
        $user = $this->createUser([
            'first_name' => 'Arko',
            'last_name' => 'Saha',
            'username' => 'arko_profile',
            'email' => 'arko.profile@example.com',
            'phone' => '+8801700000000',
            'city' => 'Dhaka',
            'neighborhood' => 'Mirpur',
            'bio' => 'Initial bio',
            'profile_picture' => 'profile_images/original.png',
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->putJson('/api/account/profile', [
            'city' => 'Chattogram',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.city', 'Chattogram')
            ->assertJsonPath('data.user.username', 'arko_profile');

        $user->refresh();

        $this->assertSame('Arko', $user->first_name);
        $this->assertSame('Saha', $user->last_name);
        $this->assertSame('arko_profile', $user->username);
        $this->assertSame('arko.profile@example.com', $user->email);
        $this->assertSame('+8801700000000', $user->phone);
        $this->assertSame('Mirpur', $user->neighborhood);
        $this->assertSame('Initial bio', $user->bio);
        $this->assertSame('profile_images/original.png', $user->profile_picture);
        $this->assertSame('Chattogram', $user->city);
    }

    public function test_authenticated_user_can_change_password(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/account/change-password', [
            'current_password' => 'OldPassword123!',
            'new_password' => 'NewPassword456@',
            'new_password_confirmation' => 'NewPassword456@',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Password changed successfully');

        $user->refresh();

        $this->assertTrue(Hash::check('NewPassword456@', $user->password));
        $this->assertFalse(Hash::check('OldPassword123!', $user->password));
    }

    public function test_authenticated_user_can_change_password_with_reported_values(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('Arkosahabd@123'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/account/change-password', [
            'current_password' => 'Arkosahabd@123',
            'new_password' => 'Arkosahabd@1234',
            'new_password_confirmation' => 'Arkosahabd@1234',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Password changed successfully');

        $user->refresh();

        $this->assertTrue(Hash::check('Arkosahabd@1234', $user->password));
        $this->assertFalse(Hash::check('Arkosahabd@123', $user->password));
    }

    public function test_change_password_fails_with_incorrect_current_password(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/account/change-password', [
            'current_password' => 'WrongPassword123!',
            'new_password' => 'NewPassword456@',
            'new_password_confirmation' => 'NewPassword456@',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('errors.current_password.0', 'The current password is incorrect.');

        $user->refresh();

        $this->assertTrue(Hash::check('OldPassword123!', $user->password));
    }

    public function test_change_password_fails_with_invalid_new_password_format(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/account/change-password', [
            'current_password' => 'OldPassword123!',
            'new_password' => 'weakpassword', // Missing uppercase, number, special char
            'new_password_confirmation' => 'weakpassword',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure([
                'status',
                'message',
                'errors' => ['new_password'],
            ]);

        $user->refresh();

        $this->assertTrue(Hash::check('OldPassword123!', $user->password));
    }

    public function test_change_password_fails_with_mismatched_confirmation(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/account/change-password', [
            'current_password' => 'OldPassword123!',
            'new_password' => 'NewPassword456@',
            'new_password_confirmation' => 'DifferentPassword789@',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure([
                'status',
                'message',
                'errors',
            ]);

        $user->refresh();

        $this->assertTrue(Hash::check('OldPassword123!', $user->password));
    }

    public function test_change_password_fails_when_new_password_same_as_current(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('SamePassword123!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/account/change-password', [
            'current_password' => 'SamePassword123!',
            'new_password' => 'SamePassword123!',
            'new_password_confirmation' => 'SamePassword123!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure([
                'status',
                'message',
                'errors',
            ]);

        $user->refresh();

        $this->assertTrue(Hash::check('SamePassword123!', $user->password));
    }

    public function test_authenticated_user_can_delete_account(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('ValidPassword1!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->deleteJson('/api/account', [
            'password' => 'ValidPassword1!',
            'confirmation' => 'DELETE',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_delete_account_fails_with_wrong_password(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('ValidPassword1!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->deleteJson('/api/account', [
            'password' => 'WrongPassword99!',
            'confirmation' => 'DELETE',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure(['status', 'message', 'errors']);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);
    }

    public function test_delete_account_fails_with_wrong_confirmation_text(): void
    {
        $user = $this->createUser([
            'password' => Hash::make('ValidPassword1!'),
        ]);

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)->deleteJson('/api/account', [
            'password' => 'ValidPassword1!',
            'confirmation' => 'delete',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonStructure(['status', 'message', 'errors']);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);
    }

    public function test_delete_account_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/account', [
            'password' => 'ValidPassword1!',
            'confirmation' => 'DELETE',
        ]);

        // The custom exception handler converts all exceptions to 200 with an error body.
        // Unauthenticated requests produce a "success: false" response.
        $response->assertJsonPath('success', false);
    }

}