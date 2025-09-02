<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class UserStatusController extends Controller
{
    /**
     * Mettre à jour le statut de l'utilisateur (last_seen)
     */
    public function updateStatus(Request $request)
    {
        $user = Auth::user();
        $user->last_seen = now();
        $user->save();

        // Mettre à jour le cache
        $cacheKey = 'user_status_' . $user->id;
        Cache::put($cacheKey, [
            'user_id' => $user->id,
            'last_seen' => $user->last_seen,
            'is_online' => true
        ], 60); // Cache pour 60 secondes

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour'
        ]);
    }

    /**
     * Récupérer les statuts des utilisateurs
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatuses(Request $request)
    {
        // Récupérer les IDs des utilisateurs demandés
        $userIds = $request->input('user_ids', []);
        
        if (empty($userIds)) {
            // Si aucun ID n'est fourni, récupérer les utilisateurs avec qui l'utilisateur actuel a des conversations
            $currentUser = Auth::user();
            $chatRooms = \DB::table('chat_rooms')
                ->where('user1_id', $currentUser->id)
                ->orWhere('user2_id', $currentUser->id)
                ->get();
            
            foreach ($chatRooms as $room) {
                if ($room->user1_id != $currentUser->id) {
                    $userIds[] = $room->user1_id;
                }
                if ($room->user2_id != $currentUser->id) {
                    $userIds[] = $room->user2_id;
                }
            }
            
            // Éliminer les doublons
            $userIds = array_unique($userIds);
        }
        
        $statuses = [];
        $now = Carbon::now();
        
        foreach ($userIds as $userId) {
            // Vérifier d'abord dans le cache
            $cacheKey = 'user_status_' . $userId;
            $cachedStatus = Cache::get($cacheKey);
            
            if ($cachedStatus) {
                $statuses[$userId] = $cachedStatus;
            } else {
                // Si pas dans le cache, récupérer depuis la base de données
                $user = User::find($userId);
                if ($user && $user->last_seen) {
                    $lastSeen = new Carbon($user->last_seen);
                    $isOnline = $lastSeen->diffInSeconds($now) < 30;
                    
                    $status = [
                        'user_id' => $user->id,
                        'last_seen' => $user->last_seen,
                        'is_online' => $isOnline
                    ];
                    
                    // Mettre en cache pour les prochaines requêtes
                    Cache::put($cacheKey, $status, 60);
                    
                    $statuses[$userId] = $status;
                } else {
                    // Utilisateur non trouvé ou jamais connecté
                    $statuses[$userId] = [
                        'user_id' => $userId,
                        'last_seen' => null,
                        'is_online' => false
                    ];
                }
            }
        }
        
        return response()->json([
            'success' => true,
            'statuses' => $statuses
        ]);
    }
}
