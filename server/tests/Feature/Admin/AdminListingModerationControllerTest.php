<?php

namespace Tests\Feature\Admin;

use App\Models\Admin;
use App\Models\Listing;
use App\Models\ListingReport;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminListingModerationControllerTest extends TestCase
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

    private function createAdmin(array $attributes = []): Admin
    {
        /** @var Admin $admin */
        $admin = Admin::query()->create(array_merge([
            'name' => 'Test Admin',
            'email' => uniqid('admin_', true).'@example.com',
            'password' => Hash::make('Admin@123'),
        ], $attributes));

        return $admin->fresh();
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

    private function adminHeaders(Admin $admin): array
    {
        $token = JWTAuth::fromUser($admin);

        return [
            'Authorization' => 'Bearer '.$token,
        ];
    }

    private function userHeaders(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return [
            'Authorization' => 'Bearer '.$token,
        ];
    }

    public function test_admin_can_fetch_marketplace_moderation_listings(): void
    {
        $seller = $this->createUser([
            'first_name' => 'Marketplace',
            'last_name' => 'Seller',
        ]);
        $reporter = $this->createUser();
        $admin = $this->createAdmin();
        $listing = $this->createListing($seller);

        ListingReport::query()->create([
            'listing_id' => $listing->id,
            'user_id' => $reporter->id,
            'reason' => 'Fraud listing',
        ]);

        $response = $this
            ->withHeaders($this->adminHeaders($admin))
            ->getJson('/api/admin/listings');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('listings.0.id', $listing->id)
            ->assertJsonPath('listings.0.status', 'reported')
            ->assertJsonPath('listings.0.report_count', 1)
            ->assertJsonPath('listings.0.seller.id', $seller->id)
            ->assertJsonPath('listings.0.seller.is_banned', false);
    }

    public function test_admin_can_delete_listing_from_marketplace(): void
    {
        $seller = $this->createUser();
        $reporter = $this->createUser();
        $admin = $this->createAdmin();
        $listing = $this->createListing($seller, [
            'title' => 'Listing to remove',
            'category' => 'Electronics',
            'location' => 'Dhaka',
            'price' => 4200,
            'details' => 'Original details from listing creator',
        ]);

        ListingReport::query()->create([
            'listing_id' => $listing->id,
            'user_id' => $reporter->id,
            'reason' => 'Misleading product details',
        ]);

        $this
            ->withHeaders($this->adminHeaders($admin))
            ->deleteJson('/api/admin/listings/'.$listing->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Listing removed from marketplace')
            ->assertJsonPath('notification_sent', true);

        $this->assertDatabaseHas('listings', [
            'id' => $listing->id,
            'is_active' => false,
        ]);

        $adminInboxUser = User::query()->where('username', 'admin_inbox_system')->first();
        $this->assertNotNull($adminInboxUser);

        $deletionMessage = Message::query()
            ->where('sender_id', $adminInboxUser->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($deletionMessage);
        $this->assertStringContainsString('Your marketplace listing has been deleted by the admin moderation team.', $deletionMessage->message);
        $this->assertStringContainsString('- Title: Listing to remove', $deletionMessage->message);
        $this->assertStringContainsString('- Category: Electronics', $deletionMessage->message);
        $this->assertStringContainsString('- Price: BDT 4,200.00', $deletionMessage->message);
        $this->assertStringContainsString('- Location: Dhaka', $deletionMessage->message);
        $this->assertStringContainsString('Reason: Reported by community members', $deletionMessage->message);
        $this->assertStringContainsString('Misleading product details', $deletionMessage->message);
    }

    public function test_admin_can_ban_listing_owner_and_remove_active_listings(): void
    {
        $seller = $this->createUser();
        $admin = $this->createAdmin();
        $primaryListing = $this->createListing($seller, [
            'title' => 'Primary listing',
        ]);
        $secondaryListing = $this->createListing($seller, [
            'title' => 'Secondary listing',
        ]);

        $this
            ->withHeaders($this->adminHeaders($admin))
            ->postJson('/api/admin/listings/'.$primaryListing->id.'/ban-user', [
                'reason' => 'Repeated fraud reports',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('affected_listings', 2)
            ->assertJsonPath('ban_duration_days', 7)
            ->assertJsonPath('notification_sent', true)
            ->assertJsonPath('seller.id', $seller->id)
            ->assertJsonPath('seller.is_banned', true);

        $this->assertDatabaseHas('users', [
            'id' => $seller->id,
            'is_banned' => true,
            'banned_reason' => 'Repeated fraud reports',
        ]);

        $this->assertNotNull($seller->fresh()->banned_until);

        $this->assertDatabaseHas('listings', [
            'id' => $primaryListing->id,
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('listings', [
            'id' => $secondaryListing->id,
            'is_active' => false,
        ]);

        $adminInboxUser = User::query()->where('username', 'admin_inbox_system')->first();
        $this->assertNotNull($adminInboxUser);

        $banMessage = Message::query()
            ->where('sender_id', $adminInboxUser->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($banMessage);
        $this->assertStringContainsString('temporarily banned from posting listings for the next 7 days', $banMessage->message);
        $this->assertStringContainsString('Repeated fraud reports', $banMessage->message);
    }

    public function test_banned_user_cannot_create_listing_while_ban_is_active(): void
    {
        $user = $this->createUser([
            'is_banned' => true,
            'banned_at' => now(),
            'banned_until' => now()->addDays(7),
            'banned_reason' => 'Fraud reports',
        ]);

        $this
            ->withHeaders($this->userHeaders($user))
            ->postJson('/api/listings', [
                'title' => 'Blocked listing',
                'price' => 100,
                'category' => 'Electronics',
                'location' => 'Dhaka',
            ])
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['success', 'message', 'banned_until']);
    }

    public function test_user_can_create_listing_after_ban_period_expires(): void
    {
        $user = $this->createUser([
            'is_banned' => true,
            'banned_at' => now()->subDays(10),
            'banned_until' => now()->subDay(),
            'banned_reason' => 'Temporary ban',
        ]);

        $this
            ->withHeaders($this->userHeaders($user))
            ->postJson('/api/listings', [
                'title' => 'Allowed listing',
                'price' => 200,
                'category' => 'Electronics',
                'location' => 'Dhaka',
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'Listing created successfully');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_banned' => false,
        ]);
    }
}
