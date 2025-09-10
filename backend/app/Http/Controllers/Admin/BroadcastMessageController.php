<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BroadcastMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class BroadcastMessageController extends Controller
{
    /**
     * Afficher la liste des messages de diffusion avec pagination.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        $page = $request->query('page', 1);
        
        $messages = BroadcastMessage::orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => $messages->items(),
            'total' => $messages->total(),
            'per_page' => $messages->perPage(),
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
        ]);
    }

    /**
     * Enregistrer un nouveau message de diffusion.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Règles de validation de base
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:text,image,video',
            'status' => 'boolean',
        ];
        
        // Règles conditionnelles pour les médias
        if ($request->type === 'text') {
            // Pas de média requis pour le type texte
            $rules['media_url'] = 'nullable|url';
            $rules['media_file'] = 'nullable';
        } else {
            // Pour les types image et vidéo, soit une URL soit un fichier est requis
            $rules['media_url'] = 'nullable|url';
            
            if ($request->type === 'image') {
                // 1Mo pour les images
                $rules['media_file'] = 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:1024';
            } else { // type vidéo
                // 5Mo pour les vidéos
                $rules['media_file'] = 'nullable|file|mimes:mp4,webm,ogg|max:5120';
            }
            
            // Au moins un des deux (URL ou fichier) doit être fourni
            $rules['media_content'] = 'required_without_all:media_url,media_file';
        }
        
        $validator = Validator::make($request->all(), $rules, [
            'media_content.required_without_all' => 'Veuillez fournir soit une URL, soit un fichier pour ce type de message.',
            'media_file.max' => $request->type === 'image' 
                ? 'L\'image ne doit pas dépasser 1Mo.' 
                : 'La vidéo ne doit pas dépasser 5Mo.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Préparation des données pour la création
        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'status' => $request->status ?? false,
            'published_at' => $request->status ? now() : null,
        ];
        
        // Traitement du fichier si présent
        if ($request->hasFile('media_file') && $request->file('media_file')->isValid()) {
            $file = $request->file('media_file');
            $path = $file->store('broadcast-messages', 'public');
            $data['media_url'] = asset('storage/' . $path);
        } else if ($request->media_url) {
            $data['media_url'] = $request->media_url;
        }

        $message = BroadcastMessage::create($data);

        return response()->json([
            'message' => 'Message créé avec succès',
            'data' => $message
        ], 201);
    }

    /**
     * Afficher un message de diffusion spécifique.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $message = BroadcastMessage::findOrFail($id);
        
        return response()->json([
            'data' => $message
        ]);
    }

    /**
     * Mettre à jour un message de diffusion.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $message = BroadcastMessage::findOrFail($id);

        // Règles de validation de base
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:text,image,video',
        ];
        
        // Règles conditionnelles pour les médias
        if ($request->type === 'text') {
            // Pas de média requis pour le type texte
            $rules['media_url'] = 'nullable|url';
            $rules['media_file'] = 'nullable';
        } else {
            // Pour les types image et vidéo, soit une URL soit un fichier est requis, ou conserver l'existant
            $rules['media_url'] = 'nullable|url';
            
            if ($request->type === 'image') {
                // 1Mo pour les images
                $rules['media_file'] = 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:1024';
            } else { // type vidéo
                // 5Mo pour les vidéos
                $rules['media_file'] = 'nullable|file|mimes:mp4,webm,ogg|max:5120';
            }
        }
        
        $validator = Validator::make($request->all(), $rules, [
            'media_file.max' => $request->type === 'image' 
                ? 'L\'image ne doit pas dépasser 1Mo.' 
                : 'La vidéo ne doit pas dépasser 5Mo.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Préparation des données pour la mise à jour
        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
        ];
        
        // Traitement du fichier si présent
        if ($request->hasFile('media_file') && $request->file('media_file')->isValid()) {
            $file = $request->file('media_file');
            $path = $file->store('broadcast-messages', 'public');
            $data['media_url'] = asset('storage/' . $path);
            
            // Supprimer l'ancien fichier si c'est un fichier local
            $oldUrl = $message->media_url;
            if ($oldUrl && strpos($oldUrl, 'storage/broadcast-messages') !== false) {
                $oldPath = str_replace(asset('storage/'), '', $oldUrl);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
        } else if ($request->media_url) {
            $data['media_url'] = $request->media_url;
        }

        $message->update($data);

        return response()->json([
            'message' => 'Message mis à jour avec succès',
            'data' => $message
        ]);
    }

    /**
     * Mettre à jour le statut d'un message de diffusion.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $message = BroadcastMessage::findOrFail($id);
        $message->status = $request->status;
        
        // Si le statut est true, mettre à jour la date de publication
        if ($request->status) {
            $message->published_at = now();
        } else {
            $message->published_at = null;
        }

        $message->save();

        return response()->json([
            'message' => 'Message mis à jour avec succès',
            'data' => $message
        ]);
    }

    /**
     * Supprimer un message de diffusion.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $message = BroadcastMessage::findOrFail($id);
        $message->delete();

        return response()->json([
            'message' => 'Message supprimé avec succès'
        ]);
    }


    /**
     * Relancer un message pour qu'il soit à nouveau visible.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function republish($id)
    {
        $message = BroadcastMessage::findOrFail($id);
        $message->republish();

        return response()->json([
            'message' => 'Message relancé avec succès',
            'data' => $message
        ]);
    }

    /**
     * Obtenir des statistiques sur les messages.
     *
     * @return \Illuminate\Http\Response
     */
    public function stats()
    {
        $stats = [
            'total' => BroadcastMessage::count(),
            'active' => BroadcastMessage::where('status', true)->count(),
            'inactive' => BroadcastMessage::where('status', false)->count(),
            'views' => \DB::table('broadcast_message_user')->count(),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }
}
