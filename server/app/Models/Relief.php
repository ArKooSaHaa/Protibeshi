<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Relief extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'type',
        'description',
        'urgency',
        'time_sensitivity',
        'visibility',
        'contact_preference',
        'location',
        'status',
        'helpers_count',
        'cover_photo',
    ];

    protected $casts = [
        'helpers_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function helpers()
    {
        return $this->hasMany(ReliefHelper::class);
    }

    public function comments()
    {
        return $this->hasMany(ReliefComment::class)
            ->orderBy('created_at', 'asc');
    }

    public function reports()
    {
        return $this->hasMany(ReliefReport::class);
    }
}
