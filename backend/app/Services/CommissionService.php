<?php

namespace App\Services;

use App\Models\UserPack;
use App\Models\WalletSystem;
use App\Models\CommissionRate;
use App\Models\Commission;
use App\Models\User;
use App\Notifications\CommissionReceived;

class CommissionService
{
    public function distributeCommissions(UserPack $purchase, $duration_months)
    {
        $currentUser = $purchase->user;
        $currentSponsor = User::find($purchase->sponsor_id);
        $step = $this->getSubscriptionStep($purchase->pack->abonnement);
        $periods = ceil($duration_months / $step);
        $packPrice = $purchase->pack->price * $periods;

        $level = 1;
        $maxLevel = 4; // Maximum 4 générations

        // Ajouter le montant au wallet system (sans les frais)
        while ($currentSponsor && $level <= $maxLevel) {
            // Récupérer le taux de commission pour ce niveau
            $rate = CommissionRate::where('pack_id', $purchase->pack_id)
                ->where('level', $level)
                ->first();
            if ($rate) {
                // Calculer le montant de la commission
                $amount = ($packPrice * $rate->rate) / 100;


                //Vérifier si le pack du sponsor est actif
                $checkPack = $currentSponsor->packs()->where('pack_id', $purchase->pack_id)->first();
                if ($checkPack->status == "active") {
                    // Créer la commission
                    $commission = Commission::create([
                        'user_id' => $currentSponsor->id,
                        'source_user_id' => $currentUser->id,
                        'pack_id' => $purchase->pack_id,
                        'duree' => $duration_months,
                        'amount' => $amount,
                        'level' => $level,
                        'status' => 'pending'
                    ]);

                    // Notifier le parrain
                    //$currentSponsor->notify(new CommissionReceived($amount, $purchase, $level));

                    // Traiter immédiatement la commission
                    $this->processCommission($commission->id, $duration_months);
                }else {
                    $commission = Commission::create([
                        'user_id' => $currentSponsor->id,
                        'source_user_id' => $currentUser->id,
                        'pack_id' => $purchase->pack_id,
                        'duree' => $duration_months,
                        'amount' => $amount,
                        'level' => $level,
                        'status' => 'failed',
                        'error_message' => 'pack non actif lors de la distribution des commissions'
                    ]);
                }
            }

            // Passer au parrain suivant
            $sponsorPack = UserPack::where('user_id', $currentSponsor->id)
                ->where('pack_id', $purchase->pack_id)
                ->where('payment_status', 'completed')
                ->first();
            
            if ($sponsorPack && $sponsorPack->sponsor_id) {
                $currentSponsor = User::find($sponsorPack->sponsor_id);
                $level++;
            } else {
                break;
            }
        }
    }

    public function processCommission($commissionId, $duration_months)
    {
        try {
            // Vérifier si l'utilisateur a un portefeuille
            $commission = Commission::find($commissionId);
            $wallet = $commission->sponsor_user->wallet;
            if (!$wallet) {
                throw new \Exception('L\'utilisateur n\'a pas de portefeuille');
            }

            // Mettre à jour le solde du portefeuille
            $wallet->addFunds($commission->amount, "commission de parrainage", "completed", [ "source_id"=>$commission->source_user_id, "source"=>$commission->source_user->name, 
            "pack_name"=>$commission->pack->name, "pack_id"=>$commission->pack->id, "duration"=>$duration_months]); 

            // Marquer la commission comme traitée
            $commission->update([
                'status' => 'completed',
                'processed_at' => now()
            ]);

            $walletsystem = WalletSystem::first();
            if (!$walletsystem) {
                $walletsystem = WalletSystem::create(['balance' => 0]);
            }

            $walletsystem->transactions()->create([
                'wallet_system_id' => $walletsystem->id,
                'amount' => $commission->amount,
                'type' => 'commission de parrainage',
                'status' => 'completed',
                'metadata' => [
                    "user" => $commission->source_user->name, 
                    "bénéficiaire" => $commission->sponsor_user->name,
                    "Opération" => "Commission de parrainage",
                    "Montant" => $commission->amount, 
                    "Durée" => $duration_months
                ]
            ]);

            return true;
        } catch (\Exception $e) {
            // En cas d'erreur, marquer la commission comme échouée
            \Log::error($e->getMessage());
            $commission->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return false;
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
