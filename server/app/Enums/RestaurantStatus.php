<?php

namespace App\Enums;

enum RestaurantStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public static function values(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
