<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use App\Models\ChatRoom;
use Illuminate\Support\Facades\Cache;

class SupportController extends Controller
{
    /**
     * Récupère le premier utilisateur avec le rôle support-center
     * et crée ou récupère une conversation avec cet utilisateur.
     */
    public function getSupportContact(Request $request)
    {
        $user = $request->user();
        
        // Récupérer le rôle support-center (avec cache pour optimiser les performances)
        $supportRole = Cache::remember('support-center-role', 3600, function () {
            return Role::where('slug', 'support-center')->first();
        });
        
        if (!$supportRole) {
            return response()->json([
                'success' => false,
                'message' => 'Le service de support n\'est pas disponible actuellement.'
            ], 404);
        }
        
        // Récupérer le premier utilisateur avec ce rôle
        $supportUser = User::where('role_id', $supportRole->id)->first();
        
        if (!$supportUser) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun agent de support n\'est disponible actuellement.'
            ], 404);
        }
        
        // Vérifier si une conversation existe déjà entre ces deux utilisateurs
        $existingRoom = ChatRoom::where(function ($query) use ($user, $supportUser) {
            $query->where('user_one_id', $user->id)
                  ->where('user_two_id', $supportUser->id);
        })->orWhere(function ($query) use ($user, $supportUser) {
            $query->where('user_one_id', $supportUser->id)
                  ->where('user_two_id', $user->id);
        })->first();
        
        if ($existingRoom) {
            return response()->json([
                'success' => true,
                'room_id' => $existingRoom->id,
                'is_new' => false
            ]);
        }
        
        // Créer une nouvelle conversation
        $room = new ChatRoom();
        $room->user_one_id = $user->id;
        $room->user_two_id = $supportUser->id;
        $room->name = 'Support SOLIFIN';
        $room->save();
        
        return response()->json([
            'success' => true,
            'room_id' => $room->id,
            'is_new' => true
        ]);
    }
}
