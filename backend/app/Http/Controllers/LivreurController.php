<?php

namespace App\Http\Controllers;

use App\Models\Livreur;
use App\Models\Page;
use App\Models\User;
use App\Models\Publicite;
use App\Notifications\CandidatureLivreurNotification;
use App\Notifications\PubliciteAvecLivreurNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LivreurController extends Controller
{
    /**
     * Afficher la liste des livreurs pour une page.
     *
     * @param  int  $pageId
     * @param  Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $pageId)
    {
        // Récupérer la page
        $page = Page::findOrFail($pageId);
        
        // Filtrer par statut si spécifié
        $query = Livreur::where('page_id', $pageId);
        
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }
        
        // Pagination
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 25);
        
        // Calculer offset
        $offset = ($page - 1) * $limit;
        
        // Compter le total
        $total = $query->count();
        
        // Récupérer les livreurs paginés avec leurs utilisateurs associés
        $livreurs = $query->with('user')
            ->offset($offset)
            ->limit($limit)
            ->get();
            
        // Ajouter les URLs des images
        foreach($livreurs as $livreur){
            $livreur->user->picture = $livreur->user->picture ? asset('storage/' . $livreur->user->picture) : null;
        }
        
        // Calculer les informations de pagination
        $totalPages = ceil($total / $limit);
        $perPage = min($limit, $total);
        $from = $total > 0 ? $offset + 1 : 0;
        $to = $total > 0 ? min($offset + $limit, $total) : 0;
        
        return response()->json([
            'success' => true,
            'livreurs' => $livreurs,
            'pagination' => [
                'current_page' => (int) $page,
                'total_pages' => $totalPages,
                'per_page' => (int) $limit,
                'total' => $total,
                'from' => $from,
                'to' => $to,
            ],
            'current_page' => (int) $page,
            'total_pages' => $totalPages,
            'per_page' => (int) $limit,
            'total' => $total
        ]);
    }

    /**
     * Postuler en tant que livreur pour une page.
     *
     * @param  int  $pageId
     * @param  Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function postuler($pageId, Request $request)
    {
        // Valider les données de la requête
        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string|max:500',
            'coordonnees' => 'required|string|max:255',
            'zone_livraison' => 'nullable|string|max:255',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Vérifier si l'utilisateur a déjà postulé pour cette page
        $existingApplication = Livreur::where('user_id', Auth::id())
            ->where('page_id', $pageId)
            ->first();
        
        if ($existingApplication) {
            return response()->json([
                'success' => false,
                'message' => 'Vous avez déjà postulé pour cette page.'
            ], 400);
        }
        
        // Vérifier si la page existe
        $page = Page::findOrFail($pageId);
        
        // Créer la candidature
        $livreur = Livreur::create([
            'page_id' => $pageId,
            'user_id' => Auth::id(),
            'statut' => 'en_attente',
            'description' => $request->description ?? '',
            'coordonnees' => $request->coordonnees,
            'zone_livraison' => $request->zone_livraison ?? '',
        ]);
        
        // Notifier le propriétaire de la page
        $pageOwner = User::findOrFail($page->user_id);
        $applicant = Auth::user();
        
        $pageOwner->notify(new CandidatureLivreurNotification($applicant, $page));
        
        return response()->json([
            'success' => true,
            'message' => 'Votre candidature a été soumise avec succès.',
            'livreur' => $livreur
        ], 201);
    }

    /**
     * Approuver une candidature de livreur.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approuver($id)
    {
        // Récupérer la candidature
        $livreur = Livreur::findOrFail($id);
        
        // Vérifier si l'utilisateur est le propriétaire de la page
        $page = Page::findOrFail($livreur->page_id);
        
        if ($page->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas l\'autorisation d\'approuver cette candidature.'
            ], 403);
        }
        
        // Mettre à jour le statut
        $livreur->statut = 'approuve';
        $livreur->save();
        
        // Notifier le livreur que sa candidature a été approuvée
        $livreurUser = User::findOrFail($livreur->user_id);
        $livreurUser->notify(new \App\Notifications\LivreurApprouveNotification($page));
        
        return response()->json([
            'success' => true,
            'message' => 'La candidature a été approuvée avec succès.',
            'livreur' => $livreur
        ]);
    }

    /**
     * Rejeter une candidature de livreur.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejeter($id)
    {
        // Récupérer la candidature
        $livreur = Livreur::findOrFail($id);
        
        // Vérifier si l'utilisateur est le propriétaire de la page
        $page = Page::findOrFail($livreur->page_id);
        
        if ($page->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas l\'autorisation de rejeter cette candidature.'
            ], 403);
        }
        
        // Mettre à jour le statut
        $livreur->statut = 'rejete';
        $livreur->save();
        
        // Notifier le livreur que sa candidature a été rejetée
        $livreurUser = User::findOrFail($livreur->user_id);
        $livreurUser->notify(new \App\Notifications\LivreurRejeteNotification($page));
        
        return response()->json([
            'success' => true,
            'message' => 'La candidature a été rejetée.',
            'livreur' => $livreur
        ]);
    }

    /**
     * Supprimer une candidature de livreur.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function supprimer($id)
    {
        // Récupérer la candidature
        $livreur = Livreur::findOrFail($id);
        
        // Vérifier si l'utilisateur est le propriétaire de la page ou le livreur lui-même
        $page = Page::findOrFail($livreur->page_id);
        
        if ($page->user_id !== Auth::id() && $livreur->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas l\'autorisation de supprimer cette candidature.'
            ], 403);
        }
        
        // Supprimer la candidature
        $livreur->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'La candidature a été supprimée avec succès.'
        ]);
    }

    /**
     * Vérifier si l'utilisateur a déjà postulé pour une page.
     *
     * @param  int  $pageId
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkCandidature($pageId)
    {
        // Vérifier si la page existe
        $page = Page::findOrFail($pageId);
        
        $candidature = Livreur::where('user_id', Auth::id())
            ->where('page_id', $pageId)
            ->first();
        
        return response()->json([
            'success' => true,
            'has_candidature' => $candidature ? true : false,
            'status' => $candidature ? $candidature->statut : null,
            'candidature' => $candidature
        ]);
    }

    /**
     * Notifier les livreurs approuvés d'une page lorsqu'une publicité avec besoin de livreurs est approuvée.
     * Cette méthode sera appelée depuis le contrôleur de validation des publicités.
     *
     * @param  Publicite  $publicite
     * @return void
     */
    public static function notifierLivreurs(Publicite $publicite)
    {
        // Vérifier si la publicité a besoin de livreurs
        if ($publicite->besoin_livreurs !== 'oui') {
            return;
        }
        
        // Récupérer tous les livreurs approuvés pour cette page
        $livreurs = Livreur::where('page_id', $publicite->page_id)
            ->where('statut', 'approuve')
            ->with('user')
            ->get();
        
        // Notifier chaque livreur
        foreach ($livreurs as $livreur) {
            $livreur->user->notify(new PubliciteAvecLivreurNotification($publicite));
        }
    }

    /**
     * Révoquer un livreur approuvé.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function revoquer($id)
    {
        // Récupérer le livreur
        $livreur = Livreur::findOrFail($id);
        
        // Vérifier si l'utilisateur est le propriétaire de la page
        $page = Page::findOrFail($livreur->page_id);
        if ($page->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => "Vous n'avez pas l'autorisation de révoquer ce livreur."
            ], 403);
        }
        
        // Vérifier si le livreur est approuvé
        if ($livreur->statut !== 'approuve') {
            return response()->json([
                'success' => false,
                'message' => "Seuls les livreurs approuvés peuvent être révoqués."
            ], 400);
        }
        
        // Mettre à jour le statut du livreur
        $livreur->statut = 'revoque';
        $livreur->save();
        
        // Notifier l'utilisateur de la révocation
        $livreur->user->notify(new \App\Notifications\LivreurRevoqueNotification($page));
        
        return response()->json([
            'success' => true,
            'message' => "Le livreur a été révoqué avec succès.",
            'livreur' => $livreur
        ]);
    }
}
