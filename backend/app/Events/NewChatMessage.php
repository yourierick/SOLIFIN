<?php

namespace App\Events;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewChatMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Le message de chat.
     *
     * @var ChatMessage
     */
    public $message;

    /**
     * L'utilisateur qui a envoyé le message.
     *
     * @var array
     */
    public $user;

    /**
     * Create a new event instance.
     */
    public function __construct(ChatMessage $message)
    {
        $this->message = $message;
        
        // Récupérer les informations de l'utilisateur nécessaires pour l'affichage
        $user = User::find($message->sender_id);
        
        // Créer l'URL complète de la photo de profil
        $pictureUrl = null;
        if ($user && $user->picture) {
            $pictureUrl = url('storage/' . $user->picture);
        }
        
        $this->user = [
            'id' => $user ? $user->id : null,
            'name' => $user ? $user->name : null,
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
            new PresenceChannel('chat.room.' . $this->message->chat_room_id),
        ];
    }

    /**
     * Le nom de l'événement à diffuser.
     */
    public function broadcastAs(): string
    {
        return 'new.message';
    }

    /**
     * Les données à diffuser.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'message' => $this->message->message,
            'type' => $this->message->type,
            'file_path' => $this->message->file_path,
            'created_at' => $this->message->created_at,
            'user' => $this->user,
        ];
    }
}
