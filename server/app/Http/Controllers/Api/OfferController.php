<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OfferResource;
use App\Models\Offer;
use App\Models\OfferHelpType;
use App\Models\OfferAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OfferController extends Controller
{
    public function index()
    {
        $offers = Offer::with(['helpTypes', 'availabilities', 'user'])->latest()->get();
        return response()->json([
            'message' => 'Offers fetched successfully.',
            'data' => OfferResource::collection($offers),
        ]);
    }

    public function show($id)
    {
        $offer = Offer::with(['helpTypes', 'availabilities', 'user'])->findOrFail($id);
        return response()->json([
            'message' => 'Offer fetched successfully.',
            'data' => new OfferResource($offer),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'short_summary' => 'required|string|max:255',
            'description' => 'required|string',
            'help_types' => 'required|array',
            'help_types.*' => [Rule::in(['food','medical','shelter','transportation','financial','utilities','disaster_relief','other'])],
            'availability' => 'required|array',
            'availability.*' => [Rule::in(['today','this_week','weekends','on_call','recurring'])],
            'service_radius' => 'nullable|integer',
            'contact_preference' => ['required', Rule::in(['in_app','phone'])],
            'is_recurring' => 'required|boolean',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $offer = Offer::create([
                'user_id' => Auth::id(),
                'short_summary' => $validated['short_summary'],
                'description' => $validated['description'],
                'service_radius' => $validated['service_radius'] ?? null,
                'contact_preference' => $validated['contact_preference'],
                'is_recurring' => $validated['is_recurring'],
            ]);

            $helpTypes = collect($validated['help_types'] ?? [])->map(function ($type) use ($offer) {
                return new OfferHelpType(['help_type' => $type]);
            });
            $offer->helpTypes()->saveMany($helpTypes);

            $availabilities = collect($validated['availability'] ?? [])->map(function ($avail) use ($offer) {
                return new OfferAvailability(['availability' => $avail]);
            });
            $offer->availabilities()->saveMany($availabilities);

            $offer->load(['helpTypes', 'availabilities', 'user']);

            return response()->json([
                'message' => 'Offer created successfully.',
                'data' => new OfferResource($offer),
            ], 201);
        });
    }

    public function destroy($id)
    {
        $offer = Offer::findOrFail($id);
        if ($offer->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Forbidden: You do not own this offer.'
            ], 403);
        }
        $offer->delete();
        return response()->json([
            'message' => 'Offer deleted successfully.'
        ]);
    }
}
