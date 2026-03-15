<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'complaint_code',
        'title',
        'category',
        'description',
        'location',
        'priority',
        'visibility',
        'status',
        'photo',
        'distance',
    ];

    protected $casts = [
        'distance' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
