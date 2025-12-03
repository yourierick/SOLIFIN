<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DigitalProduct;
use App\Notifications\PublicationStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DigitalProductValidationController extends Controller
{
    /**
     * Compter le nombre de produits numériques en attente
     *
     * @return JsonResponse
     */
    public function pendingCount(): JsonResponse
    {
        try {
            $count = DigitalProduct::where('statut', 'en_attente')->count();
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors du comptage des produits numériques en attente', 'error' => $e->getMessage()], 500);
        }
    }
    /**
     * Récupérer tous les produits numériques en attente de validation avec pagination
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        try {
            // Paramètres de pagination
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 10);
            
            // Construction de la requête
            $query = DigitalProduct::with('page.user')
                ->orderBy('created_at', 'desc');
            
            // Filtres
            if ($request->has('statut') && $request->get('statut') !== 'all') {
                $query->where('statut', $request->get('statut'));
            }
            
            if ($request->has('etat') && $request->get('etat') !== 'all') {
                $query->where('etat', $request->get('etat'));
            }
            
            // Filtrer par type
            if ($request->has('type') && in_array($request->type, ['ebook', 'logiciel', 'fichier_admin'])) {
                $query->where('type', $request->type);
            }

            // Recherche par titre ou description
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('titre', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Pagination
            $products = $query->paginate($perPage, ['*'], 'page', $page);
            
            // Transformer les résultats
            $products->getCollection()->transform(function ($product) {
                $product->image_url = $product->image ? asset("storage/" . $product->image) : null;
                $product->digital_product_file_url = $product->fichier ? asset('storage/' . $product->fichier) : null;
                
                if ($product->page && $product->page->user) {
                    $product->page->user->picture_url = $product->page->user->picture ? asset("storage/" . $product->page->user->picture) : null;
                }
                
                return $product;
            });
            
            return response()->json([
                'digitalProducts' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la récupération des produits numériques', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Approuver un produit numérique
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function approve($id)
    {
        $product = DigitalProduct::with('page.user')->findOrFail($id);
        $product->statut = 'approuve';
        $product->raison_rejet = null;
        $product->save();
        
        // Notifier l'utilisateur que son produit numérique a été approuvé
        $user = $product->page->user;
        $user->notify(new PublicationStatusChanged([
            'type' => 'produit_numerique',
            'id' => $product->id,
            'titre' => $product->titre,
            'statut' => 'approuve',
            'message' => 'Votre produit numérique "' . $product->titre . '" a été approuvé et est maintenant disponible à la vente.'
        ]));

        return response()->json([
            'message' => 'Produit numérique approuvé avec succès',
            'product' => $product
        ]);
    }

    /**
     * Rejeter un produit numérique
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'raison_rejet' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = DigitalProduct::with('page.user')->findOrFail($id);
        $product->statut = 'rejete';
        $product->raison_rejet = $request->raison_rejet;
        $product->save();
        
        // Notifier l'utilisateur que son produit numérique a été rejeté
        $user = $product->page->user;
        $user->notify(new PublicationStatusChanged([
            'type' => 'produit_numerique',
            'id' => $product->id,
            'titre' => $product->titre,
            'statut' => 'rejete',
            'raison' => $request->raison_rejet,
            'message' => 'Votre produit numérique "' . $product->titre . '" a été rejeté.'
        ]));

        return response()->json([
            'message' => 'Produit numérique rejeté avec succès',
            'product' => $product
        ]);
    }

     /**
     * Mettre à jour le statut d'un produit digital en attente
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateStatus(Request $request, $id)
    {    
        $product = DigitalProduct::findOrFail($id);
        
        // Vérifier si l'utilisateur est un administrateur
        if (!Auth::user()->is_admin) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        // Mettre à jour le statut
        $product->statut = $request->statut;
        $product->raison_rejet = "";
        $product->save();
        
        // Notifier l'utilisateur que le statut de sa publication a été modifié
        $user = User::find($product->user->id);
        $user->notify(new PublicationStatusChanged([
            'type' => $product->type === "ebook" ? "ebook" : "fichier_admin",
            'id' => $product->id,
            'titre' => $product->titre,
            'statut' => $request->statut,
            'message' => 'Le statut de votre produit numérique a été modifié.'
        ]));
        
        return response()->json([
            'message' => 'Statut de la publicité mis à jour avec succès',
            'product' => $product
        ]);
    }
}
