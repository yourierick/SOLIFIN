<?php

namespace App\Services;

use App\Models\Publicite;
use App\Models\OpportuniteAffaire;
use App\Models\OffreEmploi;
use App\Models\ExchangeRates;
use App\Models\WalletSystem;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BoostService
{
    protected $walletService;
    
    /**
     * Constructeur du service de boost
     * 
     * @param WalletService $walletService
     */
    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    
    /**
     * Boost une publication (publicité, offre d'emploi, opportunité d'affaire)
     * 
     * @param mixed $publication La publication à booster
     * @param int $days Nombre de jours de boost
     * @param float $amount Montant du paiement
     * @param string $currency Devise du paiement
     * @param string $publicationType Type de publication ('publicite', 'offre_emploi', 'opportunite_affaire')
     * @return array Résultat de l'opération
     */
    public function boostPublication($publication, $days, $amount, $currency, $publicationType)
    {
        $user = Auth::user();
        
        try {
            // Vérifier que la publication est approuvée et disponible
            if (!$this->isPublicationBoostable($publication, $publicationType)) {
                return [
                    'success' => false,
                    'message' => 'Cette publication ne peut pas être boostée car elle n\'est pas approuvée ou disponible.',
                    'status_code' => 400
                ];
            }
            
            // Vérifier que l'utilisateur est propriétaire de la publication
            if (!$this->isUserOwner($publication, $user, $publicationType)) {
                return [
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à booster cette publication.',
                    'status_code' => 403
                ];
            }
            
            // Paramètres de paiement
            $paymentMethod = 'solifin-wallet'; // Seule méthode de paiement disponible
            $paymentType = 'wallet';
            $currency = $currency; //
            
            // Calculer le prix du boost
            $boostPrice = $this->calculateBoostPrice($user, $days, $currency);
            
            // Vérifier que le montant est suffisant
            if ($amount < $boostPrice) {
                return [
                    'success' => false,
                    'message' => 'Le montant payé est insuffisant pour couvrir le coût du boost',
                    'status_code' => 400
                ];
            }
            
            // Démarrer une transaction DB
            DB::beginTransaction();
            
            // Vérifier le solde du wallet
            $wallet = $user->wallet;
            if ($currency === 'USD') {
                if (!$wallet || $wallet->balance_usd < $amount) {
                    return [
                        'success' => false,
                        'message' => 'Solde insuffisant dans votre wallet.',
                        'status_code' => 400
                    ];
                }
            }else {
                if (!$wallet || $wallet->balance_cdf < $amount) {
                    return [
                        'success' => false,
                        'message' => 'Solde insuffisant dans votre wallet.',
                        'status_code' => 400
                    ];
                }
            }
            
            // Préparer les métadonnées pour la transaction
            $metadata = $this->prepareBoostMetadata($publication, $publicationType, $days, $amount, $currency, $paymentMethod, $paymentType);
            
            // Débiter le wallet utilisateur
            $this->debitUserWallet($wallet, $amount, $currency, $metadata);
            
            // Enregistrer la transaction dans le wallet system
            $this->updateWalletSystem($user, $amount, $currency, $metadata);
            
            // Mettre à jour la durée d'affichage de la publication
            $this->updatePublicationDuration($publication, $days, $publicationType);
            
            // Valider la transaction
            DB::commit();
            
            // Préparer la réponse
            return [
                'success' => true,
                'message' => $this->getSuccessMessage($publicationType, $days),
                'publication' => $publication,
                'payment_details' => [
                    'amount' => $amount,
                    'fees' => 0,
                    'total' => $amount,
                    'currency' => 'USD'
                ],
                'status_code' => 200
            ];
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Erreur lors du boost de la publication: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return [
                'success' => false,
                'message' => 'Une erreur est survenue lors du boost de la publication: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }
    
    /**
     * Vérifie si une publication peut être boostée
     * 
     * @param mixed $publication
     * @param string $publicationType
     * @return bool
     */
    private function isPublicationBoostable($publication, $publicationType)
    {
        switch ($publicationType) {
            case 'publicite':
                return $publication->statut === 'approuvé' || $publication->statut === 'expiré';
            case 'offre_emploi':
                return $publication->statut === 'approuvé' && $publication->etat === 'disponible';
            case 'opportunite_affaire':
                return $publication->statut === 'approuvé' && $publication->etat === 'disponible';
            default:
                return false;
        }
    }
    
    /**
     * Vérifie si l'utilisateur est propriétaire de la publication
     * 
     * @param mixed $publication
     * @param mixed $user
     * @param string $publicationType
     * @return bool
     */
    private function isUserOwner($publication, $user, $publicationType)
    {
        $page = $publication->page;
        return $page->user_id === $user->id;
    }
    
    /**
     * Calcule le prix du boost en fonction du pack de l'utilisateur
     * 
     * @param mixed $user
     * @param int $days
     * @return float
     */
    private function calculateBoostPrice($user, $days, $currency)
    {
        // Récupérer le paramètre de prix du boost
        $boostPercentage = $user->pack_de_publication->boost_percentage;
        if ($currency === 'CDF') {
            $packPrice = $user->pack_de_publication->price_cdf;
        }else {
            $packPrice = $user->pack_de_publication->price;
        }

        $price = $packPrice * $boostPercentage / 100;
        
        // Valeur par défaut si le paramètre n'est pas défini
        $defaultPrice = 1;
        
        // Si le paramètre existe, utiliser sa valeur, sinon utiliser la valeur par défaut
        $pricePerDay = $price ? $price : $defaultPrice;
        
        return $pricePerDay * $days;
    }
    
    /**
     * Prépare les métadonnées pour la transaction
     * 
     * @param mixed $publication
     * @param string $publicationType
     * @param int $days
     * @param float $amount
     * @param string $currency
     * @param string $paymentMethod
     * @param string $paymentType
     * @return array
     */
    private function prepareBoostMetadata($publication, $publicationType, $days, $amount, $currency, $paymentMethod, $paymentType)
    {
        $publicationTypeLabel = $this->getPublicationTypeLabel($publicationType);
        
        return [
            'Opération' => "Boost de publication",
            'Titre de la publication' => $publication->titre,
            'Type de publication' => $publicationTypeLabel,
            'Type de paiement' => $paymentType,
            'Méthode de paiement' => $paymentMethod,
            'Durée' => $days . " jours",
            'Montant' => $amount . ($currency === "USD" ? "$" : "FC"),
            'Devise' => $currency,
            'Description' => "Vous avez booster votre " . $publicationTypeLabel . " titrée " . $publication->titre . " pour " . $days . " jours"
        ];
    }
    
    /**
     * Débite le wallet de l'utilisateur
     * 
     * @param mixed $wallet
     * @param float $amount
     * @param string $currency
     * @param array $metadata
     * @return void
     */
    private function debitUserWallet($wallet, $amount, $currency, $metadata)
    {
        // Utiliser la méthode withdrawFunds du modèle Wallet
        $wallet->withdrawFunds($amount, $currency, 'purchase', 'completed', $metadata);
    }
    
    /**
     * Met à jour le wallet system
     * 
     * @param mixed $user
     * @param float $amount
     * @param string $currency
     * @param array $metadata
     * @return void
     */
    private function updateWalletSystem($user, $amount, $currency, $metadata)
    {
        $systemMetadata = array_merge(['user' => $user->name], $metadata);
        
        // Utiliser le service wallet pour enregistrer la transaction système
        $this->walletService->recordSystemTransaction([
            'amount' => $amount,
            'currency' => $currency,
            'mouvment' => 'in',
            'type' => 'boost_sale',
            'status' => 'completed',
            'metadata' => $systemMetadata
        ]);
    }
    
    /**
     * Met à jour la durée d'affichage de la publication
     * 
     * @param mixed $publication
     * @param int $days
     * @param string $publicationType
     * @return void
     */
    private function updatePublicationDuration($publication, $days, $publicationType)
    {
        $publication->duree_affichage = ($publication->duree_affichage ?? 0) + $days;
        $publication->expiry_date = Carbon::parse($publication->expiry_date)->addDays($days);
        $publication->save();
    }
    
    /**
     * Retourne le message de succès en fonction du type de publication
     * 
     * @param string $publicationType
     * @param int $days
     * @return string
     */
    private function getSuccessMessage($publicationType, $days)
    {
        switch ($publicationType) {
            case 'publicite':
                return 'Publicité boostée avec succès pour ' . $days . ' jours supplémentaires.';
            case 'offre_emploi':
                return 'Offre d\'emploi boostée avec succès pour ' . $days . ' jours supplémentaires.';
            case 'opportunite_affaire':
                return 'Opportunité d\'affaire boostée avec succès pour ' . $days . ' jours supplémentaires.';
            default:
                return 'Publication boostée avec succès pour ' . $days . ' jours supplémentaires.';
        }
    }
    
    /**
     * Retourne le libellé du type de publication
     * 
     * @param string $publicationType
     * @return string
     */
    private function getPublicationTypeLabel($publicationType)
    {
        switch ($publicationType) {
            case 'publicite':
                return 'publicité';
            case 'offre_emploi':
                return 'offre d\'emploi';
            case 'opportunite_affaire':
                return 'opportunité d\'affaire';
            default:
                return 'publication';
        }
    }
}
