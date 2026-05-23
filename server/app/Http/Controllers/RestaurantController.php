<?php

namespace App\Http\Controllers;

use App\Enums\RestaurantStatus;
use App\Http\Requests\Restaurant\RestaurantFilterRequest;
use App\Http\Requests\Restaurant\StoreRestaurantRequest;
use App\Http\Requests\Restaurant\UpdateRestaurantRequest;
use App\Http\Resources\RestaurantDetailResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Models\RestaurantImage;
use App\Services\RestaurantQueryService;
use App\Support\ApiResponse;
use App\Traits\HandlesUploads;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RestaurantController extends Controller
{
    use ApiResponse, HandlesUploads;

    public function index(RestaurantFilterRequest $request, RestaurantQueryService $queryService)
    {
        $filters = $request->validated();
        $userId = $request->user()?->id;

        $query = Restaurant::query()
            ->with('user')
            ->approved();

        if ($userId) {
            $query->withExists([
                'favorites as is_favorited' => fn ($favoriteQuery) => $favoriteQuery->where('user_id', $userId),
            ]);
        }

        $queryService->apply($query, $filters);

        if (empty($filters['top_rated']) && empty($filters['newest'])) {
            $query->latest();
        }

        $perPage = (int) ($filters['per_page'] ?? 12);
        $restaurants = $query->paginate($perPage);

        return $this->successWithPagination(
            $restaurants,
            'Restaurants fetched successfully',
            RestaurantResource::collection($restaurants)
        );
    }

    public function show(Request $request, Restaurant $restaurant)
    {
        $viewerId = $request->user()?->id;
        $isOwner = $viewerId && (int) $restaurant->user_id === (int) $viewerId;
        $isAdmin = Auth::guard('admin_api')->check();

        if ($restaurant->status !== RestaurantStatus::Approved->value && !$isOwner && !$isAdmin) {
            return $this->error('Restaurant not found', 404);
        }

        if ($restaurant->status === RestaurantStatus::Approved->value) {
            $restaurant->increment('views_count');
        }

        $restaurant->load(['user', 'images', 'reviews.user']);

        if ($viewerId) {
            $restaurant->setAttribute(
                'is_favorited',
                $restaurant->favorites()->where('user_id', $viewerId)->exists()
            );
        }

        return $this->success(
            'Restaurant details fetched successfully',
            new RestaurantDetailResource($restaurant)
        );
    }

    public function myRestaurants(Request $request)
    {
        $user = $request->user();

        $restaurants = Restaurant::query()
            ->with('user')
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(20);

        return $this->successWithPagination(
            $restaurants,
            'Your restaurants fetched successfully',
            RestaurantResource::collection($restaurants)
        );
    }

    public function store(StoreRestaurantRequest $request)
    {
        $data = $request->validated();

        $restaurant = DB::transaction(function () use ($request, $data) {
            $imagePath = null;
            $coverPath = null;

            if ($request->hasFile('image')) {
                $imagePath = $this->storePublicFile($request->file('image'), 'restaurants');
            }

            if ($request->hasFile('cover_image')) {
                $coverPath = $this->storePublicFile($request->file('cover_image'), 'restaurants');
            }

            $restaurant = Restaurant::create([
                'user_id' => $request->user()->id,
                'name' => $data['name'],
                'owner_name' => $data['owner_name'] ?? null,
                'category' => $data['category'],
                'address' => $data['address'],
                'location' => $data['location'],
                'phone' => $data['phone'],
                'website' => $data['website'] ?? null,
                'opening_time' => $data['opening_time'] ?? null,
                'closing_time' => $data['closing_time'] ?? null,
                'description' => $data['description'],
                'price_range' => $data['price_range'] ?? '$$',
                'delivery_available' => (bool) ($data['delivery_available'] ?? false),
                'image' => $imagePath,
                'cover_image' => $coverPath,
                'status' => RestaurantStatus::Pending->value,
                'is_verified' => false,
                'rating' => 0,
                'total_reviews' => 0,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'views_count' => 0,
            ]);

            if (!empty($data['images'])) {
                foreach ($request->file('images', []) as $file) {
                    $restaurant->images()->create([
                        'image' => $this->storePublicFile($file, 'restaurants/gallery'),
                    ]);
                }
            }

            return $restaurant;
        });

        $restaurant->load(['user', 'images', 'reviews.user']);

        return $this->success(
            'Restaurant submitted for review',
            new RestaurantDetailResource($restaurant),
            201
        );
    }

    public function update(UpdateRestaurantRequest $request, Restaurant $restaurant)
    {
        $this->authorize('update', $restaurant);
        $data = $request->validated();

        DB::transaction(function () use ($request, $data, $restaurant) {
            if ($request->hasFile('image')) {
                $this->deletePublicFile($restaurant->image);
                $data['image'] = $this->storePublicFile($request->file('image'), 'restaurants');
            }

            if ($request->hasFile('cover_image')) {
                $this->deletePublicFile($restaurant->cover_image);
                $data['cover_image'] = $this->storePublicFile($request->file('cover_image'), 'restaurants');
            }

            $removeIds = $data['remove_image_ids'] ?? [];
            if (!empty($removeIds)) {
                $images = $restaurant->images()->whereIn('id', $removeIds)->get();
                foreach ($images as $image) {
                    $this->deletePublicFile($image->image);
                    $image->delete();
                }
            }

            if (!empty($data['images'])) {
                foreach ($request->file('images', []) as $file) {
                    $restaurant->images()->create([
                        'image' => $this->storePublicFile($file, 'restaurants/gallery'),
                    ]);
                }
            }

            unset($data['images'], $data['remove_image_ids']);

            $restaurant->fill($data);
            $restaurant->save();
        });

        $restaurant->load(['user', 'images', 'reviews.user']);

        return $this->success(
            'Restaurant updated successfully',
            new RestaurantDetailResource($restaurant)
        );
    }

    public function destroy(Restaurant $restaurant)
    {
        $this->authorize('delete', $restaurant);

        DB::transaction(function () use ($restaurant) {
            $this->deletePublicFile($restaurant->image);
            $this->deletePublicFile($restaurant->cover_image);

            $images = $restaurant->images()->get();
            foreach ($images as $image) {
                $this->deletePublicFile($image->image);
                $image->delete();
            }

            $restaurant->delete();
        });

        return $this->success('Restaurant deleted successfully');
    }
}
