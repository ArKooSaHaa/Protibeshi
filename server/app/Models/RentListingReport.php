<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentListingReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'rent_listing_id',
        'user_id',
        'reason',
    ];

    public function rentListing(): BelongsTo
    {
        return $this->belongsTo(RentListing::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
