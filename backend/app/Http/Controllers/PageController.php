<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\User;
use App\Models\PageAbonnes;
use App\Models\OffreEmploiLike;
use App\Models\OffreEmploiComment;
use App\Models\OffreEmploiShare;
use App\Models\OpportuniteAffaireLike;
use App\Models\OpportuniteAffaireComment;
use App\Models\OpportuniteAffaireShare;
use App\Models\PubliciteLike;
use App\Models\PubliciteComment;
use App\Models\PubliciteShare;
use App\Models\DigitalProductLike;
use App\Models\DigitalProductComment;
use App\Models\DigitalProductShare;
use App\Models\DigitalProductPurchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PageController extends Controller
{
    /**
     * Récupérer la page de l'utilisateur connecté avec toutes ses publications
     *
     * @return \Illuminate\Http\Response
     */
    /**
     * Calculer le nombre total de likes pour une page
     * en comptant les likes de toutes les tables
     *
     * @param  \App\Models\Page  $page
     * @return int
     */
    private function calculateTotalLikes($page)
    {
        // Compter les likes des offres d'emploi
        $offreEmploiLikes = \App\Models\OffreEmploiLike::whereIn('offre_emploi_id', function($query) use ($page) {
            $query->select('id')->from('offres_emploi')->where('page_id', $page->id);
        })->count();
        
        // Compter les likes des opportunités d'affaires
        $opportuniteAffaireLikes = \App\Models\OpportuniteAffaireLike::whereIn('opportunite_affaire_id', function($query) use ($page) {
            $query->select('id')->from('opportunites_affaires')->where('page_id', $page->id);
        })->count();
        
        // Compter les likes des publicités
        $publiciteLikes = \App\Models\PubliciteLike::whereIn('publicite_id', function($query) use ($page) {
            $query->select('id')->from('publicites')->where('page_id', $page->id);
        })->count();
        
        // Retourner le total
        return $offreEmploiLikes + $opportuniteAffaireLikes + $publiciteLikes;
    }

    public function getMyPage()
    {
        $user = Auth::user();
        $page = $user->page;

        if (!$page) {
            // Créer une page pour l'utilisateur si elle n'existe pas
            $page = Page::create([
                'user_id' => $user->id,
                'nombre_abonnes' => 0,
                'nombre_likes' => 0
            ]);
        }

        // Charger uniquement les informations de base de la page et l'utilisateur
        $page->load(['user']);

        // Calculer le nombre total de likes pour cette page
        $totalLikes = $this->calculateTotalLikes($page);
        
        // Mettre à jour le nombre de likes dans la base de données
        $page->nombre_likes = $totalLikes;
        $page->save();

        // Ajouter l'URL complète de la photo de couverture si elle existe
        if ($page->photo_de_couverture) {
            $page->photo_de_couverture = asset('storage/' . $page->photo_de_couverture);
        }

        return response()->json([
            'success' => true,
            'page' => $page,
        ]);
    }

    /**
     * Récupérer les publicités de l'utilisateur avec pagination
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getAdvertisements(Request $request)
    {
        \Log::info($request->all());
        $user = Auth::user();
        $page = $user->page;

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'Page non trouvée',
                'advertisements' => [],
                'pagination' => [
                    'currentPage' => 1,
                    'totalPages' => 0,
                    'totalItems' => 0,
                    'itemsPerPage' => $request->get('limit', 25)
                ]
            ]);
        }

        $pageNumber = $request->get('page', 1);
        $limit = $request->get('limit', 25);
        $offset = ($pageNumber - 1) * $limit;

        // Récupérer les publicités avec pagination
        $advertisementsQuery = $page->publicites();
        
        // Appliquer les filtres si présents
        if ($request->has('search')) {
            $search = $request->get('search');
            $advertisementsQuery->where(function($q) use ($search) {
                $q->where('titre', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('statut') && $request->get('statut') !== 'tous') {
            $advertisementsQuery->where('statut', $request->get('statut'));
        }

        if ($request->has('etat') && $request->get('etat') !== 'tous') {
            $advertisementsQuery->where('etat', $request->get('etat'));
        }

        // Filtres de date
        if ($request->has('date_debut') && $request->get('date_debut')) {
            $advertisementsQuery->whereDate('created_at', '>=', $request->get('date_debut'));
        }

        if ($request->has('date_fin') && $request->get('date_fin')) {
            $advertisementsQuery->whereDate('created_at', '<=', $request->get('date_fin'));
        }

        $totalItems = $advertisementsQuery->count();
        $advertisements = $advertisementsQuery->offset($offset)->limit($limit)->get();

        $totalPages = ceil($totalItems / $limit);

        return response()->json([
            'success' => true,
            'advertisements' => $advertisements,
            'pagination' => [
                'currentPage' => (int)$pageNumber,
                'totalPages' => $totalPages,
                'totalItems' => $totalItems,
                'itemsPerPage' => (int)$limit
            ]
        ]);
    }

    /**
     * Récupérer les offres d'emploi de l'utilisateur avec pagination
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getJobOffers(Request $request)
    {
        $user = Auth::user();
        $page = $user->page;

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'Page non trouvée',
                'jobOffers' => [],
                'pagination' => [
                    'currentPage' => 1,
                    'totalPages' => 0,
                    'totalItems' => 0,
                    'itemsPerPage' => $request->get('limit', 25)
                ]
            ]);
        }

        $pageNumber = $request->get('page', 1);
        $limit = $request->get('limit', 25);
        $offset = ($pageNumber - 1) * $limit;

        // Récupérer les offres d'emploi avec pagination
        $jobOffersQuery = $page->offresEmploi();
        
        // Appliquer les filtres si présents
        if ($request->has('search')) {
            $search = $request->get('search');
            $jobOffersQuery->where(function($q) use ($search) {
                $q->where('titre', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('statut') && $request->get('statut') !== 'tous') {
            $jobOffersQuery->where('statut', $request->get('statut'));
        }

        if ($request->has('etat') && $request->get('etat') !== 'tous') {
            $jobOffersQuery->where('etat', $request->get('etat'));
        }

        // Filtres de date
        if ($request->has('date_debut') && $request->get('date_debut')) {
            $jobOffersQuery->whereDate('created_at', '>=', $request->get('date_debut'));
        }

        if ($request->has('date_fin') && $request->get('date_fin')) {
            $jobOffersQuery->whereDate('created_at', '<=', $request->get('date_fin'));
        }

        $totalItems = $jobOffersQuery->count();
        $jobOffers = $jobOffersQuery->offset($offset)->limit($limit)->get();

        // Ajouter l'URL complète du fichier PDF pour chaque offre d'emploi
        foreach ($jobOffers as $offre) {
            if ($offre->offer_file) {
                $offre->offer_file_url = asset('storage/' . $offre->offer_file);
            }
        }

        $totalPages = ceil($totalItems / $limit);

        return response()->json([
            'success' => true,
            'jobOffers' => $jobOffers,
            'pagination' => [
                'currentPage' => (int)$pageNumber,
                'totalPages' => $totalPages,
                'totalItems' => $totalItems,
                'itemsPerPage' => (int)$limit
            ]
        ]);
    }

    /**
     * Récupérer les opportunités d'affaires de l'utilisateur avec pagination
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getBusinessOpportunities(Request $request)
    {
        $user = Auth::user();
        $page = $user->page;

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'Page non trouvée',
                'businessOpportunities' => [],
                'pagination' => [
                    'currentPage' => 1,
                    'totalPages' => 0,
                    'totalItems' => 0,
                    'itemsPerPage' => $request->get('limit', 25)
                ]
            ]);
        }

        $pageNumber = $request->get('page', 1);
        $limit = $request->get('limit', 25);
        $offset = ($pageNumber - 1) * $limit;

        // Récupérer les opportunités d'affaires avec pagination
        $businessOpportunitiesQuery = $page->opportunitesAffaires();
        
        // Appliquer les filtres si présents
        if ($request->has('search')) {
            $search = $request->get('search');
            $businessOpportunitiesQuery->where(function($q) use ($search) {
                $q->where('titre', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('statut') && $request->get('statut') !== 'tous') {
            $businessOpportunitiesQuery->where('statut', $request->get('statut'));
        }

        if ($request->has('etat') && $request->get('etat') !== 'tous') {
            $businessOpportunitiesQuery->where('etat', $request->get('etat'));
        }

        // Filtres de date
        if ($request->has('date_debut') && $request->get('date_debut')) {
            $businessOpportunitiesQuery->whereDate('created_at', '>=', $request->get('date_debut'));
        }

        if ($request->has('date_fin') && $request->get('date_fin')) {
            $businessOpportunitiesQuery->whereDate('created_at', '<=', $request->get('date_fin'));
        }

        $totalItems = $businessOpportunitiesQuery->count();
        $businessOpportunities = $businessOpportunitiesQuery->offset($offset)->limit($limit)->get();

        // Ajouter l'URL complète du fichier PDF pour chaque opportunité
        foreach ($businessOpportunities as $opportunite) {
            if ($opportunite->opportunity_file) {
                $opportunite->opportunity_file_url = asset('storage/' . $opportunite->opportunity_file);
            }
        }

        $totalPages = ceil($totalItems / $limit);

        return response()->json([
            'success' => true,
            'businessOpportunities' => $businessOpportunities,
            'pagination' => [
                'currentPage' => (int)$pageNumber,
                'totalPages' => $totalPages,
                'totalItems' => $totalItems,
                'itemsPerPage' => (int)$limit
            ]
        ]);
    }

    /**
     * Récupérer les produits numériques de l'utilisateur avec pagination
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getDigitalProducts(Request $request)
    {
        $user = Auth::user();
        $page = $user->page;

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'Page non trouvée',
                'digitalProducts' => [],
                'pagination' => [
                    'currentPage' => 1,
                    'totalPages' => 0,
                    'totalItems' => 0,
                    'itemsPerPage' => $request->get('per_page', $request->get('limit', 6))
                ]
            ]);
        }

        $pageNumber = $request->get('page', 1);
        $limit = $request->get('per_page', $request->get('limit', 6)); // Utiliser per_page ou limit, par défaut 6
        $offset = ($pageNumber - 1) * $limit;

        // Récupérer les produits numériques avec pagination
        $digitalProductsQuery = $page->produitsNumeriques();
        
        // Appliquer les filtres si présents
        if ($request->has('search')) {
            $search = $request->get('search');
            $digitalProductsQuery->where(function($q) use ($search) {
                $q->where('titre', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('statut') && $request->get('statut') !== 'tous') {
            $digitalProductsQuery->where('statut', $request->get('statut'));
        }

        if ($request->has('etat') && $request->get('etat') !== 'tous') {
            $digitalProductsQuery->where('etat', $request->get('etat'));
        }

        // Filtres de date
        if ($request->has('date_debut') && $request->get('date_debut')) {
            $digitalProductsQuery->whereDate('created_at', '>=', $request->get('date_debut'));
        }

        if ($request->has('date_fin') && $request->get('date_fin')) {
            $digitalProductsQuery->whereDate('created_at', '<=', $request->get('date_fin'));
        }

        $totalItems = $digitalProductsQuery->count();
        $digitalProducts = $digitalProductsQuery->offset($offset)->limit($limit)->get();

        // Ajouter les URLs complètes pour les produits numériques
        foreach ($digitalProducts as $produit) {
            if ($produit->image) {
                $produit->image_url = asset('storage/' . $produit->image);
            }
            if ($produit->fichier) {
                $produit->fichier_url = asset('storage/' . $produit->fichier);
            }
        }

        $totalPages = ceil($totalItems / $limit);

        return response()->json([
            'success' => true,
            'digitalProducts' => $digitalProducts,
            'pagination' => [
                'currentPage' => (int)$pageNumber,
                'totalPages' => $totalPages,
                'totalItems' => $totalItems,
                'itemsPerPage' => (int)$limit
            ]
        ]);
    }

    /**
     * Récupérer les détails d'une page spécifique
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getPage($id)
    {
        $userId = Auth::id();
        
        $page = Page::with([
            'publicites' => function($query) {
                $query->where('statut', '!=', 'rejeté')->where('statut', '!=', 'en_attente');
            }, 
            'offresEmploi' => function($query) {
                $query->where('statut', '!=', 'rejeté')->where('statut', '!=', 'en_attente');
            }, 
            'opportunitesAffaires' => function($query) {
                $query->where('statut', '!=', 'rejeté')->where('statut', '!=', 'en_attente');
            },
            'user'
        ])->findOrFail($id);

        // Vérifier si l'utilisateur est abonné à cette page
        $isSubscribed = false;
        if ($userId) {
            $isSubscribed = PageAbonnes::where('user_id', $userId)
                ->where('page_id', $id)
                ->exists();
        }

        // Compter le nombre total d'abonnés
        $page->nombre_abonnes = PageAbonnes::where('page_id', $id)->count();
        
        // Compter le nombre total de likes (toutes publications confondues)
        $publiciteIds = $page->publicites->pluck('id')->toArray();
        $offreEmploiIds = $page->offresEmploi->pluck('id')->toArray();
        $opportuniteAffaireIds = $page->opportunitesAffaires->pluck('id')->toArray();
        
        $publiciteCount = !empty($publiciteIds) ? PubliciteLike::whereIn('publicite_id', $publiciteIds)->count() : 0;
        $offreEmploiCount = !empty($offreEmploiIds) ? OffreEmploiLike::whereIn('offre_emploi_id', $offreEmploiIds)->count() : 0;
        $opportuniteAffaireCount = !empty($opportuniteAffaireIds) ? OpportuniteAffaireLike::whereIn('opportunite_affaire_id', $opportuniteAffaireIds)->count() : 0;
        
        $page->nombre_likes = $publiciteCount + $offreEmploiCount + $opportuniteAffaireCount;

        // Traitement des images pour les publicités
        foreach ($page->publicites as $publicite) {
            // Ajouter les URLs des images
            if ($publicite->image) {
                $baseUrl = url('/');
                
                // Vérifier si l'image est un JSON (tableau d'images) ou une chaîne simple
                if (is_string($publicite->image) && json_decode($publicite->image) !== null) {
                    $imageArray = json_decode($publicite->image, true);
                    $publicite->images = [];
                    foreach ($imageArray as $img) {
                        $publicite->images[] = asset('storage/' . $img);
                    }
                    $publicite->image = $publicite->images[0] ?? null;
                    $publicite->image_url = $publicite->images[0] ?? null;
                } else {
                    $publicite->image = asset('storage/' . $publicite->image);
                    $publicite->image_url = $publicite->image;
                    $publicite->images = [$publicite->image];
                }
            }

            // Ajouter les URLs des videos
            if ($publicite->video) {
                $baseUrl = url('/');
                
                // Vérifier si l'image est un JSON (tableau d'images) ou une chaîne simple
                if (is_string($publicite->video) && json_decode($publicite->video) !== null) {
                    $videoArray = json_decode($publicite->video, true);
                    $publicite->videos = [];
                    foreach ($videoArray as $vid) {
                        $publicite->videos[] = asset('storage/' . $vid);
                    }
                    $publicite->video = $publicite->videos[0] ?? null;
                    $publicite->video_url = $publicite->videos[0] ?? null;
                } else {
                    $publicite->video = asset('storage/' . $publicite->video);
                    $publicite->video_url = $publicite->video;
                    $publicite->videos = [$publicite->video];
                }
            }
            
            // Ajouter les statistiques de likes et commentaires
            $publicite->likes_count = PubliciteLike::where('publicite_id', $publicite->id)->count();
            $publicite->comments_count = PubliciteComment::where('publicite_id', $publicite->id)->count();
            $publicite->shares_count = PubliciteShare::where('publicite_id', $publicite->id)->count();
            $publicite->post_type = $publicite->type;
            $publicite->type = "publicites";
            // Vérifier si l'utilisateur connecté a aimé cette publication
            if ($userId) {
                $publicite->liked_by_current_user = PubliciteLike::where('publicite_id', $publicite->id)
                    ->where('user_id', $userId)
                    ->exists();
            } else {
                $publicite->liked_by_current_user = false;
            }
            
            // Récupérer les 3 derniers commentaires
            $publicite->comments = PubliciteComment::where('publicite_id', $publicite->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->take(3)
                ->get()
                ->map(function($comment) {
                    $comment->user->profile_picture = $comment->user->picture ? url('/') . Storage::url($comment->user->picture) : null;
                    return $comment;
                });
        }
        
        // Traitement des fichiers pour les offres d'emploi
        foreach ($page->offresEmploi as $offre) {
            // Ajouter les statistiques de likes et commentaires
            $offre->likes_count = OffreEmploiLike::where('offre_emploi_id', $offre->id)->count();
            $offre->comments_count = OffreEmploiComment::where('offre_emploi_id', $offre->id)->count();
            $offre->shares_count = OffreEmploiShare::where('offre_emploi_id', $offre->id)->count();
            $offre->post_type = $offre->type;
            $offre->type = "offres-emploi";
            if ($offre->offer_file) {
                $offre->offer_file_url = asset('storage/' . $offre->offer_file);
            }
            // Vérifier si l'utilisateur connecté a aimé cette publication
            if ($userId) {
                $offre->liked_by_current_user = OffreEmploiLike::where('offre_emploi_id', $offre->id)
                    ->where('user_id', $userId)
                    ->exists();
            } else {
                $offre->liked_by_current_user = false;
            }
            
            // Récupérer les 3 derniers commentaires
            $offre->comments = OffreEmploiComment::where('offre_emploi_id', $offre->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->take(3)
                ->get()
                ->map(function($comment) {
                    $comment->user->picture = $comment->user->picture ? asset('storage/' . $comment->user->picture) : null;
                    return $comment;
                });
        }

        // Traitement des fichiers pour les opportunités d'affaires
        foreach ($page->opportunitesAffaires as $opportunite) {
            // Ajouter les URLs des fichiers
            if ($opportunite->opportunity_file) {
                $opportunite->opportunity_file_url = asset('storage/' . $opportunite->opportunity_file);
            }

            // Ajouter les statistiques de likes et commentaires
            $opportunite->likes_count = OpportuniteAffaireLike::where('opportunite_affaire_id', $opportunite->id)->count();
            $opportunite->comments_count = OpportuniteAffaireComment::where('opportunite_affaire_id', $opportunite->id)->count();
            $opportunite->shares_count = OpportuniteAffaireShare::where('opportunite_affaire_id', $opportunite->id)->count();
            $opportunite->post_type = $opportunite->type;
            $opportunite->type = "opportunites-affaires";
            // Vérifier si l'utilisateur connecté a aimé cette publication
            if ($userId) {
                $opportunite->liked_by_current_user = OpportuniteAffaireLike::where('opportunite_affaire_id', $opportunite->id)
                    ->where('user_id', $userId)
                    ->exists();
            } else {
                $opportunite->liked_by_current_user = false;
            }
            
            // Récupérer les 3 derniers commentaires
            $opportunite->comments = OpportuniteAffaireComment::where('opportunite_affaire_id', $opportunite->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->take(3)
                ->get()
                ->map(function($comment) {
                    $comment->user->picture = $comment->user->picture ? asset('storage/' . $comment->user->picture) : null;
                    return $comment;
                });
        }

        // Ajouter l'URL complète de la photo de couverture si elle existe
        if ($page->photo_de_couverture) {
            // Vérifier si l'URL contient déjà "storage" pour éviter la duplication
            $page->photo_de_couverture = asset('storage/' . $page->photo_de_couverture);
        }

        if ($page->user->picture) {
            $page->user->picture = asset('storage/' . $page->user->picture);
        }

        return response()->json([
            'success' => true,
            'page' => $page,
            'isSubscribed' => $isSubscribed
        ]);
    }

    /**
     * S'abonner à une page
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $pageId
     * @return \Illuminate\Http\Response
     */
    // public function subscribe($pageId)
    // {
    //     $user = Auth::user();
    //     $page = Page::findOrFail($pageId);

    //     // Vérifier si l'utilisateur est déjà abonné
    //     $existingSubscription = PageAbonnes::where('page_id', $pageId)
    //         ->where('user_id', $user->id)
    //         ->first();

    //     if ($existingSubscription) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Vous êtes déjà abonné à cette page.'
    //         ], 400);
    //     }

    //     // Créer l'abonnement
    //     PageAbonnes::create([
    //         'page_id' => $pageId,
    //         'user_id' => $user->id
    //     ]);

    //     // Mettre à jour le nombre d'abonnés
    //     $page->nombre_abonnes = $page->nombre_abonnes + 1;
    //     $page->save();

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Vous êtes maintenant abonné à cette page.'
    //     ]);
    // }

    // /**
    //  * Se désabonner d'une page
    //  *
    //  * @param  int  $pageId
    //  * @return \Illuminate\Http\Response
    //  */
    // public function unsubscribe($pageId)
    // {
    //     $user = Auth::user();
    //     $page = Page::findOrFail($pageId);

    //     // Supprimer l'abonnement
    //     $deleted = PageAbonnes::where('page_id', $pageId)
    //         ->where('user_id', $user->id)
    //         ->delete();

    //     if (!$deleted) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Vous n\'êtes pas abonné à cette page.'
    //         ], 400);
    //     }

    //     // Mettre à jour le nombre d'abonnés
    //     $page->nombre_abonnes = max(0, $page->nombre_abonnes - 1);
    //     $page->save();

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Vous êtes maintenant désabonné de cette page.'
    //     ]);
    // }

    // /**
    //  * Aimer une page
    //  *
    //  * @param  int  $pageId
    //  * @return \Illuminate\Http\Response
    //  */
    // public function likePage($pageId)
    // {
    //     $page = Page::findOrFail($pageId);
    //     $page->nombre_likes = $page->nombre_likes + 1;
    //     $page->save();

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Vous avez aimé cette page.'
    //     ]);
    // }

    /**
     * Récupérer les abonnés d'une page
     *
     * @param  int  $pageId
     * @return \Illuminate\Http\Response
     */
    public function getPageStats($pageId)
    {
        $page = Page::findOrFail($pageId);
        $subscribers = $page->abonnes()->with('user')->get();

        return response()->json([
            'success' => true,
            'subscribers' => $subscribers,
            'page_subscribers' => $page->nombre_abonnes,
            'page_likes' => $page->nombre_likes,
        ]);
    }

    /**
     * Vérifier si l'utilisateur est abonné à une page
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function checkSubscription($id)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => true,
                'isSubscribed' => false
            ]);
        }
        
        $isSubscribed = PageAbonnes::where('page_id', $id)
            ->where('user_id', $user->id)
            ->exists();
        
        return response()->json([
            'success' => true,
            'isSubscribed' => $isSubscribed
        ]);
    }

    /**
     * Mettre à jour la photo de couverture de la page de l'utilisateur connecté
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateCoverPhoto(Request $request)
    {
        // Validation
        $validator = Validator::make($request->all(), [
            'photo_de_couverture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $page = Page::where('user_id', $user->id)->first();

        if (!$page) {
            // Créer une page pour l'utilisateur si elle n'existe pas
            $page = Page::create([
                'user_id' => $user->id,
                'nombre_abonnes' => 0,
                'nombre_likes' => 0
            ]);
        }

        // Supprimer l'ancienne photo si elle existe
        if ($page->photo_de_couverture) {
            Storage::disk('public')->delete($page->photo_de_couverture);
        }

        // Stocker la nouvelle photo
        $path = $request->file('photo_de_couverture')->store('cover_photos', 'public');
        
        // Mettre à jour la page
        $page->photo_de_couverture = $path;
        $page->save();

        return response()->json([
            'success' => true,
            'message' => 'Photo de couverture mise à jour avec succès',
            'photo_de_couverture' => asset('storage/' . $path)
        ]);
    }
}
