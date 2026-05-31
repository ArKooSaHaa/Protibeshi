<?php

namespace App\Events;

use App\Models\ConversationCallSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $call_session;
    public $recipient_id;

    public function __construct(ConversationCallSession $callSession, int $recipientId)
    {
        $this->call_session = $callSession->load('initiator');
        $this->recipient_id = $recipientId;
    }

    public function broadcastOn(): array
    {
        $channels = [];
        $conversationId = $this->call_session->conversation_id ?? null;
        if ($conversationId) {
            $channels[] = new Channel('chat.' . $conversationId);
        }

        if ($this->recipient_id) {
            $channels[] = new Channel('user.' . $this->recipient_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'call.started';
    }
}
