<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RentListing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'location',
        'price',
        'deposit',
        'distance',
        'size_sqft',
        'beds',
        'baths',
        'type',
        'furnishing',
        'availability',
        'badge',
        'verified_landlord',
        'photo',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'deposit' => 'decimal:2',
        'distance' => 'integer',
        'size_sqft' => 'integer',
        'beds' => 'integer',
        'baths' => 'integer',
        'verified_landlord' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(RentListingReport::class);
    }
}
