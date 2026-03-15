<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ComplaintController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'category' => 'required|string',
            'description' => 'required|string',
            'location' => 'required|string',
            'priority' => 'required|string',
            'visibility' => 'required|string',
            'photo' => 'nullable|image',
        ]);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            try {
                $photoPath = $request->file('photo')->store('complaints', 'public');
            } catch (Throwable $exception) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload complaint photo',
                ], 500);
            }
        }

        $complaint = Complaint::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'location' => $validated['location'],
            'priority' => $validated['priority'],
            'visibility' => $validated['visibility'],
            'photo' => $photoPath,
            'status' => 'pending',
            'distance' => null,
        ]);

        $complaint->complaint_code = $this->generateComplaintCode((int) $complaint->id);
        $complaint->save();

        $complaint->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Complaint submitted successfully',
            'complaint' => $this->formatComplaint($complaint),
        ], 201);
    }

    public function index()
    {
        $complaints = Complaint::with('user')
            ->latest()
            ->get()
            ->map(fn (Complaint $complaint) => $this->formatComplaint($complaint))
            ->values();

        return response()->json([
            'success' => true,
            'complaints' => $complaints,
        ], 200);
    }

    public function show($id)
    {
        try {
            $complaint = Complaint::with('user')->findOrFail($id);

            return response()->json([
                'success' => true,
                'complaint' => $this->formatComplaint($complaint),
            ], 200);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $complaint = Complaint::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        if ((int) $complaint->user_id !== (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this complaint',
            ], 403);
        }

        $complaint->delete();

        return response()->json([
            'success' => true,
            'message' => 'Complaint deleted successfully',
        ], 200);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,under_review,in_progress,resolved,rejected',
        ]);

        $user = Auth::user();

        if (!$user || !$this->canUpdateComplaintStatus($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update complaint status',
            ], 403);
        }

        try {
            $complaint = Complaint::with('user')->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        $complaint->status = $validated['status'];
        $complaint->save();

        return response()->json([
            'success' => true,
            'message' => 'Complaint status updated successfully',
            'complaint' => $this->formatComplaint($complaint->fresh('user')),
        ], 200);
    }

    private function formatComplaint(Complaint $complaint): array
    {
        return [
            'id' => $complaint->id,
            'complaint_code' => $complaint->complaint_code,
            'title' => $complaint->title,
            'category' => $complaint->category,
            'description' => $complaint->description,
            'priority' => $complaint->priority,
            'status' => $complaint->status,
            'visibility' => $complaint->visibility,
            'location' => $complaint->location,
            'distance' => $complaint->distance,
            'photo' => $this->resolvePhotoUrl($complaint->photo),
            'created_at' => $complaint->created_at,
            'updated_at' => $complaint->updated_at,
            'user' => $complaint->user ? [
                'id' => $complaint->user->id,
                'name' => $this->resolveUserName($complaint),
            ] : null,
        ];
    }

    private function resolvePhotoUrl(?string $photoPath): ?string
    {
        if (!$photoPath) {
            return null;
        }

        if (filter_var($photoPath, FILTER_VALIDATE_URL)) {
            return $photoPath;
        }

        if (str_starts_with($photoPath, '/')) {
            return $photoPath;
        }

        return Storage::url($photoPath);
    }

    private function resolveUserName(Complaint $complaint): string
    {
        $firstName = trim((string) ($complaint->user->first_name ?? ''));
        $lastName = trim((string) ($complaint->user->last_name ?? ''));
        $fullName = trim($firstName . ' ' . $lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        if (!empty($complaint->user->username)) {
            return (string) $complaint->user->username;
        }

        return (string) ($complaint->user->email ?? 'Unknown User');
    }

    private function generateComplaintCode(int $id): string
    {
        $year = now()->year;
        $paddedId = str_pad((string) $id, 4, '0', STR_PAD_LEFT);

        return sprintf('CMP-%d-%s', $year, $paddedId);
    }

    private function canUpdateComplaintStatus($user): bool
    {
        if (isset($user->is_admin) && (bool) $user->is_admin) {
            return true;
        }

        if (isset($user->is_moderator) && (bool) $user->is_moderator) {
            return true;
        }

        $role = strtolower((string) ($user->role ?? $user->user_type ?? ''));

        if (in_array($role, ['admin', 'moderator'], true)) {
            return true;
        }

        $username = strtolower((string) ($user->username ?? ''));

        return in_array($username, ['admin', 'moderator'], true);
    }
}
