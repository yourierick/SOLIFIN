<?php

namespace App\Http\Controllers;

use App\Models\DigitalProduct;
use App\Models\DigitalProductPurchase;
use App\Models\Page;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\TransactionFee;
use App\Models\ExchangeRates;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DigitalProductController extends Controller
{
    /**
     * Récupérer tous les produits numériques de l'utilisateur connecté
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $user = Auth::user();
        $page = $user->page;

        if (!$page) {
            return response()->json(['message' => 'Page non trouvée'], 404);
        }

        $products = $page->produitsNumeriques()->orderBy('created_at', 'desc')->get();

        return response()->json($products);
    }

    /**
     * Récupérer tous les produits numériques approuvés
     *
     * @return \Illuminate\Http\Response
     */
    public function getApprovedProducts(Request $request)
    {
        $query = DigitalProduct::where('statut', 'approuve')
            ->where('etat', 'disponible')
            ->with('page.user');

        // Filtrer par type si spécifié
        if ($request->has('type') && in_array($request->type, ['ebook', 'fichier_admin'])) {
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

        // Pagination avec 6 éléments par page
        $perPage = $request->get('per_page', 6);
        $products = $query->orderBy('created_at', 'desc')->paginate($perPage);
        foreach ($products as $product) {
            $product->image_url = $product->image ? asset("storage/" . $product->image) : null;
            $product->fichier_url = $product->fichier ? asset('storage/' . $product->fichier) : null;
        }

        return response()->json($products);
    }

    /**
     * Créer un nouveau produit numérique
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'titre' => 'required|string|max:255',
                'description' => 'required|string',
                'type' => 'required|in:ebook,fichier_admin',
                'prix' => 'required|numeric|min:0',
                'devise' => 'required|string|max:10',
                'image' => 'nullable|image|max:2048', // 2MB max
                'fichier' => 'required|file|max:20480', // 20MB max
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user = Auth::user();
            $page = $user->page;

            if (!$page) {
                return response()->json(['message' => 'Page non trouvée'], 404);
            }

            // Traitement de l'image
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('produits_numeriques/images', 'public');
            }

            // Traitement du fichier
            $fichierPath = $request->file('fichier')->store('produits_numeriques/fichiers', 'public');

            DB::beginTransaction();
            // Création du produit numérique
            $product = DigitalProduct::create([
                'page_id' => $page->id,
                'titre' => $request->titre,
                'description' => $request->description,
                'type' => $request->type,
                'prix' => $request->prix,
                'devise' => $request->devise,
                'image' => $imagePath,
                'fichier' => $fichierPath,
                'statut' => 'en_attente',
                'etat' => 'disponible',
                'nombre_ventes' => 0,
            ]);

            // Créer une notification pour l'administrateur
            $admins = \App\Models\User::where('is_admin', true)->get();
            foreach ($admins as $admin) {
                $admin->notify(new \App\Notifications\PublicationSubmitted([
                    'type' => 'Produit numérique',
                    'id' => $product->id,
                    'titre' => "Produit numérique, titre: " . $product->titre,
                    'message' => 'est en attente d\'approbation.',
                    'user_id' => $user->id,
                    'user_name' => $user->name
                ]));
            }

            DB::commit();
            return response()->json([
                'message' => 'Produit numérique créé avec succès',
                'product' => $product
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la création du produit numérique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un produit numérique spécifique
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $product = DigitalProduct::with('page.user')->findOrFail($id);

        // Vérifier si le produit est approuvé ou si l'utilisateur est le propriétaire
        $user = Auth::user();
        $isOwner = $user && $product->page->user_id === $user->id;

        if ($product->statut !== 'approuve' && !$isOwner) {
            return response()->json(['message' => 'Produit non disponible'], 403);
        }

        $product->image_url = asset('storage/' . $product->image);
        $product->fichier_url = asset('storage/' . $product->fichier);

        return response()->json($product);
    }

    /**
     * Mettre à jour un produit numérique
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'titre' => 'required|string|max:255',
                'description' => 'required|string',
                'type' => 'required|in:ebook,fichier_admin',
                'prix' => 'required|numeric|min:0',
                'devise' => 'required|string|max:10',
                'image' => 'nullable|image|max:2048', // 2MB max
                'fichier' => 'nullable|file|max:20480', // 20MB max
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $product = DigitalProduct::findOrFail($id);
            
            // Vérifier si l'utilisateur est le propriétaire
            $user = Auth::user();
            $page = $user->page;
            
            if (!$page || $product->page_id !== $page->id) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }

            DB::beginTransaction();
            // Traitement de l'image
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image si elle existe
                if ($product->image) {
                    Storage::disk('public')->delete($product->image);
                }
                $imagePath = $request->file('image')->store('produits_numeriques/images', 'public');
                $product->image = $imagePath;
            }

            // Traitement du fichier
            if ($request->hasFile('fichier')) {
                // Supprimer l'ancien fichier
                Storage::disk('public')->delete($product->fichier);
                $fichierPath = $request->file('fichier')->store('produits_numeriques/fichiers', 'public');
                $product->fichier = $fichierPath;
            }

            // Mise à jour des autres champs
            $product->titre = $request->titre;
            $product->description = $request->description;
            $product->type = $request->type;
            $product->prix = $request->prix;
            $product->devise = $request->devise;
            $product->statut = 'en_attente'; // Remettre en attente pour validation
            $product->save();

            $product->image_url = $product->image ? asset("storage/" . $product->image) : null;
            $product->fichier_url = $product->fichier ? asset("storage/" . $product->fichier) : null;

            DB::commit();
            return response()->json([
                'message' => 'Produit numérique mis à jour avec succès',
                'product' => $product
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du produit numérique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un produit numérique
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            $product = DigitalProduct::findOrFail($id);
            
            // Vérifier si l'utilisateur est le propriétaire
            $user = Auth::user();
            $page = $user->page;
            
            if (!$page || $product->page_id !== $page->id) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }

            // Supprimer les fichiers associés
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            Storage::disk('public')->delete($product->fichier);

            $product->delete();
            DB::commit();

            return response()->json(['message' => 'Produit numérique supprimé avec succès']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la suppression du produit numérique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Changer l'état d'un produit numérique (disponible/terminé)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function changeEtat($id)
    {
        try {
            $product = DigitalProduct::findOrFail($id);
            
            // Vérifier si l'utilisateur est le propriétaire
            $user = Auth::user();
            $page = $user->page;
            
            if (!$page || $product->page_id !== $page->id) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }

            $product->update([
                'etat' => $product->etat == 'disponible' ? 'termine' : 'disponible',
            ]);

            return response()->json([
                'message' => 'État du produit numérique modifié avec succès',
                'product' => $product
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du changement de l\'état du produit numérique',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Acheter un produit numérique
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function purchase(Request $request, $id)
    {
        try {
            $product = DigitalProduct::findOrFail($id);
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit numérique non trouvé'
                ], 404);
            }

            $productPrice = floatval($product->prix);
            $montant_a_payer = $request->montant_a_payer;
            $devise = $request->devise;
            
            // Vérifier si le produit est approuvé et disponible
            if ($product->statut !== 'approuve' || $product->etat !== 'disponible') {
                return response()->json(['message' => 'Produit non disponible'], 403);
            }

            $user = Auth::user();

            // Vérifier si l'utilisateur a déjà acheté ce produit
            $existingPurchase = DigitalProductPurchase::where('digital_product_id', $product->id)
                ->where('user_id', $user->id)
                ->where('statut', 'complete')
                ->first();

            if ($existingPurchase) {
                return response()->json([
                    'success' => true,
                    'message' => 'Vous avez déjà acheté ce produit',
                    'purchase' => $existingPurchase,
                    'download_url' => route('digital-products.download', $existingPurchase->id)
                ]);
            }

            // Récupérer le pourcentage des frais de commodité system
            $feePercentage = \App\Models\Setting::where('key', 'purchase_commission_system')->first();
            if (!$feePercentage) {
                $purchaseFeePercentage = 0;
            } else {
                $purchaseFeePercentage = floatval($feePercentage->value);
            }

            // Calculer les frais et le montant total
            $fees = ($productPrice * $purchaseFeePercentage) / 100;
            $totalAmount = $productPrice + $fees;

            // Vérifier si l'utilisateur a suffisamment de fonds
            $userWallet = Wallet::where('user_id', $user->id)->first();
            if (!$userWallet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wallet non trouvé'
                ], 402);
            }

            if ($userWallet->balance_usd < $totalAmount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde insuffisant pour effectuer cet achat'
                ], 402);
            }

            DB::beginTransaction();

            $devise = "USD";

            // Créer un achat en attente avec un identifiant de transaction unique
            $purchase = DigitalProductPurchase::create([
                'digital_product_id' => $product->id,
                'user_id' => $user->id,
                'prix' => $productPrice,
                'frais' => $fees,
                'montant_total' => $totalAmount,
                'devise' => $devise,
                'transaction_id' => 'dp_' . uniqid(),
                'statut' => 'en_cours',
            ]);

            // Récupérer le vendeur
            $sellerPage = $product->page;
            $seller = $sellerPage->user;
            $sellerWallet = $seller->wallet;
            
            if (!$sellerWallet) {
                $sellerWallet = Wallet::create([
                    'user_id' => $seller->id,
                    'balance_usd' => 0,
                    'balance_cdf' => 0,
                    'total_earned_usd' => 0,
                    'total_earned_cdf' => 0,
                    'total_withdrawn_usd' => 0,
                    'total_withdrawn_cdf' => 0,
                ]);
            }
            
            // Débiter le portefeuille de l'acheteur avec métadonnées détaillées
            $userWallet->withdrawFunds(
                $totalAmount, 
                $devise,
                "purchase", 
                "completed", 
                [
                    "produit" => $product->titre, 
                    "montant" => $productPrice,
                    "frais" => $fees . ' $',
                    "Vendeur" => $seller->name, 
                    "description" => "Vous avez acheté le produit numérique " . $product->titre . " à l'utilisateur " . $seller->name
                ]
            );
            
            // Créditer le portefeuille du vendeur avec métadonnées détaillées
            $sellerWallet->addFunds(
                $productPrice, 
                $devise,
                "digital_product_sale", 
                "completed", 
                [
                    "produit" => $product->titre, 
                    "montant" => $productPrice . ' $', 
                    "Acheteur" => $user->name, 
                    "description" => "Vous avez vendu le produit numérique " . $product->titre . " à l'utilisateur " . $user->name
                ]
            );
            
            // Créditer le portefeuille système pour les frais
            $systemWallet = WalletSystem::first();
            if (!$systemWallet) {
                $systemWallet = WalletSystem::create([
                    'balance_usd' => 0,
                    'balance_cdf' => 0,
                    'total_in_usd' => 0,
                    'total_in_cdf' => 0,
                    'total_out_usd' => 0,
                    'total_out_cdf' => 0,
                ]);
            }
            
            // Créer une transaction cette opération dans le portefeuille système
            $systemWallet->transactions()->create([
                "wallet_system_id" => $systemWallet->id,
                "mouvment" => 'in',
                "type" => "digital_product_sale",
                "amount" => $totalAmount,
                "currency" => $devise,
                "status" => "completed",
                "metadata" => [
                    "Produit" => "Produit numérique", 
                    "Compte Acheteur" => $user->account_id,
                    "Compte Vendeur" => $seller->account_id,
                    "Méthode de paiement" => "Solifin Wallet",
                    "Titre du produit" => $product->titre, 
                    "Prix du produit" => $productPrice . " $", 
                    "Commission solifin" => $fees . ' $',
                ]
            ]);

            // Mettre à jour le nombre de ventes
            $product->nombre_ventes += 1;
            $product->save();

            // Mettre à jour le statut de l'achat
            $purchase->statut = 'complete';
            $purchase->save();

            // Notifier le vendeur de la vente
            $seller->notify(new \App\Notifications\DigitalProductSold([
                'product_id' => $product->id,
                'product_title' => $product->titre,
                'amount' => $productPrice,
                'currency' => $devise,
                'buyer_name' => $user->name
            ]));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Achat effectué avec succès',
                'purchase' => $purchase,
                'download_url' => route('digital-products.download', $purchase->id)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'achat d\'un produit numérique: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'achat du produit numérique'
            ], 500);
        }
    }

    /**
     * Télécharger un produit numérique acheté
     *
     * @param int $purchaseId
     * @return \Illuminate\Http\Response
     */
    public function download($purchaseId)
    {
        $user = Auth::user();
        $purchase = DigitalProductPurchase::findOrFail($purchaseId);

        // Vérifier que l'utilisateur est bien le propriétaire de l'achat
        if ($purchase->user_id !== $user->id) {
            return response()->json(['message' => 'Vous n\'avez pas accès à ce fichier'], 403);
        }

        $product = $purchase->digitalProduct;

        // Vérifier que le produit existe et est disponible
        if (!$product || $product->etat !== 'disponible') {
            return response()->json(['message' => 'Ce produit n\'est plus disponible'], 404);
        }

        // Récupérer le chemin du fichier
        $filePath = $product->fichier;

        // Vérifier que le fichier existe
        if (!Storage::exists($filePath)) {
            return response()->json(['message' => 'Fichier introuvable'], 404);
        }

        // Déterminer le type de fichier pour le téléchargement
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        $contentType = 'application/octet-stream';
        
        if ($extension === 'pdf') {
            $contentType = 'application/pdf';
        } elseif (in_array($extension, ['zip', 'rar'])) {
            $contentType = 'application/zip';
        }

        return Storage::download($filePath, $product->titre . '.' . $extension, [
            'Content-Type' => $contentType,
        ]);
    }

    /**
     * Récupérer tous les achats de produits numériques de l'utilisateur connecté
     *
     * @return \Illuminate\Http\Response
     */
    public function myPurchases()
    {
        $user = Auth::user();
        
        $purchases = DigitalProductPurchase::where('user_id', $user->id)
            ->where('statut', 'complete')
            ->with(['digitalProduct' => function($query) {
                $query->select('id', 'titre', 'description', 'prix', 'devise', 'type', 'image', 'fichier', 'page_id', 'created_at');
            }])
            ->get()
            ->map(function($purchase) {
                // Ajouter les URLs complètes pour les images et fichiers
                if ($purchase->digitalProduct) {
                    $purchase->digitalProduct->image_url = $purchase->digitalProduct->image ? asset('storage/' . $purchase->digitalProduct->image) : null;
                    $purchase->digitalProduct->fichier_url = $purchase->digitalProduct->fichier ? asset('storage/' . $purchase->digitalProduct->fichier) : null;
                }
                
                // Ajouter l'URL de téléchargement
                $purchase->download_url = $purchase->digitalProduct->fichier_url;
                
                return $purchase;
            });
        
        return response()->json([
            'success' => true,
            'data' => $purchases
        ]);
    }

    /**
     * Récupère le pourcentage de frais d'achat depuis les paramètres du système
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPurchaseFeePercentage()
    {
        $feePercentage = \App\Models\Setting::where('key', 'purchase_commission_system')->first();
        
        if (!$feePercentage) {
            // Valeur par défaut si le paramètre n'existe pas
            $feePercentage = 0;
        } else {
            $feePercentage = floatval($feePercentage->value);
        }
        
        return response()->json([
            'success' => true,
            'fee_percentage' => $feePercentage
        ]);
    }
}
