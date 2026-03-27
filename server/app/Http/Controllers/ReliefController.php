<?php

namespace App\Http\Controllers;

use App\Models\Relief;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ReliefController extends Controller
{
    private const ALLOWED_STATUSES = [
        'open',
        'assigned',
        'completed',
    ];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'description' => 'required|string',
            'urgency' => 'required|string|max:100',
            'time_sensitivity' => 'nullable|string|max:255',
            'visibility' => 'required|string|max:100',
            'contact_preference' => 'required|string|max:100',
            'location' => 'required|string|max:255',
            'cover_photo' => 'nullable|string|max:255',
        ]);

        $relief = Relief::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'type' => $validated['type'],
            'description' => $validated['description'],
            'urgency' => $validated['urgency'],
            'time_sensitivity' => $validated['time_sensitivity'] ?? null,
            'visibility' => $validated['visibility'],
            'contact_preference' => $validated['contact_preference'],
            'location' => $validated['location'],
            'status' => 'open',
            'helpers_count' => 0,
            'cover_photo' => $validated['cover_photo'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Relief request created successfully',
            'relief' => $relief->load('user'),
        ], 201);
    }

    public function index()
    {
        $reliefs = Relief::with('user')->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Relief requests fetched successfully',
            'reliefs' => $reliefs,
        ], 200);
    }

    public function show($id)
    {
        try {
            $relief = Relief::with('user')->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Relief request fetched successfully',
                'relief' => $relief,
            ], 200);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }
    }

    public function offerHelp($id)
    {
        try {
            $relief = Relief::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        $relief->increment('helpers_count');

        return response()->json([
            'success' => true,
            'message' => 'Help offer submitted successfully',
            'helpers_count' => (int) $relief->fresh()->helpers_count,
            'relief' => $relief->fresh('user'),
        ], 200);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::ALLOWED_STATUSES)],
        ]);

        try {
            $relief = Relief::with('user')->findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        if ((int) $relief->user_id !== (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to update this relief request',
            ], 403);
        }

        $relief->status = $validated['status'];
        $relief->save();

        return response()->json([
            'success' => true,
            'message' => 'Relief request status updated successfully',
            'relief' => $relief->fresh('user'),
        ], 200);
    }

    public function destroy($id)
    {
        try {
            $relief = Relief::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Relief request not found',
            ], 404);
        }

        if ((int) $relief->user_id !== (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this relief request',
            ], 403);
        }

        $relief->delete();

        return response()->json([
            'success' => true,
            'message' => 'Relief request deleted successfully',
        ], 200);
    }
}
