<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\RestaurantReview;
use App\Models\User;
use App\Services\RestaurantRatingService;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $ratingService = app(RestaurantRatingService::class);
        $userIds = User::query()->pluck('id')->all();

        Restaurant::factory()
            ->count(25)
            ->create()
            ->each(function (Restaurant $restaurant) use ($ratingService, $userIds) {
                if (empty($userIds)) {
                    return;
                }

                $reviewCount = random_int(0, 5);
                $reviewerIds = collect($userIds)->shuffle()->take($reviewCount);

                foreach ($reviewerIds as $reviewerId) {
                    RestaurantReview::factory()->create([
                        'user_id' => $reviewerId,
                        'restaurant_id' => $restaurant->id,
                    ]);
                }

                $ratingService->refresh($restaurant->fresh());
            });
    }
}
