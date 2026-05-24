<?php

namespace App\Policies;

use App\Models\Restaurant;
use App\Models\User;

class RestaurantPolicy
{
    public function update(User $user, Restaurant $restaurant): bool
    {
        return (int) $restaurant->user_id === (int) $user->id;
    }

    public function delete(User $user, Restaurant $restaurant): bool
    {
        return (int) $restaurant->user_id === (int) $user->id;
    }
}
