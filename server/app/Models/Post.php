<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PostVote;
use Illuminate\Support\Carbon;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'short_description',
        'content',
        'label',
        'image',
        'post_type',
        'visibility',
        'location',
        'distance',
        'is_active',
        'is_pinned',
        'moderation_status',
        'moderation_source',
        'moderated_by_admin_id',
        'moderated_at',
        'moderation_note',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_pinned' => 'boolean',
        'moderated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(PostLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(PostComment::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(PostReport::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PostVote::class);
    }

    public function moderatedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'moderated_by_admin_id');
    }

    public function isEventPost(): bool
    {
        $label = strtolower(trim((string) ($this->label ?? '')));
        $postType = strtolower(trim((string) ($this->post_type ?? '')));

        return $label === 'event' || $postType === 'event';
    }

    public function eventVotingExpiresAt(): ?Carbon
    {
        if (!$this->isEventPost() || !$this->created_at) {
            return null;
        }

        return $this->created_at->copy()->addDays(2);
    }

    public function isEventVotingOpen(): bool
    {
        $expiresAt = $this->eventVotingExpiresAt();

        if (!$expiresAt) {
            return false;
        }

        return now()->lessThanOrEqualTo($expiresAt);
    }
}
