<?php

namespace App\Http\Controllers;

use App\Models\RentListing;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Throwable;

class RentListingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'deposit' => 'nullable|numeric|min:0',
            'distance' => 'nullable|integer|min:0',
            'size_sqft' => 'nullable|integer|min:0',
            'beds' => 'nullable|integer|min:0',
            'baths' => 'nullable|integer|min:0',
            'type' => 'nullable|string|max:100',
            'furnishing' => 'nullable|string|max:100',
            'availability' => 'nullable|string|max:100',
            'badge' => 'nullable|string|max:100',
            'verified_landlord' => 'nullable|boolean',
            'photo' => 'nullable|image|max:5120',
        ]);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            try {
                $photoPath = $request->file('photo')->store('rent', 'public');
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => 'Failed to upload image',
                ], 500);
            }
        }

        $listing = RentListing::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'location' => $validated['location'],
            'price' => $validated['price'],
            'deposit' => $validated['deposit'] ?? null,
            'distance' => $validated['distance'] ?? null,
            'size_sqft' => $validated['size_sqft'] ?? null,
            'beds' => $validated['beds'] ?? null,
            'baths' => $validated['baths'] ?? null,
            'type' => $validated['type'] ?? null,
            'furnishing' => $validated['furnishing'] ?? null,
            'availability' => $validated['availability'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'verified_landlord' => $validated['verified_landlord'] ?? false,
            'photo' => $photoPath,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Rent listing created successfully',
            'listing' => $this->formatListing($listing->load('user')),
        ], 201);
    }

    public function index()
    {
        $listings = RentListing::with('user')
            ->where('is_active', true)
            ->latest()
            ->get()
            ->map(function (RentListing $listing) {
                return $this->formatListing($listing);
            })
            ->values();

        return response()->json($listings, 200);
    }

    public function show($id)
    {
        try {
            $listing = RentListing::with('user')
                ->where('is_active', true)
                ->findOrFail($id);

            return response()->json($this->formatListing($listing), 200);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'message' => 'Rent listing not found',
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $listing = RentListing::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'message' => 'Rent listing not found',
            ], 404);
        }

        if ((int) $listing->user_id !== (int) Auth::id()) {
            return response()->json([
                'message' => 'You are not authorized to delete this listing',
            ], 403);
        }

        $listing->delete();

        return response()->json([
            'message' => 'Rent listing deleted successfully',
        ], 200);
    }

    private function formatListing(RentListing $listing)
    {
        return [
            'id' => $listing->id,
            'title' => $listing->title,
            'location' => $listing->location,
            'price' => (float) $listing->price,
            'deposit' => $listing->deposit !== null ? (float) $listing->deposit : null,
            'distance' => $listing->distance,
            'beds' => $listing->beds,
            'baths' => $listing->baths,
            'size_sqft' => $listing->size_sqft,
            'type' => $listing->type,
            'furnishing' => $listing->furnishing,
            'availability' => $listing->availability,
            'badge' => $listing->badge,
            'verified_landlord' => (bool) $listing->verified_landlord,
            'photo' => $listing->photo,
            'created_at' => $listing->created_at,
            'user' => $listing->user ? [
                'id' => $listing->user->id,
                'first_name' => $listing->user->first_name,
                'last_name' => $listing->user->last_name,
                'profile_picture' => $this->resolveProfilePictureUrl($listing->user->profile_picture),
                'profile_picture_url' => $this->resolveProfilePictureUrl($listing->user->profile_picture),
            ] : null,
        ];
    }

    private function resolveProfilePictureUrl(?string $profilePicture): ?string
    {
        $profilePicture = $profilePicture !== null ? trim($profilePicture) : null;

        if ($profilePicture === null || $profilePicture === '') {
            return null;
        }

        if (filter_var($profilePicture, FILTER_VALIDATE_URL)) {
            return $profilePicture;
        }

        if (str_starts_with($profilePicture, '/')) {
            return url($profilePicture);
        }

        return url(Storage::url($profilePicture));
    }
}
