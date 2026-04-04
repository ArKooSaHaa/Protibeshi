<?php

namespace App\Http\Controllers;

use App\Models\RentListing;
use App\Models\RentListingReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RentListingReportController extends Controller
{
    public function report(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $listing = RentListing::find($id);

        if (!$listing || !(bool) $listing->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Rent listing not found',
            ], 404);
        }

        if ((int) $listing->user_id === (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report your own rent listing',
            ], 403);
        }

        $report = RentListingReport::firstOrCreate(
            [
                'rent_listing_id' => $listing->id,
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
                ? 'Rent listing report updated successfully'
                : 'Rent listing reported successfully',
            'report_id' => $report->id,
        ], $isUpdated ? 200 : 201);
    }
}
