<?php

namespace App\Events;

use App\Models\ConversationCallSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallSignal implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $call_session_id;
    public $sender_id;
    public $signal_type;
    public $signal_payload;

    public function __construct(ConversationCallSession $callSession, int $senderId, string $signalType, array $signalPayload)
    {
        $this->call_session_id = $callSession->id;
        $this->sender_id = $senderId;
        $this->signal_type = $signalType;
        $this->signal_payload = $signalPayload;
    }

    public function broadcastOn(): array
    {
        return [new Channel('call.' . $this->call_session_id)];
    }

    public function broadcastAs(): string
    {
        return 'call.signal';
    }
}
