<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserPack;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\Pack;
use App\Models\Page;
use App\Models\Role;
use App\Models\ReferralInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Services\ReferralCodeService;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Services\CommissionService;
use App\Models\ExchangeRates;
use App\Notifications\VerifyEmailWithCredentials;
use App\Notifications\ReferralInvitationConverted;
use Carbon\Carbon;
use App\Models\Setting;


class RegisterController extends Controller
{
    public function register(Request $request, $pack_id)
    {
        try {
            // Valider les données
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'address' => 'required|string',
                'phone' => 'required|string',
                'whatsapp' => 'nullable|string',
                'sponsor_code' => 'required|exists:user_packs,referral_code',
                'invitation_code' => 'nullable|string',
                'duration_months' => 'required|integer|min:1',
                'payment_method' => 'required|string',
                'payment_type' => 'required|string',
                'payment_details' => 'required|array',
                'gender' => 'required|string',
                'country' => 'required|string',
                'province' => 'required|string',
                'city' => 'required|string',
                'currency' => 'nullable|string|max:3',
                'amount' => 'required|numeric',
                'fees' => 'required|numeric',
                'phoneNumber' => 'nullable|string',
                'acquisition_source' => 'nullable|string',
            ]);

            DB::beginTransaction();

            $pack = Pack::find($pack_id);

            // Récupérer les informations de paiement
            $paymentMethod = $validated['payment_method']; // Méthode spécifique (visa, m-pesa, etc.)
            $paymentType = $validated['payment_type']; // Type général (credit-card, mobile-money, etc.)
            $paymentAmount = $validated['amount']; // Montant sans les frais
            $paymentCurrency = $validated['currency'];
            $paymentDetails = $validated['payment_details'] ?? [];
            $taux_de_change = 0;

            // Recalculer les frais globaux de transaction (pourcentage configuré dans le système)
            $globalFeePercentage = (float) Setting::getValue('purchase_fee_percentage', 0);
            
            // Calcul des frais globaux basé sur le montant du paiement
            $globalFees = ((float)$paymentAmount) * ($globalFeePercentage / 100);
            
            // Log des frais globaux calculés
            \Log::info('Frais globaux calculés', [
                'montant' => $paymentAmount,
                'pourcentage' => $globalFeePercentage,
                'frais_globaux' => $globalFees
            ]);

            // Récupérer les frais de transaction spécifiques à la méthode de paiement
            // Ceci permet d'éviter les manipulations côté frontend
            $transactionFeeModel = \App\Models\TransactionFee::where('payment_method', $paymentMethod)
                                                           ->where('is_active', true);
            
            $transactionFee = $transactionFeeModel->first();
            
            // Calculer les frais de transaction spécifiques à la méthode de paiement
            $specificFees = 0;
            $specificFees = $transactionFee->calculateTransferFee((float) $paymentAmount, $paymentCurrency);
                
            // Log des frais spécifiques calculés
            \Log::info('Frais spécifiques calculés', [
                'montant' => $paymentAmount,
                'methode_paiement' => $paymentMethod,
                'devise' => $paymentCurrency,
                'frais_specifiques' => $specificFees
            ]);
            
            // Montant total incluant les frais globaux (les frais spécifiques sont gérés par l'API de paiement)
            $totalAmount = $paymentAmount + $globalFees;
            
            // Log du montant total calculé
            \Log::info('Montant total calculé', [
                'montant_base' => $paymentAmount,
                'frais_globaux' => $globalFees,
                'montant_total' => $totalAmount
            ]);
            
            // Si la devise n'est pas en USD, convertir le montant en USD (devise de base)
            // Initialiser les variables pour les montants en USD
            $amountInUSD = $totalAmount;
            $globalFeesInUSD = $globalFees;
            $specificFeesInUSD = $specificFees;
            
            if ($paymentCurrency !== 'USD') {
                try {
                    // Conversion du montant total en USD
                    \Log::info('Début de conversion en USD', [
                        'montant_total' => $totalAmount,
                        'devise_origine' => $paymentCurrency
                    ]);

                    $taux_de_change = ExchangeRates::where('currency', $paymentCurrency)->where("target_currency", "USD")->first();
                    $taux_de_change = $taux_de_change->rate;
                    
                    // Appel à la fonction de conversion
                    $amountInUSD = $this->convertToUSD($totalAmount, $paymentCurrency);
                    $amountInUSD = round($amountInUSD, 2);
                    
                    // Conversion des frais en USD
                    $globalFeesInUSD = $this->convertToUSD($globalFees, $paymentCurrency);
                    $globalFeesInUSD = round($globalFeesInUSD, 2);
                    
                    $specificFeesInUSD = $this->convertToUSD($specificFees, $paymentCurrency);
                    $specificFeesInUSD = round($specificFeesInUSD, 2);
                    
                    \Log::info('Conversion en USD réussie', [
                        'montant_total_usd' => $amountInUSD,
                        'frais_globaux_usd' => $globalFeesInUSD,
                        'frais_specifiques_usd' => $specificFeesInUSD,
                        'Taux du jour' => $taux_de_change
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Erreur de conversion en USD', [
                        'message' => $e->getMessage(),
                        'devise' => $paymentCurrency
                    ]);
                    
                    return response()->json([
                        "success" => false, 
                        "message" => "Impossible d'utiliser cette monnaie, veuillez payer en USD pour plus de simplicité"
                    ]);
                }
            }
            
            // Calcul des montants nets (sans les frais)
            $amountInUSDWithoutSpecificFees = round($amountInUSD - $specificFeesInUSD, 2);
            $amountWithoutGlobalFeesInUSD = round($amountInUSD - $globalFeesInUSD, 2);
            
            \Log::info('Montants nets calculés', [
                'montant_total_usd' => $amountInUSD,
                'montant_sans_frais_specifiques' => $amountInUSDWithoutSpecificFees,
                'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD,
                'Taux du jour' => $taux_de_change
            ]);
            
            // Déterminer le pas d'abonnement en fonction du type d'abonnement
            $step = $this->getSubscriptionStep($pack->abonnement);
            
            // Calculer le nombre de périodes d'abonnement
            $periods = ceil($validated['duration_months'] / $step);
            
            // Calcul du coût du pack en fonction du nombre de périodes
            $packCost = $pack->price * $periods;
            
            \Log::info('Vérification du coût du pack', [
                'prix_pack' => $pack->price,
                'duree_mois' => $validated['duration_months'],
                'pas_abonnement' => $step,
                'periodes' => $periods,
                'cout_total' => $packCost,
                'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD
            ]);

            // Vérifier que le montant net est suffisant pour couvrir le coût du pack
            if ($amountWithoutGlobalFeesInUSD < $packCost) {
                \Log::warning('Paiement insuffisant', [
                    'montant_sans_frais_globaux' => $amountWithoutGlobalFeesInUSD,
                    'cout_pack' => $packCost,
                    'difference' => $packCost - $amountWithoutGlobalFeesInUSD
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant payé est insuffisant pour couvrir le coût du pack'
                ], 400);
            }

            //Logique de paiement api à implémenter

            // Enregistrer le paiement dans le système
            $walletsystem = WalletSystem::first();
            if (!$walletsystem) {
                $walletsystem = WalletSystem::create([
                    "balance" => 0,
                    "total_in" => 0,
                    "total_out" => 0,
                ]);
            }
            
            $walletsystem->transactions()->create([
                'wallet_system_id' => $walletsystem->id,
                'amount' => $amountInUSDWithoutSpecificFees,
                'type' => 'sales',
                'status' => 'completed',
                'metadata' => [
                    "Opération" => "Achat d'un pack d'enregistrement",
                    "user" => $user->name, 
                    "Id du pack" => $pack->id, 
                    "Nom du pack" => $pack->name, 
                    "Durée de souscription" => $validated['duration_months'] . " mois", 
                    "Type de paiement" => $validated['payment_type'],
                    "Méthode de paiement" => $validated['payment_method'], 
                    "Détails de paiement" => $validated['payment_details'] ?? [],
                    "Dévise" => $paymentCurrency,
                    "Montant net payé sans les frais" => $paymentAmount . " " . $paymentCurrency,
                    "Frais de transaction" => $globalFees . " $",
                    "Frais API" => $specificFees . " " . $paymentCurrency,
                    "Taux de change appliqué" => $taux_de_change,
                    "Description" => "Achat du pack d'enregistrement " . $pack->name . " via " . $validated['payment_method']
                ]
            ]);

            // Stocker le mot de passe en clair temporairement pour l'email
            $plainPassword = $validated['password'];
            
            $userrole = Role::where('slug', 'user')->first();
            // Créer l'utilisateur
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($plainPassword),
                'sexe' => $validated['gender'],
                'address' => $validated['address'],
                'phone' => $validated['phone'],
                'whatsapp' => $validated['whatsapp'] ?? null,
                'pays' => $validated['country'],
                'province' => $validated['province'],
                'ville' => $validated['city'],
                'status' => 'active',
                'is_admin' => false,
                'role_id' => $userrole->id,
                'acquisition_source' => $validated['acquisition_source'] ?? null,
                'pack_de_publication_id' => $pack->id,
            ]);

            do {
                $account_id = 'USR-' . rand(1, 100) . "-" . strtoupper(Str::random(4));
            } while (User::where('account_id', $account_id)->exists());

            $user->account_id = $account_id;
            $user->update();

            // Traiter le code de parrainage
            $sponsorCode = $validated['sponsor_code'];
            $sponsorPack = UserPack::where('referral_code', $sponsorCode)->first();

            // Créer le wallet
            $userWallet = Wallet::create([
                'user_id' => $user->id,
                'balance' => 0,
                'total_earned' => 0,
                'total_withdrawn' => 0,
            ]);

            //enregistrer la transaction dans le wallet de l'utilisateur
            $userWallet->transactions()->create([
                'wallet_id' => $userWallet->id,
                'amount' => $amountInUSD,
                'type' => 'purchase',
                'status' => 'completed',
                'metadata' => [
                    "Opération" => "Achat d'un pack d'enregistrement",
                    "Id du pack" => $pack->id, 
                    "Nom du pack" => $pack->name, 
                    "Durée de souscription" => $validated['duration_months'] . " mois", 
                    "Type de paiement" => $validated['payment_type'],
                    "Méthode de paiement" => $validated['payment_method'], 
                    "Détails de paiement" => $validated['payment_details'] ?? [],
                    "Dévise" => $validated['currency'],
                    "Montant net payé sans les frais" => $paymentAmount . "" .$paymentCurrency,
                    "Frais de transaction" => $globalFees . " $",
                    "Taux de change appliqué" => $taux_de_change,
                    "Description" => "Achat du pack d'enregistrement " . $pack->name . " via " . $validated['payment_method']
                ]
            ]);

            // Créer la page
            Page::create([
                'user_id' => $user->id,
                'nombre_abonnes' => 0,
                'nombre_likes' => 0,
                'photo_de_couverture' => null,
            ]);

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

            // Attacher le pack à l'utilisateur
            $user->packs()->attach($pack->id, [
                'status' => 'active',
                'purchase_date' => now(),
                'expiry_date' => now()->addMonths($validated['duration_months']),
                'is_admin_pack' => false,
                'payment_status' => 'completed',
                'referral_prefix' => 'SPR',
                'referral_pack_name' => $pack->name,
                'referral_letter' => $referralLetter,
                'referral_number' => $referralNumber,
                'referral_code' => $referralCode,
                'link_referral' => $referralLink,
                'sponsor_id' => $sponsorPack->user_id ?? null,
            ]);

            $user_pack = UserPack::where('user_id', $user->id)->where('pack_id', $pack->id)->where('referral_code', $referralCode)->first();

            // Distribuer les commissions
            $this->processCommissions($user_pack, $validated['duration_months']);
            
            // Mettre à jour le statut de l'invitation si un code d'invitation a été fourni
            if (!empty($validated['invitation_code'])) {
                $this->updateInvitationStatus($validated['invitation_code'], $user->id);
            }
            
            DB::commit();

            // Envoyer l'email de vérification avec les informations supplémentaires
            $user->notify(new VerifyEmailWithCredentials($pack_id, $validated['duration_months'], $plainPassword, $referralCode, $referralLink));

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur lors de l\'inscription: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription'
            ], 500);
        }
    }

    private function processCommissions(UserPack $user_pack, $duration_months)
    {
        $commissionService = new CommissionService();
        $commissionService->distributeCommissions($user_pack, $duration_months);
    }

    public function validateReferralCode(Request $request)
    {
        $code = $request->input('code');
        return response()->json([
            'valid' => ReferralCodeService::isValidCode($code)
        ]);
    }

    
    private function convertToUSD($amount, $currency)
    {
        if ($currency === 'USD') {
            return $amount;
        }else {
            $amount = round($amount, 2);
        }
        
        try {
            // Récupérer le taux de conversion depuis la BD
            $exchangeRate = ExchangeRates::where('currency', $currency)->where("target_currency", "USD")->first();
            if ($exchangeRate) {
                $amount = $amount * $exchangeRate->rate;
                return round($amount, 2);
            } else {
                // Si le taux n'est pas trouvé, lever une exception
                throw new \Exception("Taux de conversion non disponible pour la devise $currency");
            }
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la conversion de devise: ' . $e->getMessage());
            throw new \Exception("Impossible d'utiliser cette monnaie, veuillez payer en USD pour plus de simplicité");
        }
    }
    
    /**
     * Met à jour le statut d'une invitation après l'inscription d'un utilisateur
     * 
     * @param string $invitationCode Code de l'invitation
     * @param int $userId ID de l'utilisateur qui s'est inscrit
     * @return void
     */
    private function updateInvitationStatus($invitationCode, $userId)
    {
        try {
            $invitation = ReferralInvitation::where('invitation_code', $invitationCode)
                ->whereIn('status', ['pending', 'sent', 'opened'])
                ->first();
                
            if ($invitation) {
                $invitation->status = 'registered';
                $invitation->registered_at = Carbon::now();
                $invitation->save();
                
                // Récupérer le propriétaire de l'invitation et l'utilisateur nouvellement inscrit
                $invitation_owner = $invitation->user;
                $new_user = User::find($userId);
                
                // Envoyer une notification au propriétaire de l'invitation
                if ($invitation_owner && $new_user) {
                    $invitation_owner->notify(new ReferralInvitationConverted($invitation, $new_user));
                }
            }
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du statut de l\'invitation: ' . $e->getMessage());
        }
    }

    /**
     * Détermine le pas d'abonnement en mois selon le type d'abonnement
     *
     * @param string|null $subscriptionType Type d'abonnement (mensuel, trimestriel, etc.)
     * @return int Pas d'abonnement en mois
     */
    private function getSubscriptionStep($subscriptionType)
    {
        $type = strtolower($subscriptionType ?? '');
        
        switch ($type) {
            case 'monthly':
            case 'mensuel':
                return 1; // Pas de 1 mois pour abonnement mensuel
            case 'quarterly':
            case 'trimestriel':
                return 3; // Pas de 3 mois pour abonnement trimestriel
            case 'biannual':
            case 'semestriel':
                return 6; // Pas de 6 mois pour abonnement semestriel
            case 'annual':
            case 'yearly':
            case 'annuel':
                return 12; // Pas de 12 mois pour abonnement annuel
            case 'triennal':
                return 36;
            case 'quinquennal':
                return 60;
            default:
                return 1; // Par défaut, pas de 1 mois
        }
    }
}