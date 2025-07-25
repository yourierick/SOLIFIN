<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pack;
use App\Models\User;
use App\Models\CommissionRate;
use App\Models\UserPack;
use App\Models\BonusRates;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;


#[\Illuminate\Routing\Middleware\Authenticate]
#[\App\Http\Middleware\AdminMiddleware]
class PackController extends Controller
{
    public function index()
    {
        try {
            $packs = Pack::all();
            
            return response()->json([
                'success' => true,
                'packs' => $packs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des packs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        \Log::info($request->all());
        try {
            $validated = $request->validate([
                'categorie' => ['required'],
                'name' => ['required', 'max:255', 'string', Rule::unique('packs')],
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'status' => 'required|boolean',
                'avantages' => 'required|json',
                'duree_publication_en_jour' => 'required|numeric|min:1',
                'abonnement' => 'required|string|in:mensuel,trimestriel,semestriel,annuel,triennal,quinquennal',
                'boost_percentage' => 'required|numeric|min:0|max:100',
            ]);

            if ($request->peux_publier_formation === "1") {
                $request->peux_publier_formation = true;
            }else {
                $request->peux_publier_formation = false;   
            }

            // Créer le pack
            $pack = Pack::create([
                'categorie' => $validated['categorie'],
                'name' => $validated['name'],
                'description' => $validated['description'],
                'price' => $validated['price'],
                'status' => $request->boolean('status'),
                'avantages' => json_decode($request->avantages, true),
                'duree_publication_en_jour' => $validated['duree_publication_en_jour'],
                'abonnement' => $validated['abonnement'],
                'peux_publier_formation' => $request->boolean('peux_publier_formation'),
                'boost_percentage' => $validated['boost_percentage'],
            ]);

            //Attribuer automatiquement le pack aux super-administrateurs
            $superAdmins = User::whereHas('roleRelation', function ($query) {
                $query->where('nom', '=', 'super-admin');
            })->get();
            
            foreach ($superAdmins as $admin) {
                $referralLetter = substr($pack->name, 0, 1);
                $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                $referralCode = 'SPR' . $referralLetter . $referralNumber;

                // Vérifier que le code est unique
                while (UserPack::where('referral_code', $referralCode)->exists()) {
                    $referralNumber = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                    $referralCode = 'SPR' . $referralLetter . $referralNumber;
                }

                // Récupérer l'URL du frontend depuis le fichier .env
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

                // Créer le lien de parrainage en utilisant l'URL du frontend
                $referralLink = $frontendUrl . "/register?referral_code=" . $referralCode;

                $admin->packs()->attach($pack->id, [
                    'status' => 'active',
                    'purchase_date' => now(),
                    'expiry_date' => null, // Durée illimitée pour les admins
                    'is_admin_pack' => true,
                    'payment_status' => 'completed',
                    'referral_prefix' => 'SPR',
                    'referral_pack_name' => $pack->name,
                    'referral_letter' => $referralLetter,
                    'referral_number' => $referralNumber,
                    'referral_code' => $referralCode,
                    'link_referral' => $referralLink,
                ]);
            }

            //Créer définir les taux de commission à zéro pour ce pack créé
            for ($i = 1; $i <= 4; $i++) {
                $commissionrate = CommissionRate::create([
                    'pack_id' => $pack->id,
                    'level' => $i,
                    'rate' => 0, 
                ]);
            }


            return response()->json([
                'success' => true,
                'message' => 'Pack créé avec succès',
                'data' => $pack
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur dans PackController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création du pack'
            ], 500);
        }
    }

    public function show(Pack $pack)
    {
        return response()->json([
            'success' => true,
            'data' => $pack
        ]);
    }

    public function update(Request $request, Pack $pack)
    {
        \Log::info($request->all());
        $validator = Validator::make($request->all(), [
            'categorie' => 'required',
            'duree_publication_en_jour' => 'required|numeric|min:1',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'status' => 'required|boolean',
            'avantages' => 'required|json',
            'abonnement' => 'required|string|in:mensuel,trimestriel,semestriel,annuel,triennal,quinquennal',
            'peux_publier_formation' => 'required|boolean',
            'boost_percentage' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $pack->update([
                'categorie' => $request->categorie,
                'duree_publication_en_jour' => $request->duree_publication_en_jour,
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'status' => filter_var($request->status, FILTER_VALIDATE_BOOLEAN),
                'avantages' => $request->avantages,
                'abonnement' => $request->abonnement,
                'peux_publier_formation' => filter_var($request->peux_publier_formation, FILTER_VALIDATE_BOOLEAN),
                'boost_percentage' => $request->boost_percentage,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pack mis à jour avec succès',
                'data' => $pack
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la mise à jour du pack'
            ], 500);
        }
    }

    public function destroy(Pack $pack)
    {
        try {
            DB::beginTransaction();

            $pack->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pack supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la suppression du pack'
            ], 500);
        }
    }

    public function toggleStatus(Pack $pack)
    {
        try {
            $pack->update([
                'status' => !$pack->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Statut du pack mis à jour avec succès',
                'data' => $pack
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la mise à jour du statut'
            ], 500);
        }
    }

    public function updateCommissionRate(Request $request, $packId)
    {
        $request->validate([
            'level' => 'required|integer|between:1,4',
            'commission_rate' => 'required|numeric|min:0|max:100'
        ]);

        $pack = Pack::findOrFail($packId);
        
        // Mettre à jour ou créer le taux de commission pour le niveau spécifié
        CommissionRate::updateOrCreate(
            [
                'pack_id' => $packId,
                'level' => $request->level
            ],
            ['rate' => $request->commission_rate]
        );

        return response()->json(['message' => 'Taux de commission mis à jour avec succès']);
    }

    public function getCommissionRates($packId)
    {
        $commissionRates = CommissionRate::where('pack_id', $packId)
            ->orderBy('level')
            ->get();

        // Assurer que nous avons les 4 niveaux, même si certains n'existent pas encore
        $rates = [];
        for ($i = 1; $i <= 4; $i++) {
            $rate = $commissionRates->firstWhere('level', $i);
            $rates[$i] = $rate ? $rate->rate : 0;
        }

        return response()->json(['rates' => $rates]);
    }

    public function getBonusRates($packId)
    {
        $bonusRates = BonusRates::where('pack_id', $packId)->get();
        
        return response()->json([
            'success' => true,
            'bonusRates' => $bonusRates
        ]);
    }

    public function storeBonusRate(Request $request, $packId)
    {   
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:delais,esengo',
                'nombre_filleuls' => 'required|integer|min:1',
                'points_attribues' => 'required|integer|min:1',
                'valeur_point' => 'required_if:type,delais|numeric|min:0.01',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $pack = Pack::findOrFail($packId);
            
            // Vérifier si une configuration du même type existe déjà pour ce pack
            $existingBonus = BonusRates::where('pack_id', $packId)
                ->where('type', $request->type)
                ->first();
                
            if ($existingBonus) {
                return response()->json([
                    'success' => false,
                    'message' => $request->type === 'delais' 
                        ? 'Un bonus sur délais a déjà été configuré pour ce pack' 
                        : 'Une configuration de jetons Esengo existe déjà pour ce pack'
                ], 422);
            }
            
            DB::beginTransaction();

            $bonusRate = BonusRates::create([
                'pack_id' => $packId,
                'type' => $request->type,
                'frequence' => $request->type === "delais" ? "weekly" : "monthly",
                'nombre_filleuls' => $request->nombre_filleuls,
                'points_attribues' => $request->points_attribues,
                'valeur_point' => $request->valeur_point,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Taux de bonus ajouté avec succès',
                'bonusRate' => $bonusRate
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création du bonus rate'
            ], 500);
        } 
    }

    public function updateBonusRate(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:delais,esengo',
            'nombre_filleuls' => 'required|integer|min:1',
            'points_attribues' => 'required|integer|min:1',
            'valeur_point' => 'required_if:type,delais|numeric|min:0.01',
        ]);

        $bonusRate = BonusRates::findOrFail($id);
        $originalType = $bonusRate->type;
        
        // Si le type a changé, vérifier qu'il n'existe pas déjà une configuration du nouveau type
        if ($originalType !== $request->type) {
            $existingBonus = BonusRates::where('pack_id', $bonusRate->pack_id)
                ->where('type', $request->type)
                ->first();
                
            if ($existingBonus) {
                return response()->json([
                    'success' => false,
                    'message' => $request->type === 'delais' 
                        ? 'Un bonus sur délais a déjà été configuré pour ce pack' 
                        : 'Une configuration de jetons Esengo existe déjà pour ce pack'
                ], 422);
            }
        }
        
        $bonusRate->update([
            'type'   => $request->type,
            'frequence' => $request->type === "delais" ? "weekly" : "monthly",
            'nombre_filleuls' => $request->nombre_filleuls,
            'points_attribues' => $request->points_attribues,
            'valeur_point' => $request->valeur_point,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Taux de bonus mis à jour avec succès',
            'bonusRate' => $bonusRate
        ]);
    }

    public function deleteBonusRate($id)
    {
        $bonusRate = BonusRates::findOrFail($id);
        $bonusRate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Taux de bonus supprimé avec succès'
        ]);
    }
    
    /**
     * Récupère les packs administrateurs avec leurs codes de parrainage
     * Cette API est utilisée pour afficher les codes sponsors disponibles lors de l'inscription
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAdminPacks()
    {
        try {
            // Récupérer les utilisateurs administrateurs
            $superadminrole = Role::where('slug', 'super-admin')->first();
            $admins = User::where('is_admin', true)->where('role_id', $superadminrole->id)->pluck('id');
            
            // Récupérer les packs actifs avec leurs codes de parrainage pour les administrateurs
            $adminPacks = UserPack::whereIn('user_id', $admins)
                ->where('is_admin_pack', true)
                ->where('user_packs.status', 'active') // Spécifier explicitement la table pour éviter l'ambigüïté
                ->join('packs', 'user_packs.pack_id', '=', 'packs.id')
                ->where('packs.status', true) // Seulement les packs actifs
                ->select(
                    'packs.id',
                    'packs.name',
                    'packs.description',
                    'packs.categorie',
                    'user_packs.referral_code'
                )
                ->get();
            
            return response()->json([
                'success' => true,
                'packs' => $adminPacks
            ]);
        } catch (\Exception $e) {
            \Log::error($e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des packs administrateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}