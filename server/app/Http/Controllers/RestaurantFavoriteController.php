<?php

namespace App\Http\Controllers;

use App\Enums\RestaurantStatus;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Models\RestaurantFavorite;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class RestaurantFavoriteController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $user = $request->user();

        $favorites = $user->favoriteRestaurants()
            ->with('user')
            ->where('status', RestaurantStatus::Approved->value)
            ->latest('restaurant_favorites.created_at')
            ->paginate(12);

        return $this->successWithPagination(
            $favorites,
            'Favorite restaurants fetched successfully',
            RestaurantResource::collection($favorites)
        );
    }

    public function store(Request $request, Restaurant $restaurant)
    {
        if ($restaurant->status !== RestaurantStatus::Approved->value) {
            return $this->error('Restaurant not found', 404);
        }

        $favorite = RestaurantFavorite::firstOrCreate([
            'user_id' => $request->user()->id,
            'restaurant_id' => $restaurant->id,
        ]);

        return $this->success('Restaurant added to favorites', [
            'favorite_id' => $favorite->id,
        ], 201);
    }

    public function destroy(Request $request, Restaurant $restaurant)
    {
        RestaurantFavorite::where('user_id', $request->user()->id)
            ->where('restaurant_id', $restaurant->id)
            ->delete();

        return $this->success('Restaurant removed from favorites');
    }
}
