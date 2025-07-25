<?php

namespace App\Http\Controllers;

use App\Models\OffreEmploi;
use App\Models\OffreEmploiLike;
use App\Models\OffreEmploiComment;
use App\Models\OffreEmploiShare;
use App\Models\PageAbonnes;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\ExchangeRates;
use App\Models\WalletSystem;
use App\Models\TransactionFee;
use Illuminate\Support\Facades\DB;
use App\Models\Wallet;
use App\Models\Setting;

class OffreEmploiController extends Controller
{
    /**
     * Récupérer toutes les offres d'emploi
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = OffreEmploi::with('page.user');
        
        // Filtres
        if ($request->has('type_contrat')) {
            $query->where('type_contrat', $request->type_contrat);
        }
        
        if ($request->has('lieu')) {
            $query->where('lieu', 'like', '%' . $request->lieu . '%');
        }
        
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }
        
        if ($request->has('etat')) {
            $query->where('etat', $request->etat);
        }
        
        $offres = $query->orderBy('created_at', 'desc')->paginate(10);
        
        // Ajouter l'URL complète du fichier PDF pour chaque offre
        $offres->getCollection()->transform(function ($offre) {
            if ($offre->offer_file) {
                $offre->offer_file_url = asset('storage/' . $offre->offer_file);
            }
            return $offre;
        });
        
        return response()->json([
            'success' => true,
            'offres' => $offres
        ]);
    }

    /**
     * Récupérer les offres d'emploi en attente (pour admin)
     *
     * @return \Illuminate\Http\Response
     */
    public function getPendingJobs()
    {
        $offres = OffreEmploi::with('page.user')
            ->where('statut', 'en_attente')
            ->orderBy('created_at', 'asc')
            ->paginate(10);
        
        return response()->json([
            'success' => true,
            'offres' => $offres
        ]);
    }

    /**
     * Créer une nouvelle offre d'emploi
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:offre_emploi,appel_manifestation_intéret',
            'titre' => 'required|string|max:255',
            'reference' => 'nullable|string|max:255',
            'entreprise' => 'required|string|max:255',
            'pays' => 'required|string|max:255',
            'ville' => 'required|string|max:255',
            'secteur' => 'required|string|max:255',
            'type_contrat' => 'required|string|max:255',
            'description' => 'required|string',
            'date_limite' => 'nullable|date',
            'email_contact' => 'required|email',
            'contacts' => 'nullable|string|max:255',
            'offer_file' => 'nullable|file|mimes:pdf|max:5120', // 5MB max, optionnel
            'lien' => 'nullable|url|max:255',
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

        

        $data = $request->all();
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
        if ($request->hasFile('offer_file') && $request->file('offer_file')->isValid()) {
            $file = $request->file('offer_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('offers', $fileName, 'public');
            $data['offer_file'] = $filePath;
        }

        $offre = OffreEmploi::create($data);
        
        // Créer une notification pour l'administrateur
        $admins = \App\Models\User::where('is_admin', true)->get();
        foreach ($admins as $admin) {
            $admin->notify(new \App\Notifications\PublicationSubmitted([
                'type' => $offre->type === "offre_emploi" ? "Offre d'emploi": "Appel à manifestation d'intérêt",
                'id' => $offre->id,
                'titre' => "Offre d'emploi, référence : " . $offre->reference,
                'message' => 'est en attente d\'approbation.',
                'user_id' => $user->id,
                'user_name' => $user->name
            ]));
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Offre d\'emploi créée avec succès. Elle est en attente de validation.',
            'offre' => $offre
        ], 201);
    }

    /**
     * Récupérer une offre d'emploi spécifique
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $offre = OffreEmploi::with('page.user')->findOrFail($id);
        
        // Ajouter l'URL complète du fichier PDF s'il existe
        if ($offre->offer_file) {
            $offre->offer_file_url = asset('storage/' . $offre->offer_file);
        }

        $offre->post_type = $offre->type;
        
        return response()->json([
            'success' => true,
            'offre' => $offre
        ]);
    }

    /**
     * Mettre à jour une offre d'emploi
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $offre = OffreEmploi::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier si l'utilisateur est autorisé
        // if (!$user->is_admin && $offre->page->user_id !== $user->id) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Vous n\'êtes pas autorisé à modifier cette offre d\'emploi.'
        //     ], 403);
        // }

        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:offre_emploi,appel_manifestation_intéret',
            'titre' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'entreprise' => 'nullable|string|max:255',
            'pays' => 'nullable|string|max:255',
            'ville' => 'nullable|string|max:255',
            'secteur' => 'nullable|string|max:255',
            'type_contrat' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'date_limite' => 'nullable|date',
            'email_contact' => 'nullable|email',
            'contacts' => 'nullable|string|max:255',
            'offer_file' => 'nullable|file|mimes:pdf|max:5120', // 5MB max
            'lien' => 'nullable|url|max:255',
            'statut' => 'nullable|in:en_attente,approuvé,rejeté,expiré',
            'etat' => 'nullable|in:disponible,terminé',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        
        // Si l'utilisateur n'est pas admin, l'offre revient en attente si certains champs sont modifiés
        if (!$user->is_admin && $request->has(['titre', 'description', 'competences_requises'])) {
            $data['statut'] = 'en_attente';
        }
        
        // Traitement du fichier PDF
        if ($request->hasFile('offer_file') && $request->file('offer_file')->isValid()) {
            // Supprimer l'ancien fichier s'il existe
            if ($offre->offer_file) {
                \Storage::disk('public')->delete($offre->offer_file);
            }
            
            $file = $request->file('offer_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('offers', $fileName, 'public');
            $data['offer_file'] = $filePath;
        }
        // Gestion de la suppression du fichier PDF
        elseif ($request->has('remove_offer_file') && $request->input('remove_offer_file') == '1') {
            // Supprimer le fichier physique
            if ($offre->offer_file) {
                \Storage::disk('public')->delete($offre->offer_file);
            }
            
            // Mettre à null le champ dans la base de données
            $data['offer_file'] = null;
        }
        
        $offre->update($data);
        
        return response()->json([
            'success' => true,
            'message' => 'Offre d\'emploi mise à jour avec succès.',
            'offre' => $offre
        ]);
    }

    /**
     * Changer l'état d'une offre d'emploi (disponible/terminé)
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

        $offre = OffreEmploi::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier si l'utilisateur est autorisé
        if (!$user->is_admin && $offre->page->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à modifier cette offre d\'emploi.'
            ], 403);
        }
        
        $offre->update([
            'etat' => $request->etat
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'État de l\'offre d\'emploi mis à jour avec succès.',
            'offre' => $offre
        ]);
    }

    /**
     * Changer le statut d'une offre d'emploi (admin)
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
                'message' => 'Seuls les administrateurs peuvent changer le statut des offres d\'emploi.'
            ], 403);
        }
        
        $offre = OffreEmploi::findOrFail($id);
        $offre->update([
            'statut' => $request->statut
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Statut de l\'offre d\'emploi mis à jour avec succès.',
            'offre' => $offre
        ]);
    }

    /**
     * Supprimer une offre d'emploi
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $offre = OffreEmploi::findOrFail($id);
        $user = Auth::user();

        if ($offre->offer_file) {   
            if (\Storage::disk('public')->exists($offre->offer_file)) {
                \Storage::disk('public')->delete($offre->offer_file);
            }
        }
        
        // Vérifier si l'utilisateur est autorisé
        // if (!$user->is_admin && $offre->page->user_id !== $user->id) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Vous n\'êtes pas autorisé à supprimer cette offre d\'emploi.'
        //     ], 403);
        // }
        
        $offre->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Offre d\'emploi supprimée avec succès.'
        ]);
    }
    
    /**
     * Liker une offre d'emploi
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function like($id)
    {
        $user = Auth::user();
        $offre = OffreEmploi::findOrFail($id);
        
        // Vérifier si l'utilisateur a déjà liké cette offre
        $existingLike = OffreEmploiLike::where('user_id', $user->id)
            ->where('offre_emploi_id', $id)
            ->first();
            
        if ($existingLike) {
            // Si l'utilisateur a déjà liké, on supprime le like (unlike)
            $existingLike->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Like retiré avec succès.',
                'liked' => false,
                'likes_count' => $offre->likes()->count()
            ]);
        }
        
        // Créer un nouveau like
        OffreEmploiLike::create([
            'user_id' => $user->id,
            'offre_emploi_id' => $id
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Offre d\'emploi likée avec succès.',
            'liked' => true,
            'likes_count' => $offre->likes()->count()
        ]);
    }
    
    /**
     * Vérifier si l'utilisateur a liké une offre d'emploi
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function checkLike($id)
    {
        $user = Auth::user();
        $offre = OffreEmploi::findOrFail($id);
        
        $liked = OffreEmploiLike::where('user_id', $user->id)
            ->where('offre_emploi_id', $id)
            ->exists();
            
        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $offre->likes()->count()
        ]);
    }
    
    /**
     * Commenter une offre d'emploi
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function comment(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:offre_emploi_comments,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $user = Auth::user();
        $offre = OffreEmploi::findOrFail($id);
        
        $comment = OffreEmploiComment::create([
            'user_id' => $user->id,
            'offre_emploi_id' => $id,
            'content' => $request->content,
            'parent_id' => $request->parent_id
        ]);
        
        // Charger les relations pour la réponse
        $comment->load('user');
        
        return response()->json([
            'success' => true,
            'message' => 'Commentaire ajouté avec succès.',
            'comment' => $comment,
            'comments_count' => $offre->comments()->count()
        ]);
    }
    
    /**
     * Récupérer les commentaires d'une offre d'emploi
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getComments($id)
    {
        $offre = OffreEmploi::findOrFail($id);
        
        // Récupérer uniquement les commentaires parents (pas les réponses)
        $comments = OffreEmploiComment::with(['user', 'replies.user'])
            ->where('offre_emploi_id', $id)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'comments' => $comments,
            'comments_count' => $offre->comments()->count()
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
        $comment = OffreEmploiComment::findOrFail($commentId);
        
        // Vérifier si l'utilisateur est autorisé à supprimer ce commentaire
        if (!$user->is_admin && $comment->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à supprimer ce commentaire.'
            ], 403);
        }
        
        $offreId = $comment->offre_emploi_id;
        $offre = OffreEmploi::findOrFail($offreId);
        
        // Supprimer également toutes les réponses à ce commentaire
        $comment->replies()->delete();
        $comment->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Commentaire supprimé avec succès.',
            'comments_count' => $offre->comments()->count()
        ]);
    }
    
    /**
     * Partager une offre d'emploi
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
        $offre = OffreEmploi::findOrFail($id);
        
        $share = OffreEmploiShare::create([
            'user_id' => $user->id,
            'offre_emploi_id' => $id,
            'comment' => $request->comment
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Offre d\'emploi partagée avec succès.',
            'share' => $share,
            'shares_count' => $offre->shares()->count()
        ]);
    }
    
    /**
     * Récupérer les partages d'une offre d'emploi
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getShares($id)
    {
        $offre = OffreEmploi::findOrFail($id);
        
        $shares = OffreEmploiShare::with('user')
            ->where('offre_emploi_id', $id)
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
        $post = OffreEmploi::with(['page', 'page.user'])
            ->findOrFail($id);

        // Vérifier si l'utilisateur est abonné à cette page
        $post->is_subscribed = PageAbonnes::where('user_id', $userId)
            ->where('page_id', $post->page_id)
            ->exists();

        // Compter les likes pour cette publication
        $post->likes_count = OffreEmploiLike::where('offre_emploi_id', $post->id)->count();

        // Type de publication
        $post->post_type = $post->type;
        $post->type = "offres-emploi";

        // Vérifier si l'utilisateur a aimé cette publication
        $post->is_liked = OffreEmploiLike::where('offre_emploi_id', $post->id)
            ->where('user_id', $userId)
            ->exists();
        
        // Ajouter l'URL complète du fichier d'offre s'il existe
        if ($post->offer_file) {
            $post->offer_file_url = asset('storage/' . $post->offer_file);
        }
        
        // Compter les commentaires pour cette publication
        $post->comments_count = OffreEmploiComment::where('offre_emploi_id', $post->id)->count();
        
        // Compter les partages pour cette publication
        $post->shares_count = OffreEmploiShare::where('offre_emploi_id', $post->id)->count();
        
        // Ajouter les informations détaillées de l'offre d'emploi
        $post->titre = $post->titre;
        $post->company_name = $post->entreprise;
        $post->location = $post->location;
        $post->type_contrat = $post->type_contrat;
        $post->description = $post->description;
        $post->competences_requises = $post->competences_requises;
        $post->experience_requise = $post->experience_requise;
        $post->niveau_etudes = $post->niveau_etudes;
        $post->salaire = $post->salaire;
        $post->devise = $post->devise;
        $post->avantages = $post->avantages;
        $post->date_limite = $post->date_limite;
        $post->email_contact = $post->email_contact;
        $post->contacts = $post->contacts;
        $post->user = $post->page->user;
        $post->user->picture = asset('storage/' . $post->user->picture);
        $post->external_link = $post->external_link;
        
        // Récupérer les 3 derniers commentaires
        $post->comments = OffreEmploiComment::where('offre_emploi_id', $post->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get()
            ->map(function($comment) use ($userId) {
                $userData = [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                ];
                
                if ($comment->user->picture) {
                    $userData['profile_picture'] = asset('storage/' . $comment->user->picture);
                }
                
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at,
                    'created_at_formatted' => $comment->created_at->diffForHumans(),
                    'user' => $userData
                ];
            });
        
        // Compter les partages pour cette publication
        $post->shares_count = OffreEmploiShare::where('offre_emploi_id', $post->id)->count();
        
        return response()->json([
            'success' => true,
            'post' => $post
        ]);
    }

    /**
     * Booster une offre d'emploi (augmenter sa durée d'affichage)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    /**
     * Booster une offre d'emploi (augmenter sa durée d'affichage)
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
            ]);

            // Récupérer l'offre d'emploi
            $offreEmploi = OffreEmploi::findOrFail($id);
            
            // Utiliser le service de boost
            $boostService = app(\App\Services\BoostService::class);
            $result = $boostService->boostPublication(
                $offreEmploi, 
                $request->days, 
                $request->amount, 
                'offre_emploi'
            );
            
            // Renommer la clé 'publication' en 'offre_d_emploi' pour maintenir la compatibilité avec le frontend
            if (isset($result['publication'])) {
                $result['offre_d_emploi'] = $result['publication'];
                unset($result['publication']);
            }
            
            return response()->json($result, $result['status_code']);
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors du boost de l\'offre d\'emploi: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du boost de l\'offre d\'emploi: ' . $e->getMessage()
            ], 500);
        }
    }
}
