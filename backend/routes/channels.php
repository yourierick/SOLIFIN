<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\ChatRoom;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal de présence pour les salons de chat
Broadcast::channel('chat.room.{roomId}', function ($user, $roomId) {
    $room = ChatRoom::find($roomId);
    
    if (!$room) {
        return false;
    }
    
    // Vérifier si l'utilisateur est membre du salon
    $isMember = $room->hasMember($user->id);
    
    if ($isMember) {
        // Retourner les informations de l'utilisateur pour le canal de présence
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->picture ?? null,
        ];
    }
    
    return false;
});
