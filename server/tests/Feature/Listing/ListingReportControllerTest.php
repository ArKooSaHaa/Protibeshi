<?php

namespace Tests\Feature\Listing;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ListingReportControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(array $attributes = []): User
    {
        /** @var User $user */
        $user = User::query()->create(array_merge([
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'user_'.uniqid(),
            'email' => uniqid('user_', true).'@example.com',
            'password' => Hash::make('password123'),
            'phone' => null,
            'city' => null,
            'neighborhood' => null,
            'bio' => null,
            'profile_picture' => null,
        ], $attributes));

        return $user->fresh();
    }

    private function createListing(User $user, array $attributes = []): Listing
    {
        /** @var Listing $listing */
        $listing = Listing::query()->create(array_merge([
            'user_id' => $user->id,
            'title' => 'Used Mobile Phone',
            'price' => 25000,
            'category' => 'Electronics',
            'location' => 'Dhaka',
            'details' => 'Good condition',
            'photo' => null,
            'is_active' => true,
        ], $attributes));

        return $listing->fresh();
    }

    public function test_authenticated_user_can_report_listing(): void
    {
        $owner = $this->createUser();
        $reporter = $this->createUser();
        $listing = $this->createListing($owner);
        $token = JWTAuth::fromUser($reporter);

        $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/listings/'.$listing->id.'/report', [
                'reason' => 'The pricing details look suspicious.',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Listing reported successfully');

        $this->assertDatabaseHas('listing_reports', [
            'listing_id' => $listing->id,
            'user_id' => $reporter->id,
            'reason' => 'The pricing details look suspicious.',
        ]);
    }

    public function test_user_cannot_report_own_listing(): void
    {
        $owner = $this->createUser();
        $listing = $this->createListing($owner);
        $token = JWTAuth::fromUser($owner);

        $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/listings/'.$listing->id.'/report', [
                'reason' => 'Trying to self report',
            ])
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'You cannot report your own listing');
    }

    public function test_second_report_from_same_user_updates_reason(): void
    {
        $owner = $this->createUser();
        $reporter = $this->createUser();
        $listing = $this->createListing($owner);
        $token = JWTAuth::fromUser($reporter);

        $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/listings/'.$listing->id.'/report', [
                'reason' => 'Initial report reason',
            ])
            ->assertCreated();

        $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/listings/'.$listing->id.'/report', [
                'reason' => 'Updated report reason',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Listing report updated successfully');

        $this->assertDatabaseCount('listing_reports', 1);

        $this->assertDatabaseHas('listing_reports', [
            'listing_id' => $listing->id,
            'user_id' => $reporter->id,
            'reason' => 'Updated report reason',
        ]);
    }

    public function test_inactive_listing_cannot_be_reported(): void
    {
        $owner = $this->createUser();
        $reporter = $this->createUser();
        $listing = $this->createListing($owner, [
            'is_active' => false,
        ]);
        $token = JWTAuth::fromUser($reporter);

        $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/listings/'.$listing->id.'/report', [
                'reason' => 'This listing should not be visible',
            ])
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Listing not found');
    }
}