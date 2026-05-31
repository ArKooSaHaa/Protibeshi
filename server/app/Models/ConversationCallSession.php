<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationCallSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'initiator_id',
        'call_type',
        'status',
        'room_name',
        'jitsi_join_url',
        'started_at',
        'accepted_at',
        'ended_at',
        'duration_seconds',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'accepted_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration_seconds' => 'integer',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiator_id');
    }
}
