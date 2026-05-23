<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use App\Services\RestaurantRatingService;
use Illuminate\Console\Command;

class RecalculateRestaurantRatings extends Command
{
    protected $signature = 'restaurants:recalculate-ratings {--restaurant= : Limit to a single restaurant ID}';

    protected $description = 'Recalculate average ratings and review counts for restaurants';

    public function handle(RestaurantRatingService $ratingService): int
    {
        $query = Restaurant::query();

        if ($restaurantId = $this->option('restaurant')) {
            $query->whereKey($restaurantId);
        }

        $count = 0;

        $query->cursor()->each(function (Restaurant $restaurant) use ($ratingService, &$count) {
            $ratingService->refresh($restaurant);
            $count++;
        });

        $this->info("Recalculated ratings for {$count} restaurant(s).");

        return self::SUCCESS;
    }
}
