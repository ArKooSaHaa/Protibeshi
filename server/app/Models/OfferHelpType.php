<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfferHelpType extends Model
{
    use HasFactory;

    protected $fillable = [
        'offer_id',
        'help_type',
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }
}
