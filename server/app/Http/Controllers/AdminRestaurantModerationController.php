<?php

namespace App\Http\Controllers;

use App\Enums\RestaurantStatus;
use App\Http\Requests\Restaurant\AdminUpdateRestaurantStatusRequest;
use App\Http\Resources\RestaurantDetailResource;
use App\Models\Restaurant;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AdminRestaurantModerationController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $restaurants = Restaurant::query()
            ->with(['user', 'images', 'reviews.user'])
            ->latest()
            ->paginate(25);

        return $this->successWithPagination(
            $restaurants,
            'Restaurants fetched successfully',
            RestaurantDetailResource::collection($restaurants)
        );
    }

    public function updateStatus(AdminUpdateRestaurantStatusRequest $request, Restaurant $restaurant)
    {
        $validated = $request->validated();

        $restaurant->status = $validated['status'];

        if (array_key_exists('is_verified', $validated)) {
            $restaurant->is_verified = (bool) $validated['is_verified'];
        } elseif ($validated['status'] === RestaurantStatus::Approved->value) {
            $restaurant->is_verified = true;
        }

        $restaurant->save();

        $restaurant->load(['user', 'images', 'reviews.user']);

        return $this->success('Restaurant status updated', [
            'restaurant' => new RestaurantDetailResource($restaurant),
            'note' => $validated['note'] ?? null,
        ]);
    }

    public function destroy(Request $request, Restaurant $restaurant)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $restaurant->delete();

        return $this->success('Restaurant removed from public listings', [
            'restaurant_id' => $restaurant->id,
            'reason' => $validated['reason'],
        ]);
    }
}
