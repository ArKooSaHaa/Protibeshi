<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Complaint;
use App\Models\ComplaintModerationLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminComplaintModerationController extends Controller
{
    public function index(Request $request)
    {
        $query = Complaint::query()->with([
            'user',
            'moderationLogs.admin',
        ]);

        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        $perPage = min(max((int) $request->query('per_page', 12), 1), 100);
        $paginatedComplaints = $query->paginate($perPage);

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
        $complaint = Complaint::query()
            ->with([
                'user',
                'moderationLogs.admin',
            ])
            ->find($id);

        if (!$complaint) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'complaint' => $this->formatComplaint($complaint),
        ], 200);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(Complaint::ALLOWED_STATUSES)],
            'note' => 'nullable|string|min:3|max:1000',
        ]);

        $complaint = Complaint::query()->find($id);

        if (!$complaint) {
            return response()->json([
                'success' => false,
                'message' => 'Complaint not found',
            ], 404);
        }

        $note = isset($validated['note']) ? trim((string) $validated['note']) : '';
        $nextStatus = (string) $validated['status'];

        if (in_array($nextStatus, [Complaint::STATUS_RESOLVED, Complaint::STATUS_REJECTED], true) && $note === '') {
            return response()->json([
                'success' => false,
                'message' => 'A moderation note is required for resolved or rejected complaints.',
            ], 422);
        }

        $adminId = Auth::guard('admin_api')->id();
        $previousStatus = (string) $complaint->status;

        DB::transaction(function () use ($complaint, $nextStatus, $note, $adminId, $previousStatus): void {
            $statusChanged = $previousStatus !== $nextStatus;

            if ($statusChanged) {
                $complaint->status = $nextStatus;
                $complaint->save();
            }

            if ($statusChanged || $note !== '') {
                ComplaintModerationLog::create([
                    'complaint_id' => $complaint->id,
                    'admin_id' => $adminId,
                    'action' => ComplaintModerationLog::ACTION_STATUS_UPDATE,
                    'from_status' => $statusChanged ? $previousStatus : $nextStatus,
                    'to_status' => $nextStatus,
                    'note' => $note !== '' ? $note : null,
                ]);
            }
        });

        $complaint->load([
            'user',
            'moderationLogs.admin',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Complaint status updated successfully',
            'complaint' => $this->formatComplaint($complaint),
        ], 200);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'complaint_ids' => 'required|array|min:1|max:200',
            'complaint_ids.*' => 'integer|min:1',
            'status' => ['required', Rule::in(Complaint::ALLOWED_STATUSES)],
            'note' => 'nullable|string|min:3|max:1000',
        ]);

        $note = isset($validated['note']) ? trim((string) $validated['note']) : '';
        $nextStatus = (string) $validated['status'];

        if (in_array($nextStatus, [Complaint::STATUS_RESOLVED, Complaint::STATUS_REJECTED], true) && $note === '') {
            return response()->json([
                'success' => false,
                'message' => 'A moderation note is required for resolved or rejected complaints.',
            ], 422);
        }

        $requestedIds = array_values(array_unique(array_map(
            static fn ($value): int => (int) $value,
            $validated['complaint_ids']
        )));

        $complaintsById = Complaint::query()
            ->whereIn('id', $requestedIds)
            ->get()
            ->keyBy('id');

        if ($complaintsById->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No complaints found for bulk moderation update.',
            ], 404);
        }

        $foundIds = $complaintsById->keys()->map(static fn ($value): int => (int) $value)->all();
        $missingIds = array_values(array_diff($requestedIds, $foundIds));
        $adminId = Auth::guard('admin_api')->id();

        DB::transaction(function () use ($complaintsById, $nextStatus, $note, $adminId): void {
            foreach ($complaintsById as $complaint) {
                $previousStatus = (string) $complaint->status;
                $statusChanged = $previousStatus !== $nextStatus;

                if ($statusChanged) {
                    $complaint->status = $nextStatus;
                    $complaint->save();
                }

                if ($statusChanged || $note !== '') {
                    ComplaintModerationLog::create([
                        'complaint_id' => $complaint->id,
                        'admin_id' => $adminId,
                        'action' => 'bulk_status_update',
                        'from_status' => $statusChanged ? $previousStatus : $nextStatus,
                        'to_status' => $nextStatus,
                        'note' => $note !== '' ? $note : null,
                    ]);
                }
            }
        });

        $updatedComplaints = Complaint::query()
            ->with([
                'user',
                'moderationLogs.admin',
            ])
            ->whereIn('id', $foundIds)
            ->latest()
            ->get();

        $message = empty($missingIds)
            ? 'Bulk complaint status update completed successfully'
            : 'Bulk complaint status update completed with some missing complaints';

        return response()->json([
            'success' => true,
            'message' => $message,
            'updated_count' => $updatedComplaints->count(),
            'missing_ids' => $missingIds,
            'complaints' => $updatedComplaints
                ->map(fn (Complaint $complaint) => $this->formatComplaint($complaint))
                ->values(),
        ], 200);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('tab')) {
            $tab = strtolower(trim((string) $request->query('tab')));

            if ($tab === 'urgent') {
                $query->where('priority', 'urgent');
            } elseif ($tab === 'private') {
                $query->where('visibility', Complaint::VISIBILITY_PRIVATE);
            } elseif ($tab === 'unresolved') {
                $query->whereNotIn('status', [
                    Complaint::STATUS_RESOLVED,
                    Complaint::STATUS_REJECTED,
                ]);
            }
        }

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

        if ($request->filled('visibility')) {
            $visibility = Complaint::normalizeVisibility((string) $request->query('visibility'));
            if (in_array($visibility, Complaint::ALLOWED_VISIBILITIES, true)) {
                $query->where('visibility', $visibility);
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
                        ->orWhere('complaint_code', 'like', "%{$keyword}%")
                        ->orWhereHas('user', function (Builder $userQuery) use ($keyword): void {
                            $userQuery
                                ->where('first_name', 'like', "%{$keyword}%")
                                ->orWhere('last_name', 'like', "%{$keyword}%")
                                ->orWhere('username', 'like', "%{$keyword}%")
                                ->orWhere('email', 'like', "%{$keyword}%");
                        });
                });
            }
        }
    }

    private function applySorting(Builder $query, Request $request): void
    {
        $sort = strtolower(trim((string) $request->query('sort', 'newest')));

        if ($sort === 'oldest') {
            $query->orderBy('created_at', 'asc');
            return;
        }

        if ($sort === 'priority') {
            $query
                ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
                ->orderByDesc('created_at');
            return;
        }

        if ($sort === 'distance') {
            $query
                ->orderByRaw('distance IS NULL')
                ->orderBy('distance', 'asc')
                ->orderByDesc('created_at');
            return;
        }

        $query->orderByDesc('created_at');
    }

    private function formatComplaint(Complaint $complaint): array
    {
        $logs = $complaint->moderationLogs
            ->sortByDesc('created_at')
            ->values();

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

        $assignedTo = null;
        $latestModeratorLog = $logs->first(static fn (ComplaintModerationLog $log): bool => $log->admin !== null);
        if ($latestModeratorLog && $latestModeratorLog->admin) {
            $assignedTo = $this->resolveAdminName($latestModeratorLog->admin);
        }

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
            'created_at' => optional($complaint->created_at)->toISOString(),
            'updated_at' => optional($complaint->updated_at)->toISOString(),
            'user' => $complaint->user ? [
                'id' => $complaint->user->id,
                'name' => $this->resolveUserName($complaint->user),
                'email' => $complaint->user->email,
                'username' => $complaint->user->username,
            ] : null,
            'updates' => $updates,
            'internal_notes' => $internalNotes,
            'assigned_to' => $assignedTo,
            'moderation_history' => $logs->map(function (ComplaintModerationLog $log): array {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'from_status' => $log->from_status,
                    'to_status' => $log->to_status,
                    'note' => $log->note,
                    'created_at' => optional($log->created_at)->toISOString(),
                    'admin' => $log->admin ? [
                        'id' => $log->admin->id,
                        'name' => $this->resolveAdminName($log->admin),
                        'email' => $log->admin->email,
                    ] : null,
                ];
            })->values(),
        ];
    }

    private function resolveStatusLabel(string $status): string
    {
        return str_replace('_', ' ', ucwords(str_replace('_', ' ', strtolower($status))));
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

    private function resolveUserName(User $user): string
    {
        $firstName = trim((string) ($user->first_name ?? ''));
        $lastName = trim((string) ($user->last_name ?? ''));
        $fullName = trim($firstName . ' ' . $lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        if (!empty($user->username)) {
            return (string) $user->username;
        }

        return (string) ($user->email ?? 'Unknown User');
    }

    private function resolveAdminName(Admin $admin): string
    {
        $name = trim((string) ($admin->name ?? ''));

        if ($name !== '') {
            return $name;
        }

        return (string) ($admin->email ?? 'Admin');
    }
}
