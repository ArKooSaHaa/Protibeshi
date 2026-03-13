<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'price',
        'category',
        'location',
        'details',
        'photo',
        'is_active',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
