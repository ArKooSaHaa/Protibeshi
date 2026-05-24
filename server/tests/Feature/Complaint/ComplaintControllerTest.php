<?php

namespace Tests\Feature\Complaint;

use App\Models\Complaint;
use App\Models\ComplaintModerationLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ComplaintControllerTest extends TestCase
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

    private function createComplaint(User $user, array $attributes = []): Complaint
    {
        /** @var Complaint $complaint */
        $complaint = Complaint::query()->create(array_merge([
            'user_id' => $user->id,
            'complaint_code' => 'CMP-2026-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT),
            'title' => 'Broken streetlight',
            'category' => 'electricity',
            'description' => 'The streetlight near block B has been broken for days.',
            'location' => 'Motijheel, Dhaka',
            'priority' => 'medium',
            'visibility' => Complaint::VISIBILITY_PUBLIC,
            'status' => Complaint::STATUS_PENDING,
            'photo' => null,
            'distance' => null,
        ], $attributes));

        return $complaint->fresh();
    }

    public function test_authenticated_user_can_create_complaint_with_ui_payload_values(): void
    {
        $user = $this->createUser();
        $token = JWTAuth::fromUser($user);

        $response = $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/complaints', [
                'title' => 'Road is damaged badly',
                'category' => 'infrastructure',
                'description' => 'Large pothole in front of gate 2 causing traffic issues.',
                'location' => 'Motijheel',
                'priority' => 'High',
                'visibility' => 'Only admins',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('complaint.category', 'road damage')
            ->assertJsonPath('complaint.priority', 'high')
            ->assertJsonPath('complaint.visibility', 'private')
            ->assertJsonPath('complaint.status', 'pending');

        $this->assertDatabaseHas('complaints', [
            'title' => 'Road is damaged badly',
            'category' => 'road damage',
            'priority' => 'high',
            'visibility' => 'private',
            'user_id' => $user->id,
        ]);
    }

    public function test_public_complaints_index_excludes_private_complaints(): void
    {
        $user = $this->createUser();

        $publicComplaint = $this->createComplaint($user, [
            'title' => 'Public complaint',
            'visibility' => Complaint::VISIBILITY_PUBLIC,
        ]);

        $this->createComplaint($user, [
            'title' => 'Private complaint',
            'visibility' => Complaint::VISIBILITY_PRIVATE,
        ]);

        $response = $this->getJson('/api/complaints');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('complaints.0.id', $publicComplaint->id)
            ->assertJsonCount(1, 'complaints')
            ->assertJsonStructure([
                'success',
                'complaints',
                'pagination' => ['current_page', 'last_page', 'per_page', 'total', 'from', 'to'],
            ]);
    }

    public function test_public_complaint_show_includes_moderation_timeline_and_notes(): void
    {
        $user = $this->createUser();
        $complaint = $this->createComplaint($user, [
            'title' => 'Complaint with moderator notes',
            'status' => Complaint::STATUS_RESOLVED,
        ]);

        ComplaintModerationLog::query()->create([
            'complaint_id' => $complaint->id,
            'admin_id' => null,
            'action' => ComplaintModerationLog::ACTION_STATUS_UPDATE,
            'from_status' => Complaint::STATUS_PENDING,
            'to_status' => Complaint::STATUS_IN_PROGRESS,
            'note' => 'received',
        ]);

        ComplaintModerationLog::query()->create([
            'complaint_id' => $complaint->id,
            'admin_id' => null,
            'action' => ComplaintModerationLog::ACTION_STATUS_UPDATE,
            'from_status' => Complaint::STATUS_IN_PROGRESS,
            'to_status' => Complaint::STATUS_RESOLVED,
            'note' => 'solved the matter',
        ]);

        $response = $this->getJson('/api/complaints/'.$complaint->id);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('complaint.updates.0.stage', 'Reported')
            ->assertJsonPath('complaint.updates.1.stage', 'In Progress')
            ->assertJsonPath('complaint.updates.1.note', 'received')
            ->assertJsonPath('complaint.updates.2.stage', 'Resolved')
            ->assertJsonPath('complaint.updates.2.note', 'solved the matter')
            ->assertJsonPath('complaint.internal_notes.0', 'received')
            ->assertJsonPath('complaint.internal_notes.1', 'solved the matter')
            ->assertJsonPath('complaint.resolution_summary', 'solved the matter');
    }

    public function test_authenticated_user_can_list_own_complaints_including_private(): void
    {
        $owner = $this->createUser();
        $otherUser = $this->createUser();
        $token = JWTAuth::fromUser($owner);

        $this->createComplaint($owner, [
            'title' => 'Owner private complaint',
            'visibility' => Complaint::VISIBILITY_PRIVATE,
        ]);

        $this->createComplaint($otherUser, [
            'title' => 'Other user complaint',
            'visibility' => Complaint::VISIBILITY_PUBLIC,
        ]);

        $response = $this
            ->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/account/complaints');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'complaints')
            ->assertJsonPath('complaints.0.title', 'Owner private complaint')
            ->assertJsonPath('complaints.0.visibility', 'private');
    }

    public function test_user_can_delete_own_complaint_but_not_others(): void
    {
        $owner = $this->createUser();
        $otherUser = $this->createUser();

        $ownerComplaint = $this->createComplaint($owner);
        $otherComplaint = $this->createComplaint($otherUser);

        $ownerToken = JWTAuth::fromUser($owner);

        $this
            ->withHeader('Authorization', 'Bearer '.$ownerToken)
            ->deleteJson('/api/complaints/'.$ownerComplaint->id)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('complaints', [
            'id' => $ownerComplaint->id,
        ]);

        $this
            ->withHeader('Authorization', 'Bearer '.$ownerToken)
            ->deleteJson('/api/complaints/'.$otherComplaint->id)
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_owner_can_update_status_but_other_user_cannot(): void
    {
        $owner = $this->createUser(['username' => 'owner_user']);
        $otherUser = $this->createUser(['username' => 'another_user']);

        $complaint = $this->createComplaint($owner);

        $this
            ->actingAs($otherUser, 'api')
            ->patchJson('/api/complaints/'.$complaint->id.'/status', [
                'status' => Complaint::STATUS_RESOLVED,
            ])
            ->assertForbidden()
            ->assertJsonPath('success', false);

        $this
            ->actingAs($owner, 'api')
            ->patchJson('/api/complaints/'.$complaint->id.'/status', [
                'status' => Complaint::STATUS_RESOLVED,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('complaint.status', Complaint::STATUS_RESOLVED);

        $this->assertDatabaseHas('complaints', [
            'id' => $complaint->id,
            'status' => Complaint::STATUS_RESOLVED,
        ]);
    }
}
