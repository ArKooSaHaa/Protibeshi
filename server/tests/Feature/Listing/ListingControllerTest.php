<?php

namespace Tests\Feature\Listing;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ListingControllerTest extends TestCase
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

    public function test_index_returns_only_active_listings(): void
    {
        $user = $this->createUser();
        $activeListing = $this->createListing($user, [
            'title' => 'Active listing',
            'is_active' => true,
        ]);
        $inactiveListing = $this->createListing($user, [
            'title' => 'Inactive listing',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/listings');

        $response->assertOk();

        $ids = collect($response->json())->pluck('id')->all();

        $this->assertContains($activeListing->id, $ids);
        $this->assertNotContains($inactiveListing->id, $ids);
    }
}
