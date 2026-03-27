<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'short_summary',
        'description',
        'service_radius',
        'contact_preference',
        'is_recurring',
    ];

    public function helpTypes()
    {
        return $this->hasMany(OfferHelpType::class);
    }

    public function availabilities()
    {
        return $this->hasMany(OfferAvailability::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
