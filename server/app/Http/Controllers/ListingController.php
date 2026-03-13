<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ListingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'price'    => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'location' => 'required|string|max:255',
            'details'  => 'nullable|string',
            'photo'    => 'nullable|image|max:5120',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('listings', 'public');
        }

        $listing = Listing::create([
            'user_id'  => Auth::id(),
            'title'    => $validated['title'],
            'price'    => $validated['price'],
            'category' => $validated['category'],
            'location' => $validated['location'],
            'details'  => $validated['details'] ?? null,
            'photo'    => $photoPath,
        ]);

        return response()->json([
            'message' => 'Listing created successfully',
            'listing' => $listing->fresh(['user']),
        ], 201);
    }

    public function index()
    {
        $listings = Listing::with('user')
            ->latest()
            ->get()
            ->map(function ($listing) {
                return [
                    'id' => $listing->id,
                    'title' => $listing->title,
                    'price' => (float) $listing->price,
                    'category' => $listing->category,
                    'location' => $listing->location,
                    'details' => $listing->details,
                    'photo' => $listing->photo,
                    'photo_url' => $listing->photo_url,
                    'is_active' => $listing->is_active,
                    'created_at' => $listing->created_at,
                    'updated_at' => $listing->updated_at,
                    'user' => $listing->user,
                ];
            })
            ->values();

        return response()->json($listings);
    }
}
