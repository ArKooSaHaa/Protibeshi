<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfferAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'offer_id',
        'availability',
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }
}
