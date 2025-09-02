<?php

namespace App\Http\Controllers;

// Suppression des imports d'événements qui ne sont plus utilisés
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    /**
     * Formater l'URL d'une photo de profil
     * 
     * @param string|null $picturePath Le chemin de la photo
     * @return string|null L'URL complète de la photo
     */
    private function formatFileUrl($filePath)
    {
        if (!$filePath) {
            return null;
        }
        
        // Vérifier si l'URL est déjà complète
        if (filter_var($filePath, FILTER_VALIDATE_URL)) {
            return $filePath;
        }
        
        // Sinon, construire l'URL complète
        return url('storage/' . $filePath);
    }
    /**
     * Récupérer toutes les conversations de l'utilisateur.
     */
    public function getRooms(Request $request)
    {
        $user = $request->user();
        
        // Récupérer toutes les conversations où l'utilisateur est impliqué
        $rooms = ChatRoom::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne' => function ($query) {
                $query->select('id', 'name', 'picture');
            }, 'userTwo' => function ($query) {
                $query->select('id', 'name', 'picture');
            }])
            ->get();

        // Ajouter le nombre de messages non lus, l'autre utilisateur et le dernier message pour chaque conversation
        $formattedRooms = $rooms->map(function ($room) use ($user) {
            $otherUser = $room->getOtherUser($user->id);
            $unreadCount = $room->getUnreadCount($user->id);
            
            // Récupérer le dernier message de la conversation
            $lastMessage = ChatMessage::where('chat_room_id', $room->id)
                ->orderBy('created_at', 'desc')
                ->first();
                
            $lastMessageText = null;
            $lastMessageAt = null;
            
            if ($lastMessage) {
                $lastMessageText = $lastMessage->message;
                $lastMessageAt = $lastMessage->created_at;
            }
            
            // Préparer les données de l'autre utilisateur avec l'URL complète de l'image
            $formattedOtherUser = null;
            if ($otherUser) {
                $pictureUrl = $this->formatFileUrl($otherUser->picture);
                
                $formattedOtherUser = [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'picture' => $pictureUrl
                ];
            }
            
            return [
                'id' => $room->id,
                'name' => $room->name ?? ($otherUser ? $otherUser->name : ''),
                'other_user' => $formattedOtherUser,
                'unread_count' => $unreadCount,
                'last_message' => $lastMessageText,
                'last_message_at' => $lastMessageAt,
                'created_at' => $room->created_at,
                'updated_at' => $room->updated_at
            ];
        });

        return response()->json([
            'rooms' => $formattedRooms
        ]);
    }

    /**
     * Créer une nouvelle conversation privée.
     */
    public function createRoom(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'user_id' => 'required|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $currentUser = $request->user();
        $otherUserId = $request->user_id;
        
        // Vérifier que l'utilisateur ne crée pas une conversation avec lui-même
        if ($currentUser->id == $otherUserId) {
            return response()->json(['message' => 'Vous ne pouvez pas créer une conversation avec vous-même'], 422);
        }
        
        // Vérifier si une conversation existe déjà entre ces deux utilisateurs
        $existingRoom = ChatRoom::where(function ($query) use ($currentUser, $otherUserId) {
            $query->where('user_one_id', $currentUser->id)
                  ->where('user_two_id', $otherUserId);
        })->orWhere(function ($query) use ($currentUser, $otherUserId) {
            $query->where('user_one_id', $otherUserId)
                  ->where('user_two_id', $currentUser->id);
        })->first();
        
        if ($existingRoom) {
            // Récupérer l'autre utilisateur et formater son URL de photo de profil
            $otherUser = $existingRoom->getOtherUser($currentUser->id);
            $formattedOtherUser = null;
            
            if ($otherUser) {
                $pictureUrl = $this->formatFileUrl($otherUser->picture);
                
                $formattedOtherUser = [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'picture' => $pictureUrl
                ];
            }
            
            return response()->json([
                'message' => 'Une conversation existe déjà',
                'room' => [
                    'id' => $existingRoom->id,
                    'name' => $existingRoom->name ?? ($otherUser ? $otherUser->name : ''),
                    'other_user' => $formattedOtherUser,
                    'participants' => [$currentUser, $otherUser],
                    'unread_count' => $existingRoom->getUnreadCount($currentUser->id),
                    'created_at' => $existingRoom->created_at,
                    'updated_at' => $existingRoom->updated_at
                ]
            ]);
        }
        
        // Créer une nouvelle conversation
        $room = ChatRoom::create([
            'name' => $request->name,
            'user_one_id' => $currentUser->id,
            'user_two_id' => $otherUserId
        ]);
        
        $otherUser = User::find($otherUserId);
        $formattedOtherUser = null;
        
        if ($otherUser) {
            $pictureUrl = $this->formatFileUrl($otherUser->picture);
            
            $formattedOtherUser = [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'picture' => $pictureUrl
            ];
        }

        return response()->json([
            'message' => 'Conversation créée avec succès',
            'room' => [
                'id' => $room->id,
                'name' => $room->name ?? ($otherUser ? $otherUser->name : ''),
                'other_user' => $formattedOtherUser,
                'participants' => [$currentUser, $otherUser],
                'unread_count' => 0,
                'created_at' => $room->created_at,
                'updated_at' => $room->updated_at
            ]
        ], 201);
    }

    /**
     * Récupérer les messages d'une conversation.
     * 
     * @param Request $request
     * @param int $roomId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMessages(Request $request, $roomId)
    {
        $user = $request->user();
        $afterTimestamp = $request->query('after', 0); // Récupérer le timestamp du dernier message connu
        $unreadOnly = $request->query('unread_only', false); // Paramètre pour récupérer uniquement le nombre de messages non lus
        $cacheKey = "chat_room_{$roomId}_user_{$user->id}_after_{$afterTimestamp}";
        $cacheDuration = 60; // Cache d'une minute
        
        // Vérifier si l'utilisateur est membre de la conversation
        $room = ChatRoom::findOrFail($roomId);
        if (!$room->hasMember($user->id)) {
            return response()->json(['message' => 'Vous n\'\u00eates pas autorisé à accéder à cette conversation'], 403);
        }
        
        // Si on demande uniquement le nombre de messages non lus
        if ($unreadOnly) {
            $unreadCount = ChatMessage::where('chat_room_id', $roomId)
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->count();
                
            return response()->json([
                'unread_count' => $unreadCount
            ]);
        }

        // Marquer tous les messages non lus comme lus
        ChatMessage::where('chat_room_id', $roomId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        // Essayer de récupérer les données depuis le cache
        if ($afterTimestamp > 0 && \Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return response()->json(\Illuminate\Support\Facades\Cache::get($cacheKey));
        }

        // Construire la requête de base
        $query = ChatMessage::where('chat_room_id', $roomId);
        
        // Si after est spécifié, ne récupérer que les nouveaux messages
        if ($afterTimestamp > 0) {
            $query->where('created_at', '>', date('Y-m-d H:i:s', $afterTimestamp / 1000));
        }

        // Récupérer les messages
        $messages = $query->with('sender')
            ->orderBy('created_at', 'desc')
            ->paginate(50);
            
        // Transformer les messages pour inclure l'URL complète des images
        $messages->getCollection()->transform(function ($message) {
            if ($message->sender) {
                // Ajouter l'URL complète de la photo de profil
                $message->sender->picture_url = $this->formatFileUrl($message->sender->picture);
            }
            if ($message->file_path) {
                $message->file_path = $this->formatFileUrl($message->file_path);
            }
            return $message;
        });

        // Récupérer l'autre utilisateur et formater son URL de photo de profil
        $otherUser = $room->getOtherUser($user->id);
        $formattedOtherUser = null;
        if ($otherUser) {
            $pictureUrl = $this->formatFileUrl($otherUser->picture);
            
            $formattedOtherUser = [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'picture' => $pictureUrl
            ];
        }

        $response = [
            'messages' => $messages,
            'other_user' => $formattedOtherUser,
            'has_new_messages' => $messages->count() > 0
        ];

        // Mettre en cache la réponse si after est spécifié
        if ($afterTimestamp > 0) {
            \Illuminate\Support\Facades\Cache::put($cacheKey, $response, $cacheDuration);
        }

        return response()->json($response);
    }

    /**
     * Envoyer un nouveau message.
     */
    public function sendMessage(Request $request, $roomId)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required_without:file|string',
            'file' => 'nullable|file|max:1024', // 1MB max
            'type' => 'required|in:text,image,file',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        // Vérifier si l'utilisateur est membre de la conversation
        $room = ChatRoom::findOrFail($roomId);
        if (!$room->hasMember($user->id)) {
            return response()->json(['message' => 'Vous n\'\u00eates pas autorisé à envoyer des messages dans cette conversation'], 403);
        }

        $filePath = null;
        
        // Traiter le fichier s'il existe
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('chat_files', $fileName, 'public');
        }

        // Créer le message
        $message = ChatMessage::create([
            'chat_room_id' => $roomId,
            'sender_id' => $user->id,
            'message' => $request->message ?? '',
            'type' => $request->type,
            'file_path' => $filePath,
        ]);

        // Charger l'expéditeur et formater l'URL de la photo de profil
        $message->load('sender');
        
        // Transformer le message pour inclure l'URL complète de la photo de profil
        if ($message->sender) {
            // Ajouter l'URL complète de la photo de profil
            $message->sender->picture_url = $this->formatFileUrl($message->sender->picture);
            
            // Créer un format cohérent pour l'expéditeur
            $formattedSender = [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'picture' => $this->formatFileUrl($message->sender->picture)
            ];
            
            // Remplacer l'objet sender par le tableau formaté
            $message->sender = $formattedSender;
            $message->file_path = $this->formatFileUrl($message->file_path);
        }
        
        // Invalider le cache pour cette conversation
        \Illuminate\Support\Facades\Cache::forget("chat_room_{$roomId}_user_*");

        return response()->json([
            'message' => 'Message envoyé avec succès',
            'chat_message' => $message
        ], 201);
    }

    /**
     * Notifier que l'utilisateur est en train de taper.
     * Stocke l'information dans le cache pour être récupérée par polling.
     */
    public function typing(Request $request, $roomId)
    {
        $user = $request->user();
        
        // Vérifier si l'utilisateur est membre de la conversation
        $room = ChatRoom::findOrFail($roomId);
        if (!$room->hasMember($user->id)) {
            return response()->json(['message' => 'Vous n\'\u00eates pas autorisé à accéder à cette conversation'], 403);
        }

        // Stocker l'information de frappe dans le cache (expire après 5 secondes)
        $typingKey = "typing_room_{$roomId}_user_{$user->id}";
        $typingData = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'picture' => $this->formatFileUrl($user->picture)
            ],
            'timestamp' => now()->timestamp
        ];
        
        \Illuminate\Support\Facades\Cache::put($typingKey, $typingData, 5);

        return response()->json(['message' => 'Notification envoyée']);
    }
    
    /**
     * Récupérer les utilisateurs en train de taper dans une conversation.
     */
    public function getTypingUsers(Request $request, $roomId)
    {
        $user = $request->user();
        
        // Vérifier si l'utilisateur est membre de la conversation
        $room = ChatRoom::findOrFail($roomId);
        if (!$room->hasMember($user->id)) {
            return response()->json(['message' => 'Vous n\'\u00eates pas autorisé à accéder à cette conversation'], 403);
        }
        
        // Récupérer tous les utilisateurs en train de taper dans cette conversation
        $typingUsers = [];
        
        // Récupérer tous les membres de la conversation
        $members = [$room->user_one_id, $room->user_two_id];
        
        // Vérifier pour chaque membre s'il est en train de taper
        foreach ($members as $memberId) {
            if ($memberId != $user->id) { // Ne pas inclure l'utilisateur actuel
                $typingKey = "typing_room_{$roomId}_user_{$memberId}";
                $typingData = \Illuminate\Support\Facades\Cache::get($typingKey);
                
                if ($typingData) {
                    $typingUsers[$memberId] = $typingData;
                }
            }
        }
        
        return response()->json([
            'typing_users' => $typingUsers
        ]);
    }

    /**
     * Ajouter un utilisateur à un salon de chat.
     */
    public function addParticipant(Request $request, $roomId)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        // Vérifier si l'utilisateur est admin du salon
        $room = ChatRoom::findOrFail($roomId);
        $isAdmin = $room->participants()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->exists();
            
        if (!$isAdmin) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à ajouter des participants à ce salon'], 403);
        }

        // Ajouter le participant
        $room->addMember($request->user_id);

        return response()->json([
            'message' => 'Participant ajouté avec succès',
        ]);
    }

    /**
     * Supprimer une conversation.
     */
    public function deleteRoom(Request $request, $roomId)
    {
        $user = $request->user();
        
        // Vérifier si l'utilisateur est membre de la conversation
        $room = ChatRoom::findOrFail($roomId);
        if (!$room->hasMember($user->id)) {
            return response()->json(['message' => 'Vous n\'\u00eates pas autorisé à supprimer cette conversation'], 403);
        }

        // Supprimer la conversation et ses messages (cascade)
        $room->delete();

        return response()->json([
            'message' => 'Conversation supprimée avec succès',
        ]);
    }
}
