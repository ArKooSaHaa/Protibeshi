<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceReportController extends Controller
{
    public function report(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $service = Service::find($id);

        if (!$service || !(bool) $service->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
            ], 404);
        }

        if ((int) $service->user_id === (int) Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report your own service',
            ], 403);
        }

        $report = ServiceReport::firstOrCreate(
            [
                'service_id' => $service->id,
                'user_id' => Auth::id(),
            ],
            [
                'reason' => $validated['reason'] ?? null,
                'source' => 'user',
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
                ? 'Service report updated successfully'
                : 'Service reported successfully',
            'report_id' => $report->id,
        ], $isUpdated ? 200 : 201);
    }
}
