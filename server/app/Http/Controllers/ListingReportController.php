<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\ListingReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ListingReportController extends Controller
{
    public function report(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $listing = Listing::find($id);

        if (!$listing || !$listing->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Listing not found',
            ], 404);
        }

        if ((int) $listing->user_id === (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report your own listing',
            ], 403);
        }

        $report = ListingReport::firstOrCreate(
            [
                'listing_id' => $listing->id,
                'user_id' => Auth::id(),
            ],
            [
                'reason' => $validated['reason'] ?? null,
            ]
        );

        $isUpdated = false;

        if (!$report->wasRecentlyCreated && array_key_exists('reason', $validated)) {
            $report->reason = $validated['reason'];
            $report->save();
            $isUpdated = true;
        }

        return response()->json([
            'success' => true,
            'message' => $isUpdated
                ? 'Listing report updated successfully'
                : 'Listing reported successfully',
            'report_id' => $report->id,
        ], $isUpdated ? 200 : 201);
    }
}