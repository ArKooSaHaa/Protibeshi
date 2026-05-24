<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\ComplaintModerationLog;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Throwable;

class ComplaintController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'category' => ['required', 'string'],
            'description' => 'required|string|max:2000',
            'location' => 'required|string|max:255',
            'priority' => ['required', 'string'],
            'visibility' => ['required', 'string'],
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $category = Complaint::normalizeCategory($validated['category']);
        $priority = Complaint::normalizePriority($validated['priority']);
        $visibility = Complaint::normalizeVisibility($validated['visibility']);

        if (!in_array($category, Complaint::ALLOWED_CATEGORIES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid complaint category',
            ], 422);
        }

        if (!in_array($priority, Complaint::ALLOWED_PRIORITIES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid complaint priority',
            ], 422);
        }

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
            'complaint_code' => $this->generateTemporaryComplaintCode(),
            'title' => $validated['title'],
            'category' => $category,
            'description' => $validated['description'],
            'location' => $validated['location'],
            'priority' => $priority,
            'visibility' => $visibility,
            'photo' => $photoPath,
            'status' => Complaint::STATUS_PENDING,
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
        $query = Complaint::query()->with([
            'user',
            'moderationLogs.admin',
        ]);

        $query->where('visibility', Complaint::VISIBILITY_PUBLIC);
        $this->applyFilters($query, request());

        $perPage = min(max((int) request()->query('per_page', 15), 1), 100);
        $paginatedComplaints = $query->latest()->paginate($perPage);

        $complaints = collect($paginatedComplaints->items())
            ->map(fn (Complaint $complaint) => $this->formatComplaint($complaint))
            ->values();

        return response()->json([
            'success' => true,
            'complaints' => $complaints,
            'pagination' => [
                'current_page' => $paginatedComplaints->currentPage(),
                'last_page' => $paginatedComplaints->lastPage(),
                'per_page' => $paginatedComplaints->perPage(),
                'total' => $paginatedComplaints->total(),
                'from' => $paginatedComplaints->firstItem(),
                'to' => $paginatedComplaints->lastItem(),
            ],
        ], 200);
    }

    public function myComplaints(Request $request)
    {
        $query = Complaint::query()
            ->with([
                'user',
                'moderationLogs.admin',
            ])
            ->where('user_id', Auth::id());

        $this->applyFilters($query, $request);

        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
        $paginatedComplaints = $query->latest()->paginate($perPage);

        $complaints = collect($paginatedComplaints->items())
            ->map(fn (Complaint $complaint) => $this->formatComplaint($complaint))
            ->values();

        return response()->json([
            'success' => true,
            'complaints' => $complaints,
            'pagination' => [
                'current_page' => $paginatedComplaints->currentPage(),
                'last_page' => $paginatedComplaints->lastPage(),
                'per_page' => $paginatedComplaints->perPage(),
                'total' => $paginatedComplaints->total(),
                'from' => $paginatedComplaints->firstItem(),
                'to' => $paginatedComplaints->lastItem(),
            ],
        ], 200);
    }

    public function show($id)
    {
        try {
            $complaint = Complaint::with([
                'user',
                'moderationLogs.admin',
            ])->findOrFail($id);

            if (!$this->canViewComplaint($complaint)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Complaint not found',
                ], 404);
            }

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

        if (!empty($complaint->photo)) {
            Storage::disk('public')->delete($complaint->photo);
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
            'status' => ['required', Rule::in(Complaint::ALLOWED_STATUSES)],
        ]);

        try {
            $complaint = Complaint::with([
                'user',
                'moderationLogs.admin',
            ])->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        $user = Auth::guard('api')->user() ?? Auth::user();

        $isOwner = $user && ((int) $complaint->user_id === (int) $user->id);
        $canModerate = $user && $this->canUpdateComplaintStatus($user);

        if (!$isOwner && !$canModerate) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update complaint status',
            ], 403);
        }

        $complaint->status = $validated['status'];
        $complaint->save();

        return response()->json([
            'success' => true,
            'message' => 'Complaint status updated successfully',
            'complaint' => $this->formatComplaint($complaint->fresh([
                'user',
                'moderationLogs.admin',
            ])),
        ], 200);
    }

    private function formatComplaint(Complaint $complaint): array
    {
        $logs = $complaint->relationLoaded('moderationLogs')
            ? $complaint->moderationLogs->sortBy(function (ComplaintModerationLog $log): string {
                $createdAt = optional($log->created_at)->format('Y-m-d H:i:s.u') ?? '';
                return $createdAt.'|'.str_pad((string) $log->id, 12, '0', STR_PAD_LEFT);
            })->values()
            : collect();

        $updates = collect([
            [
                'stage' => 'Reported',
                'date' => optional($complaint->created_at)->toISOString(),
                'note' => null,
            ],
        ])->merge(
            $logs->map(function (ComplaintModerationLog $log): array {
                return [
                    'stage' => $this->resolveStatusLabel((string) $log->to_status),
                    'date' => optional($log->created_at)->toISOString(),
                    'note' => $log->note ?: null,
                ];
            })
        )->values();

        $internalNotes = $logs
            ->pluck('note')
            ->filter(static fn ($value): bool => is_string($value) && trim($value) !== '')
            ->map(static fn ($value): string => trim((string) $value))
            ->unique()
            ->values();

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
            'updates' => $updates,
            'internal_notes' => $internalNotes,
            'resolution_summary' => $internalNotes->isNotEmpty() && in_array($complaint->status, [Complaint::STATUS_RESOLVED, Complaint::STATUS_REJECTED], true)
                ? $internalNotes->last()
                : null,
            'user' => $complaint->user ? [
                'id' => $complaint->user->id,
                'name' => $this->resolveUserName($complaint),
            ] : null,
        ];
    }

    private function resolveStatusLabel(string $status): string
    {
        return str_replace('_', ' ', ucwords(str_replace('_', ' ', strtolower($status))));
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('category')) {
            $category = Complaint::normalizeCategory((string) $request->query('category'));
            if (in_array($category, Complaint::ALLOWED_CATEGORIES, true)) {
                $query->where('category', $category);
            }
        }

        if ($request->filled('priority')) {
            $priority = Complaint::normalizePriority((string) $request->query('priority'));
            if (in_array($priority, Complaint::ALLOWED_PRIORITIES, true)) {
                $query->where('priority', $priority);
            }
        }

        if ($request->filled('status')) {
            $status = strtolower((string) $request->query('status'));
            if (in_array($status, Complaint::ALLOWED_STATUSES, true)) {
                $query->where('status', $status);
            }
        }

        if ($request->filled('search')) {
            $keyword = trim((string) $request->query('search'));
            if ($keyword !== '') {
                $query->where(function (Builder $subQuery) use ($keyword): void {
                    $subQuery
                        ->where('title', 'like', "%{$keyword}%")
                        ->orWhere('description', 'like', "%{$keyword}%")
                        ->orWhere('location', 'like', "%{$keyword}%")
                        ->orWhere('complaint_code', 'like', "%{$keyword}%");
                });
            }
        }
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

    private function generateTemporaryComplaintCode(): string
    {
        return 'TMP-'.strtoupper(uniqid());
    }

    private function canViewComplaint(Complaint $complaint): bool
    {
        if ($complaint->visibility === Complaint::VISIBILITY_PUBLIC) {
            return true;
        }

        $currentUser = Auth::guard('api')->user() ?? Auth::user();

        if (!$currentUser) {
            return false;
        }

        if ((int) $currentUser->id === (int) $complaint->user_id) {
            return true;
        }

        return $this->canUpdateComplaintStatus($currentUser);
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
