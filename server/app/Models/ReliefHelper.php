<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReliefHelper extends Model
{
    use HasFactory;

    protected $fillable = [
        'relief_id',
        'user_id',
    ];

    public function relief(): BelongsTo
    {
        return $this->belongsTo(Relief::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
