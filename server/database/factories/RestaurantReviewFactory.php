<?php

namespace Database\Factories;

use App\Models\Restaurant;
use App\Models\RestaurantReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RestaurantReviewFactory extends Factory
{
    protected $model = RestaurantReview::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'restaurant_id' => Restaurant::factory(),
            'rating' => $this->faker->numberBetween(1, 5),
            'review' => $this->faker->sentence(16),
        ];
    }
}
