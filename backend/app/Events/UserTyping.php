<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * L'ID du salon de chat.
     *
     * @var int
     */
    public $roomId;

    /**
     * Les informations de l'utilisateur.
     *
     * @var array
     */
    public $user;

    /**
     * Create a new event instance.
     */
    public function __construct(int $roomId, User $user)
    {
        $this->roomId = $roomId;
        
        // Créer l'URL complète de la photo de profil
        $pictureUrl = null;
        if ($user->picture) {
            $pictureUrl = url('storage/' . $user->picture);
        }
        
        $this->user = [
            'id' => $user->id,
            'name' => $user->name,
            'picture' => $pictureUrl
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('chat.room.' . $this->roomId),
        ];
    }

    /**
     * Le nom de l'événement à diffuser.
     */
    public function broadcastAs(): string
    {
        return 'user.typing';
    }
}
