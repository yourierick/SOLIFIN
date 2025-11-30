<?php

namespace App\Http\Controllers;

use App\Models\BroadcastMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BroadcastMessageController extends Controller
{
    /**
     * Récupérer les messages publiés non vus par l'utilisateur connecté.
     *
     * @return \Illuminate\Http\Response
     */
    public function getUnseenMessages()
    {
        $user = Auth::user();
        
        if ($user->is_admin) {
            return response()->json([
                'data' => []
            ]);
        }
        // Récupérer les messages actifs (status = true)
        $messages = BroadcastMessage::where('status', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'data' => $messages
        ]);
    }

    /**
     * Marquer un message comme vu par l'utilisateur connecté.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function markAsSeen($id)
    {
        $user = Auth::user();
        $message = BroadcastMessage::findOrFail($id);
        
        $message->markAsSeenByUser($user->id);
        
        return response()->json([
            'message' => 'Message marqué comme vu'
        ]);
    }

    /**
     * Vérifier si de nouveaux messages sont disponibles (pour le polling).
     *
     * @return \Illuminate\Http\Response
     */
    public function checkNewMessages()
    {
        $user = Auth::user();
        
        $count = BroadcastMessage::published()
            ->notSeenByUser($user->id)
            ->count();
        
        return response()->json([
            'has_new_messages' => $count > 0,
            'count' => $count
        ]);
    }
}
