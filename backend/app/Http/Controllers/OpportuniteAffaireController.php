<?php

namespace App\Http\Controllers;

use App\Models\OpportuniteAffaire;
use App\Models\OpportuniteAffaireLike;
use App\Models\OpportuniteAffaireComment;
use App\Models\OpportuniteAffaireShare;
use App\Models\Page;
use App\Models\PageAbonnes;
use App\Models\TransactionFee;
use App\Models\ExchangeRates;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\Setting;
use Carbon\Carbon;

class OpportuniteAffaireController extends Controller
{
    /**
     * Récupérer toutes les opportunités d'affaires
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = OpportuniteAffaire::with('page.user');
        
        // Filtres
        if ($request->has('secteur')) {
            $query->where('secteur', 'like', '%' . $request->secteur . '%');
        }
        
        if ($request->has('localisation')) {
            $query->where('localisation', 'like', '%' . $request->localisation . '%');
        }
        
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }
        
        if ($request->has('etat')) {
            $query->where('etat', $request->etat);
        }
        
        $opportunites = $query->orderBy('created_at', 'desc')->paginate(10);

        // Ajouter l'URL complète du fichier PDF pour chaque opportunité
        $opportunites->getCollection()->transform(function ($opportunite) {
            if ($opportunite->opportunity_file) {
                $opportunite->opportunity_file_url = asset('storage/' . $opportunite->opportunity_file);
            }
            return $opportunite;
        });
        
        return response()->json([
            'success' => true,
            'opportunites' => $opportunites
        ]);
    }

    /**
     * Récupérer les opportunités d'affaires en attente (pour admin)
     *
     * @return \Illuminate\Http\Response
     */
    public function getPendingOpportunities()
    {
        $opportunites = OpportuniteAffaire::with('page.user')
            ->where('statut', 'en_attente')
            ->orderBy('created_at', 'asc')
            ->paginate(10);
        
        return response()->json([
            'success' => true,
            'opportunites' => $opportunites
        ]);
    }

    /**
     * Créer une nouvelle opportunité d'affaire
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:opportunité,appel_projet,partenariat',
            'titre' => 'required|string|max:255',
            'reference' => 'required|string|max:255',
            'secteur' => 'required|string|max:255',
            'pays' => 'required|string|max:255',
            'ville' => 'required|string|max:255',
            'description' => 'required|string',
            'contacts' => 'required|string',
            'email' => 'nullable|email',
            'opportunity_file' => 'nullable|file|mimes:pdf|max:5000', // 5MB max
            'lien' => 'nullable|url',
            'conditions_participation' => 'nullable|string',
            'date_limite' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Vérifier si l'utilisateur a un pack de publication actif
        $packActif = false;
        if ($user->pack_de_publication_id) {
            $userPack = \App\Models\UserPack::where('user_id', $user->id)
                ->where('pack_id', $user->pack_de_publication_id)
                ->where('status', 'active')
                ->first();
            $packActif = (bool) $userPack;
        }
        
        if (!$packActif) {
            return response()->json([
                'success' => false,
                'message' => 'Votre pack de publication n\'est pas actif. Veuillez le réactiver pour publier.'
            ], 403);
        }
        
        // Récupérer ou créer la page de l'utilisateur
        $page = $user->page;
        if (!$page) {
            $page = Page::create([
                'user_id' => $user->id,
                'nombre_abonnes' => 0,
                'nombre_likes' => 0
            ]);
        }

        $data = $request->except(['image', 'opportunity_file']);
        $data['page_id'] = $page->id;
        $data['statut'] = 'en_attente';
        $data['etat'] = 'disponible';

        // Définir la durée d'affichage basée sur le pack de publication de l'utilisateur
        if ($user->pack_de_publication) {
            $data['duree_affichage'] = $user->pack_de_publication->duree_publication_en_jour;
        } else {
            // Valeur par défaut si le pack n'est pas disponible
            $data['duree_affichage'] = 1; // 1 jour par défaut
        }

        // Traitement du fichier PDF
        if ($request->hasFile('opportunity_file')) {
            $path = $request->file('opportunity_file')->store('opportunites/files', 'public');
            $data['opportunity_file'] = $path;
        }
        
        $opportunite = OpportuniteAffaire::create($data);
        $now = Carbon::now();
        $opportunite->expiry_date = $now->addDays($data['duree_affichage']);
        $opportunite->save();

        // Créer une notification pour l'administrateur
        $admins = \App\Models\User::where('is_admin', true)->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\PublicationSubmitted([
                'type' => [
                    'partenariat' => 'Opportunité de partenariat',
                    'appel_projet' => 'Appel à projet',
                ][$opportunite->type] ?? 'Opportunité d\'affaire',
                'id' => $opportunite->id,
                'titre' => "Opportunité d'affaire, Secteur: " . $opportunite->secteur,
                'message' => 'est en attente d\'approbation.',
                'user_id' => $user->id,
                'user_name' => $user->name
            ]));
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Opportunité d\'affaire créée avec succès. Elle est en attente de validation.',
            'opportunite' => $opportunite
        ], 201);
    }

    /**
     * Récupérer une opportunité d'affaire spécifique
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $opportunite = OpportuniteAffaire::with('page.user')->findOrFail($id);
    
        // Ajouter l'URL complète du fichier PDF si elle existe
        if ($opportunite->opportunity_file) {
            $opportunite->opportunity_file_url = asset('storage/' . $opportunite->opportunity_file);
        }

        $opportunite->post_type = $opportunite->type;
        
        return response()->json([
            'success' => true,
            'opportunite' => $opportunite
        ]);
    }

    /**
     * Mettre à jour une opportunité d'affaire
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        \Log::info($request->file('opportunity_file'));
        $opportunite = OpportuniteAffaire::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier si l'utilisateur est autorisé
        if (!$user->is_admin && $opportunite->page->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à modifier cette opportunité d\'affaire.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'entreprise' => 'nullable|string|max:255',
            'type' => 'nullable|in:opportunité,appel_projet,partenariat',
            'titre' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'secteur' => 'nullable|string|max:255',
            'pays' => 'nullable|string|max:255',
            'ville' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'contacts' => 'nullable|string',
            'email' => 'nullable|email',
            'opportunity_file' => 'nullable|file|mimes:pdf|max:5000', // 5MB max
            'lien' => 'nullable|url',
            'conditions_participation' => 'nullable|string',
            'date_limite' => 'nullable|date',
            'statut' => 'nullable|in:en_attente,approuvé,rejeté,expiré',
            'etat' => 'nullable|in:disponible,terminé',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except(['image', 'opportunity_file']);
        
        // Si l'utilisateur n'est pas admin, l'opportunité revient en attente
        if (!$user->is_admin) {
            $data['statut'] = 'en_attente';
        }

        // Traitement du fichier PDF
        if ($request->hasFile('opportunity_file')) {
            // Supprimer l'ancien fichier PDF si elle existe
            if ($opportunite->opportunity_file) {
                Storage::disk('public')->delete($opportunite->opportunity_file);
            }
            
            $path = $request->file('opportunity_file')->store('opportunites/files', 'public');
            $data['opportunity_file'] = $path;
        } else if ($request->has('remove_opportunity_file') && $request->input('remove_opportunity_file') == '1') {
            // Supprimer le fichier PDF sans le remplacer
            if ($opportunite->opportunity_file) {
                Storage::disk('public')->delete($opportunite->opportunity_file);
                $data['opportunity_file'] = null;
            }
        }
        
        $data['lien'] = $request->lien;
        $opportunite->update($data);
        
        return response()->json([
            'success' => true,
            'message' => 'Opportunité d\'affaire mise à jour avec succès.',
        ]);
    }

    /**
     * Changer l'état d'une opportunité d'affaire (disponible/terminé)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function changeEtat(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'etat' => 'required|in:disponible,terminé',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $opportunite = OpportuniteAffaire::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier si l'utilisateur est autorisé
        if (!$user->is_admin && $opportunite->page->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à modifier cette opportunité d\'affaire.'
            ], 403);
        }
        
        $opportunite->update([
            'etat' => $request->etat
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'État de l\'opportunité d\'affaire mis à jour avec succès.',
            'opportunite' => $opportunite
        ]);
    }

    /**
     * Changer le statut d'une opportunité d'affaire (admin)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function changeStatut(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'statut' => 'required|in:en_attente,approuvé,rejeté,expiré',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Vérifier si l'utilisateur est admin
        if (!$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les administrateurs peuvent changer le statut des opportunités d\'affaire.'
            ], 403);
        }
        
        $opportunite = OpportuniteAffaire::findOrFail($id);
        $opportunite->update([
            'statut' => $request->statut
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Statut de l\'opportunité d\'affaire mis à jour avec succès.',
            'opportunite' => $opportunite
        ]);
    }

    /**
     * Supprimer une opportunité d'affaire
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $opportunite = OpportuniteAffaire::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier si l'utilisateur est autorisé
        if (!$user->is_admin && $opportunite->page->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à supprimer cette opportunité d\'affaire.'
            ], 403);
        }
        
        // Supprimer l'image associée
        if ($opportunite->image) {
            // Supprimer l'image
            if (Storage::disk('public')->exists($opportunite->image)) {
                Storage::disk('public')->delete($opportunite->image);
            }
        }

        // Supprimer le fichier PDF associé
        if ($opportunite->opportunity_file) {
            // Supprimer le fichier PDF
            if (Storage::disk('public')->exists($opportunite->opportunity_file)) {
                Storage::disk('public')->delete($opportunite->opportunity_file);
            }
        }
        
        $opportunite->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Opportunité d\'affaire supprimée avec succès.'
        ]);
    }
    
    /**
     * Liker une opportunité d'affaire
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function like($id)
    {
        $user = Auth::user();
        $opportunite = OpportuniteAffaire::findOrFail($id);
        
        // Vérifier si l'utilisateur a déjà liké cette opportunité
        $existingLike = OpportuniteAffaireLike::where('user_id', $user->id)
            ->where('opportunite_affaire_id', $id)
            ->first();
            
        if ($existingLike) {
            // Si l'utilisateur a déjà liké, on supprime le like (unlike)
            $existingLike->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Like retiré avec succès.',
                'liked' => false,
                'likes_count' => $opportunite->likes()->count()
            ]);
        }
        
        // Créer un nouveau like
        OpportuniteAffaireLike::create([
            'user_id' => $user->id,
            'opportunite_affaire_id' => $id
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Opportunité d\'affaire likée avec succès.',
            'liked' => true,
            'likes_count' => $opportunite->likes()->count()
        ]);
    }
    
    /**
     * Vérifier si l'utilisateur a liké une opportunité d'affaire
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function checkLike($id)
    {
        $user = Auth::user();
        $opportunite = OpportuniteAffaire::findOrFail($id);
        
        $liked = OpportuniteAffaireLike::where('user_id', $user->id)
            ->where('opportunite_affaire_id', $id)
            ->exists();
            
        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $opportunite->likes()->count()
        ]);
    }
    
    /**
     * Commenter une opportunité d'affaire
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function comment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:opportunite_affaire_comments,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $user = Auth::user();
        $opportunite = OpportuniteAffaire::findOrFail($id);
        
        $comment = OpportuniteAffaireComment::create([
            'user_id' => $user->id,
            'opportunite_affaire_id' => $id,
            'content' => $request->content,
            'parent_id' => $request->parent_id
        ]);
        
        // Charger les relations pour la réponse
        $comment->load('user');
        
        return response()->json([
            'success' => true,
            'message' => 'Commentaire ajouté avec succès.',
            'comment' => $comment,
            'comments_count' => $opportunite->comments()->count()
        ]);
    }
    
    /**
     * Récupérer les commentaires d'une opportunité d'affaire
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getComments($id)
    {
        $opportunite = OpportuniteAffaire::findOrFail($id);
        
        // Récupérer uniquement les commentaires parents (pas les réponses)
        $comments = OpportuniteAffaireComment::with(['user', 'replies.user'])
            ->where('opportunite_affaire_id', $id)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'comments' => $comments,
            'comments_count' => $opportunite->comments()->count()
        ]);
    }
    
    /**
     * Supprimer un commentaire
     *
     * @param  int  $commentId
     * @return \Illuminate\Http\Response
     */
    public function deleteComment($commentId)
    {
        $user = Auth::user();
        $comment = OpportuniteAffaireComment::findOrFail($commentId);
        
        // Vérifier si l'utilisateur est autorisé à supprimer ce commentaire
        if (!$user->is_admin && $comment->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à supprimer ce commentaire.'
            ], 403);
        }
        
        $opportuniteId = $comment->opportunite_affaire_id;
        $opportunite = OpportuniteAffaire::findOrFail($opportuniteId);
        
        // Supprimer également toutes les réponses à ce commentaire
        $comment->replies()->delete();
        $comment->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Commentaire supprimé avec succès.',
            'comments_count' => $opportunite->comments()->count()
        ]);
    }
    
    /**
     * Partager une opportunité d'affaire
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function share(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'comment' => 'nullable|string|max:500'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $user = Auth::user();
        $opportunite = OpportuniteAffaire::findOrFail($id);
        
        $share = OpportuniteAffaireShare::create([
            'user_id' => $user->id,
            'opportunite_affaire_id' => $id,
            'comment' => $request->comment
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Opportunité d\'affaire partagée avec succès.',
            'share' => $share,
            'shares_count' => $opportunite->shares()->count()
        ]);
    }
    
    /**
     * Récupérer les partages d'une opportunité d'affaire
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getShares($id)
    {
        $opportunite = OpportuniteAffaire::findOrFail($id);
        
        $shares = OpportuniteAffaireShare::with('user')
            ->where('opportunite_affaire_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'shares' => $shares,
            'shares_count' => $shares->count()
        ]);
    }

    public function details($id)
    {
        $userId = Auth::id();
        $post = OpportuniteAffaire::with(['page', 'page.user'])
            ->findOrFail($id);

        $post->user->picture = asset('storage/' . $post->user->picture);

        // Vérifier si l'utilisateur est abonné à cette page
        $post->is_subscribed = PageAbonnes::where('user_id', $userId)
        ->where('page_id', $post->page_id)
        ->exists();

        // Compter les likes pour cette publication
        $post->likes_count = OpportuniteAffaireLike::where('opportunite_affaire_id', $post->id)->count();

        // Type de publication
        $post->post_type = $post->type;
        $post->type = "opportunites-affaires";
        $post->external_link = $post->lien;

                    
        // Vérifier si l'utilisateur a aimé cette publication
        $post->is_liked = OpportuniteAffaireLike::where('opportunite_affaire_id', $post->id)
            ->where('user_id', $userId)
            ->exists();

        // Ajouter l'URL complète de l'image si elle existe
        if ($post->image) {
            $post->image_url = asset('storage/' . $post->image);
        }

        // Ajouter l'URL complète du fichier opportunité d'affaire si elle existe
        if ($post->opportunity_file) {
            $post->opportunity_file_url = asset('storage/' . $post->opportunity_file);
        }
        
        // Compter les commentaires pour cette publication
        $post->comments_count = OpportuniteAffaireComment::where('opportunite_affaire_id', $post->id)->count();
        
        // Récupérer les 3 derniers commentaires
        $post->comments = OpportuniteAffaireComment::where('opportunite_affaire_id', $post->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get()
            ->map(function($comment) use ($userId) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at,
                    'created_at_formatted' => $comment->created_at->diffForHumans(),
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                        'profile_picture' => $comment->user->picture ? asset('storage/' . $comment->user->picture) : null
                    ],
                    'likes_count' => 0, // À implémenter si les commentaires ont des likes
                    'is_liked' => false // À implémenter si les commentaires ont des likes
                ];
            });
        
        // Compter les partages pour cette publication
        $post->shares_count = OpportuniteAffaireShare::where('opportunite_affaire_id', $post->id)->count();
        
        return response()->json([
            'success' => true,
            'post' => $post
        ]);
    }

    /**
     * Booster une opportunité d'affaire (augmenter sa durée d'affichage)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function boost(Request $request, $id)
    {
        try {
            $validator = $request->validate([
                'days' => 'required|integer|min:1',
                'paymentMethod' => 'required|string|in:solifin-wallet',
                'paymentType' => 'required|string|in:wallet',
                'amount' => 'required|numeric|min:0',
                'currency' => 'required|string|in:USD,CDF',
            ]);

            // Récupérer l'opportunité d'affaire
            $opportuniteAffaire = OpportuniteAffaire::findOrFail($id);
            
            // Utiliser le service de boost
            $boostService = app(\App\Services\BoostService::class);
            $result = $boostService->boostPublication(
                $opportuniteAffaire, 
                $request->days, 
                $request->amount, 
                $request->currency, 
                'opportunite_affaire'
            );
            
            // Renommer la clé 'publication' en 'opportunite_affaire' pour maintenir la compatibilité avec le frontend
            if (isset($result['publication'])) {
                $result['opportunite_affaire'] = $result['publication'];
                unset($result['publication']);
            }
            
            return response()->json($result, $result['status_code']);
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Erreur lors du boost de l\'opportunité d\'affaire: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du boost de l\'opportunité d\'affaire: ' . $e->getMessage()
            ], 500);
        }
    }
}
