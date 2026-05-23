<?php

namespace Database\Factories;

use App\Enums\RestaurantStatus;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RestaurantFactory extends Factory
{
    protected $model = Restaurant::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->company;

        return [
            'user_id' => User::factory(),
            'name' => $name,
            'slug' => Str::slug($name) . '-' . $this->faker->unique()->numberBetween(10, 9999),
            'owner_name' => $this->faker->name,
            'category' => $this->faker->randomElement([
                'Bengali',
                'Chinese',
                'Fast Food',
                'Cafe',
                'Dessert',
            ]),
            'address' => $this->faker->streetAddress,
            'location' => $this->faker->city,
            'phone' => $this->faker->phoneNumber,
            'website' => $this->faker->url,
            'opening_time' => $this->faker->time('H:i'),
            'closing_time' => $this->faker->time('H:i'),
            'description' => $this->faker->paragraph(3),
            'price_range' => $this->faker->randomElement(['$', '$$', '$$$']),
            'delivery_available' => $this->faker->boolean(70),
            'rating' => 0,
            'total_reviews' => 0,
            'is_verified' => $this->faker->boolean(50),
            'status' => RestaurantStatus::Pending->value,
            'latitude' => $this->faker->latitude,
            'longitude' => $this->faker->longitude,
            'views_count' => $this->faker->numberBetween(0, 500),
        ];
    }
}
