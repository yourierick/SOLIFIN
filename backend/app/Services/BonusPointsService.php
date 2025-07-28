<?php

namespace App\Services;

use App\Models\BonusRates;
use App\Models\Cadeau;
use App\Models\User;
use App\Models\UserBonusPoint;
use App\Models\UserBonusPointHistory;
use App\Models\UserJetonEsengo;
use App\Models\UserJetonEsengoHistory;
use App\Models\Pack;
use App\Models\UserPack;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service pour gérer l'attribution et le calcul des points bonus
 * Ce service s'occupe de vérifier les parrainages des utilisateurs
 * et d'attribuer des points selon les règles configurées pour chaque pack
 */
class BonusPointsService
{

    
    /**
     * Constantes pour les types de fréquences
     */
    const FREQUENCY_DAILY = 'daily';
    const FREQUENCY_WEEKLY = 'weekly';
    const FREQUENCY_MONTHLY = 'monthly';
    const FREQUENCY_YEARLY = 'yearly';
    
    /**
     * Taille des lots pour le traitement des utilisateurs
     */
    const BATCH_SIZE = 100;
    
    /**
     * Traite l'attribution des points bonus pour une fréquence spécifique
     * Pour chaque utilisateur avec des packs actifs, calcule et attribue les points bonus
     * en fonction du nombre de filleuls parrainés durant la période et du type de bonus
     * 
     * @param string $frequency Fréquence à traiter (daily, weekly, monthly, yearly)
     * @return array Statistiques sur les points attribués
     */
    public function processBonusPointsByFrequency($frequency)
    {
        $stats = [
            'users_processed' => 0,
            'points_attributed' => 0,
            'errors' => 0
        ];
        
        try {
            // Définir la période selon la fréquence
            list($startDate, $endDate) = $this->getDateRangeForFrequency($frequency);
            
            // Déterminer le type de bonus à traiter selon la fréquence
            $bonusType = $this->getBonusTypeForFrequency($frequency);
            
            // Si aucun type de bonus ne correspond à cette fréquence, terminer
            if (!$bonusType) {
                Log::info("Aucun type de bonus configuré pour la fréquence: $frequency");
                return $stats;
            }
            
            // Traiter les utilisateurs par lots pour éviter les problèmes de mémoire
            User::whereHas('packs', function($query) {
                $query->where('user_packs.status', 'active')
                      ->where('user_packs.payment_status', 'completed');
            })
            ->chunk(self::BATCH_SIZE, function($users) use ($startDate, $endDate, $frequency, $bonusType, &$stats) {
                foreach ($users as $user) {
                    $this->processBonusForUser($user, $startDate, $endDate, $frequency, $bonusType, $stats);
                }
            });
            
            return $stats;
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement des points bonus pour la fréquence $frequency: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return [
                'users_processed' => 0,
                'points_attributed' => 0,
                'errors' => 1,
                'error_message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Détermine le type de bonus à traiter selon la fréquence
     * 
     * @param string $frequency Fréquence (daily, weekly, monthly, yearly)
     * @return string|null Type de bonus ou null si aucun ne correspond
     */
    private function getBonusTypeForFrequency($frequency)
    {
        switch ($frequency) {
            case self::FREQUENCY_WEEKLY:
                return BonusRates::TYPE_DELAIS; // Bonus sur délais (hebdomadaire)
            case self::FREQUENCY_MONTHLY:
                return BonusRates::TYPE_ESENGO; // Jeton Esengo (mensuel)
            default:
                return null;
        }
    }
    
    /**
     * Traite les bonus pour un utilisateur spécifique
     * 
     * @param User $user Utilisateur à traiter
     * @param Carbon $startDate Date de début de la période
     * @param Carbon $endDate Date de fin de la période
     * @param string $frequency Fréquence du bonus
     * @param string $bonusType Type de bonus
     * @param array &$stats Statistiques à mettre à jour
     */
    private function processBonusForUser($user, $startDate, $endDate, $frequency, $bonusType, &$stats)
    {
        try {
            // Compter les filleuls parrainés durant la période
            $filleulsCount = $this->countReferralsInPeriod($user->id, $startDate, $endDate);
            
            // Si l'utilisateur n'a pas de filleuls pour cette période, terminer
            if ($filleulsCount <= 0) {
                return;
            }
            
            // Récupérer tous les packs actifs de l'utilisateur
            $userPacks = $this->getActiveUserPacks($user->id);
            
            // Pour chaque pack actif de l'utilisateur
            foreach ($userPacks as $userPack) {
                $this->processBonusForUserPack($user, $userPack, $filleulsCount, $frequency, $bonusType, $stats);
            }
            
            $stats['users_processed']++;
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement des points bonus pour l'utilisateur {$user->id}: " . $e->getMessage());
            $stats['errors']++;
        }
    }
    
    /**
     * Récupère tous les packs actifs d'un utilisateur
     * 
     * @param int $userId ID de l'utilisateur
     * @return \Illuminate\Database\Eloquent\Collection Collection de UserPack
     */
    private function getActiveUserPacks($userId)
    {
        return UserPack::where('user_id', $userId)
            ->where('status', 'active')
            ->where('payment_status', 'completed')
            ->get();
    }
    
    /**
     * Traite les bonus pour un pack spécifique d'un utilisateur
     * 
     * @param User $user Utilisateur concerné
     * @param UserPack $userPack Pack de l'utilisateur
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param string $frequency Fréquence du bonus
     * @param string $bonusType Type de bonus
     * @param array &$stats Statistiques à mettre à jour
     */
    private function processBonusForUserPack($user, $userPack, $filleulsCount, $frequency, $bonusType, &$stats)
    {
        $pack = Pack::find($userPack->pack_id);
        if (!$pack) {
            return;
        }
        
        // Trouver le taux de bonus applicable
        $bonusRate = $this->findBonusRateForPack($pack->id, $frequency, $bonusType);
        
        if (!$bonusRate || $bonusRate->nombre_filleuls <= 0) {
            return;
        }
        
        // Calculer les points à attribuer (multiple du seuil)
        $pointsToAward = $this->calculatePointsToAward($filleulsCount, $bonusRate);
        
        if ($pointsToAward <= 0) {
            return;
        }
        
        // Traitement différent selon le type de bonus
        if ($bonusType === BonusRates::TYPE_DELAIS) {
            // Bonus sur délais (points standard)
            $this->processBonusSurDelais($user, $userPack, $pack, $bonusRate, $pointsToAward, $filleulsCount, $frequency, $stats);
        } else if ($bonusType === BonusRates::TYPE_ESENGO) {
            // Jetons Esengo (codes uniques)
            $this->processJetonEsengo($user, $userPack, $pack, $bonusRate, $pointsToAward, $filleulsCount, $frequency, $stats);
        }
    }
    
    /**
     * Calcule le nombre de points à attribuer en fonction du nombre de filleuls et du taux de bonus
     * 
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param BonusRates $bonusRate Taux de bonus applicable
     * @return int Nombre de points à attribuer
     */
    private function calculatePointsToAward($filleulsCount, $bonusRate)
    {
        if ($filleulsCount < $bonusRate->nombre_filleuls) {
            return 0;
        }
        
        return floor($filleulsCount / $bonusRate->nombre_filleuls) * $bonusRate->points_attribues;
    }
    
    /**
     * Obtient la plage de dates pour une fréquence donnée
     * Calcule les dates de début et de fin pour la période correspondant à la fréquence
     * 
     * @param string $frequency Fréquence (daily, weekly, monthly, yearly)
     * @return array Tableau contenant la date de début et la date de fin
     */
    private function getDateRangeForFrequency($frequency)
    {
        $now = Carbon::now();
        $startDate = null;
        $endDate = null;
        
        switch ($frequency) {
            case 'daily':
                // Aujourd'hui (de minuit à 23:59:59)
                $startDate = $now->copy()->startOfDay();
                $endDate = $now->copy()->endOfDay();
                break;
                
            case 'weekly':
                // Cette semaine (du lundi au dimanche)
                $startDate = $now->copy()->startOfWeek();
                $endDate = $now->copy()->endOfWeek();
                break;
                
            case 'monthly':
                // Ce mois (du 1er au dernier jour du mois)
                $startDate = $now->copy()->startOfMonth();
                $endDate = $now->copy()->endOfMonth();
                break;
                
            case 'yearly':
                // Cette année (du 1er janvier au 31 décembre)
                $startDate = $now->copy()->startOfYear();
                $endDate = $now->copy()->endOfYear();
                break;
                
            default:
                throw new \InvalidArgumentException("Fréquence non reconnue: $frequency");
        }
        
        return [$startDate, $endDate];
    }
    
    /**
     * Génère une description pour l'attribution des points selon la fréquence
     * 
     * @param string $frequency Fréquence (daily, weekly, monthly, yearly)
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @return string Description
     */
    private function getDescriptionForFrequency($frequency, $filleulsCount)
    {
        $periodText = '';
        
        switch ($frequency) {
            case 'daily':
                $periodText = "journalier";
                break;
            case 'weekly':
                $periodText = "hebdomadaire";
                break;
            case 'monthly':
                $periodText = "mensuel";
                break;
            case 'yearly':
                $periodText = "annuel";
                break;
            default:
                $periodText = $frequency;
        }
        
        return "Bonus $periodText pour $filleulsCount filleuls parrainés";
    }
    
    /**
     * Compte le nombre de filleuls parrainés par un utilisateur durant une période donnée
     * Utilise la table user_packs pour compter les utilisateurs uniques parrainés
     * 
     * @param int $userId ID de l'utilisateur
     * @param Carbon $startDate Date de début de la période
     * @param Carbon $endDate Date de fin de la période
     * @return int Nombre de filleuls parrainés durant la période
     */
    private function countReferralsInPeriod($userId, Carbon $startDate, Carbon $endDate)
    {
        // Compter les utilisateurs uniques parrainés via user_packs
        return UserPack::where('sponsor_id', $userId)
            ->where('payment_status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->distinct('user_id')
            ->count('user_id');
    }
    
    /**
     * Trouve le taux de bonus pour un pack et une fréquence donnés
     * 
     * @param int $packId ID du pack
     * @param string $frequency Fréquence (daily, weekly, monthly, yearly)
     * @param string|null $type Type de bonus (delais ou esengo)
     * @return BonusRates|null Taux de bonus ou null si aucun n'est configuré
     */
    private function findBonusRateForPack($packId, $frequency, $type = null)
    {
        $query = BonusRates::where('pack_id', $packId)
            ->where('frequence', $frequency);
            
        if ($type) {
            $query->where('type', $type);
        }
        
        return $query->first();
    }
    
    /**
     * Convertit des points en devise pour un utilisateur
     * Vérifie les conditions nécessaires et effectue la conversion
     * 
     * @param int $userId ID de l'utilisateur
     * @param int $packId ID du pack
     * @param int $points Nombre de points à convertir
     * @return array Résultat de la conversion
     */
    public function convertPointsToWallet($userId, $packId, $points)
    {
        try {
            // Valider les paramètres
            if (!$userId || !$packId || $points <= 0) {
                return [
                    'success' => false,
                    'message' => 'Paramètres invalides pour la conversion'
                ];
            }
            
            // Récupérer l'utilisateur
            $user = User::find($userId);
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ];
            }
            
            // Vérifier que le pack existe et est actif pour l'utilisateur
            $userPack = UserPack::where('user_id', $user->id)
                ->where('pack_id', $packId)
                ->where('status', 'active')
                ->where('payment_status', 'completed')
                ->first();
                
            if (!$userPack) {
                return [
                    'success' => false,
                    'message' => 'Pack non trouvé ou inactif pour cet utilisateur'
                ];
            }
            
            // Récupérer le taux de bonus pour obtenir la valeur du point
            // On utilise la fréquence hebdomadaire par défaut pour la valeur du point
            $bonusRate = $this->findBonusRateForPack($packId, 'weekly');
            if (!$bonusRate || $bonusRate->valeur_point <= 0) {
                return [
                    'success' => false,
                    'message' => 'La valeur d\'un point n\'est pas configurée pour ce pack'
                ];
            }
            
            // Récupérer les points de l'utilisateur pour ce pack spécifique
            $userPoints = UserBonusPoint::getOrCreate($userId, $packId);
            
            if ($points > $userPoints->points_disponibles) {
                return [
                    'success' => false,
                    'message' => 'Nombre de points insuffisant'
                ];
            }
            
            // Convertir les points en devise
            $amount = $userPoints->convertPointsToWallet($points);
            
            if ($amount === false) {
                return [
                    'success' => false,
                    'message' => 'Erreur lors de la conversion des points'
                ];
            }
            
            return [
                'success' => true,
                'message' => "Conversion réussie de $points points en $amount devise",
                'amount' => $amount,
                'points_converted' => $points,
                'remaining_points' => $userPoints->points_disponibles
            ];
        } catch (\Exception $e) {
            Log::error("Erreur lors de la conversion des points: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Une erreur est survenue lors de la conversion des points'
            ];
        }
    }
    
    /**
     * Traite l'attribution des points bonus sur délais (hebdomadaire)
     * 
     * @param User $user Utilisateur concerné
     * @param UserPack $userPack Pack de l'utilisateur
     * @param Pack $pack Pack concerné
     * @param BonusRates $bonusRate Taux de bonus applicable
     * @param int $pointsToAward Nombre de points à attribuer
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param string $frequency Fréquence du bonus
     * @param array &$stats Statistiques à mettre à jour
     * @return void
     */
    private function processBonusSurDelais($user, $userPack, $pack, $bonusRate, $pointsToAward, $filleulsCount, $frequency, &$stats)
    {
        try {
            // Préparer la description et les métadonnées
            $description = $this->getDescriptionForFrequency($frequency, $filleulsCount);
            $metadata = $this->prepareBonusMetadata($frequency, $filleulsCount, $pack, $bonusRate, BonusRates::TYPE_DELAIS);
            
            // Attribuer les points
            $pointsAdded = $this->awardPointsToUser(
                $user->id,
                $userPack->pack_id,
                $pointsToAward,
                $pack->id,
                $description,
                $metadata
            );
            
            if ($pointsAdded) {
                $stats['points_attributed'] += $pointsToAward;
                
                // Envoyer une notification à l'utilisateur
                $this->sendBonusNotification(
                    $user,
                    $pointsToAward,
                    BonusRates::TYPE_DELAIS,
                    $filleulsCount
                );
            }
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'attribution des points bonus sur délais: " . $e->getMessage());
            $stats['errors']++;
        }
    }
    
    /**
     * Prépare les métadonnées pour les bonus
     * 
     * @param string $frequency Fréquence du bonus
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param Pack $pack Pack concerné
     * @param BonusRates $bonusRate Taux de bonus applicable
     * @param string $type Type de bonus (delais ou esengo)
     * @return array Métadonnées formatées
     */
    private function prepareBonusMetadata($frequency, $filleulsCount, $pack, $bonusRate, $type)
    {
        return [
            'frequency' => $frequency,
            'filleuls_count' => $filleulsCount,
            'pack_id' => $pack->id,
            'pack_name' => $pack->name,
            'points_per_threshold' => $bonusRate->points_attribues,
            'threshold' => $bonusRate->nombre_filleuls,
            'type' => $type
        ];
    }
    
    /**
     * Attribue des points à un utilisateur
     * 
     * @param int $userId ID de l'utilisateur
     * @param int $userPackId ID du pack utilisateur
     * @param int $pointsToAward Nombre de points à attribuer
     * @param int $packId ID du pack
     * @param string $description Description pour l'historique
     * @param array $metadata Métadonnées à associer aux points
     * @return bool True si les points ont été attribués avec succès
     */
    private function awardPointsToUser($userId, $userPackId, $pointsToAward, $packId, $description, $metadata)
    {
        $userPoints = UserBonusPoint::getOrCreate($userId, $userPackId);
        
        return $userPoints->addPoints(
            $pointsToAward,
            $packId,
            $description,
            $metadata
        );
    }
    
    /**
     * Durée d'expiration des jetons Esengo en mois
     */
    const JETON_EXPIRATION_MONTHS = 3;
    
    /**
     * Traite l'attribution des jetons Esengo (mensuel)
     * Génère des codes uniques pour chaque jeton attribué
     * 
     * @param User $user Utilisateur concerné
     * @param UserPack $userPack Pack de l'utilisateur
     * @param Pack $pack Pack concerné
     * @param BonusRates $bonusRate Taux de bonus applicable
     * @param int $pointsToAward Nombre de jetons à attribuer
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param string $frequency Fréquence du bonus
     * @param array &$stats Statistiques à mettre à jour
     * @return void
     */
    private function processJetonEsengo($user, $userPack, $pack, $bonusRate, $pointsToAward, $filleulsCount, $frequency, &$stats)
    {
        try {
            // Attribuer les jetons Esengo
            $description = "Jetons Esengo pour $filleulsCount filleuls parrainés ce mois";
            
            // Métadonnées communes pour tous les jetons
            $commonMetadata = $this->prepareJetonMetadata($frequency, $filleulsCount, $pack, $bonusRate);
            
            // Date d'expiration des jetons
            $expirationDate = Carbon::now()->addMonths(self::JETON_EXPIRATION_MONTHS);
            
            // Créer les jetons Esengo pour l'utilisateur
            $jetonsCreated = $this->createJetonsForUser(
                $user,
                $pack->id,
                $pointsToAward,
                $expirationDate,
                $description,
                $commonMetadata
            );
            
            if ($jetonsCreated > 0) {
                $stats['points_attributed'] += $jetonsCreated;
                
                // Envoyer une notification à l'utilisateur
                $this->sendBonusNotification(
                    $user,
                    $pointsToAward,
                    BonusRates::TYPE_ESENGO,
                    $filleulsCount
                );
            }
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'attribution des jetons Esengo: " . $e->getMessage());
            $stats['errors']++;
        }
    }
    
    /**
     * Prépare les métadonnées pour les jetons Esengo
     * 
     * @param string $frequency Fréquence du bonus
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param Pack $pack Pack concerné
     * @param BonusRates $bonusRate Taux de bonus applicable
     * @return array Métadonnées formatées
     */
    private function prepareJetonMetadata($frequency, $filleulsCount, $pack, $bonusRate)
    {
        return $this->prepareBonusMetadata($frequency, $filleulsCount, $pack, $bonusRate, BonusRates::TYPE_ESENGO);
    }
    
    /**
     * Crée les jetons Esengo pour un utilisateur
     * 
     * @param User $user Utilisateur concerné
     * @param int $packId ID du pack
     * @param int $count Nombre de jetons à créer
     * @param Carbon $expirationDate Date d'expiration des jetons
     * @param string $description Description pour l'historique
     * @param array $metadata Métadonnées à associer aux jetons
     * @return int Nombre de jetons créés
     */
    private function createJetonsForUser($user, $packId, $count, $expirationDate, $description, $metadata)
    {
        $jetonsCreated = 0;
        
        for ($i = 0; $i < $count; $i++) {
            // Générer un code unique pour le jeton
            $codeUnique = UserJetonEsengo::generateUniqueCode($user->id);
            
            // Créer le jeton dans la base de données
            $jeton = UserJetonEsengo::create([
                'user_id' => $user->id,
                'pack_id' => $packId,
                'code_unique' => $codeUnique,
                'is_used' => false,
                'date_expiration' => $expirationDate,
                'metadata' => $metadata,
            ]);
            
            // Enregistrer l'attribution dans l'historique
            UserJetonEsengoHistory::logAttribution(
                $jeton,
                $description,
                $metadata
            );
            
            $jetonsCreated++;
        }
        
        return $jetonsCreated;
    }
    
    // La méthode generateUniqueJetonCode a été remplacée par UserJetonEsengo::generateUniqueCode
    
    /**
     * Durée d'expiration des tickets gagnants en mois
     */
    const TICKET_EXPIRATION_MONTHS = 3;
    
    /**
     * Longueur du code de vérification des tickets
     */
    const VERIFICATION_CODE_LENGTH = 8;
    
    /**
     * Utilise un jeton Esengo pour générer un ticket gagnant
     * 
     * @param int $userId ID de l'utilisateur
     * @param string $jetonCode Code du jeton à utiliser
     * @return array Résultat de l'opération avec le cadeau gagné
     */
    public function useJetonEsengo($userId, $jetonCode)
    {
        try {
            // Vérifier que l'utilisateur existe et que le jeton est valide
            $validationResult = $this->validateJetonEsengo($userId, $jetonCode);
            if (!$validationResult['success']) {
                return $validationResult;
            }
            
            $user = $validationResult['user'];
            $jeton = $validationResult['jeton'];
            $packId = $jeton->pack_id;
            
            // Sélectionner un cadeau aléatoirement en fonction des probabilités
            $cadeau = $this->selectRandomCadeau($packId);
            if (!$cadeau) {
                return [
                    'success' => false,
                    'message' => 'Aucun cadeau disponible'
                ];
            }
            
            // Créer et enregistrer le ticket gagnant
            return $this->createTicketGagnant($user, $jeton, $cadeau, $jetonCode);
            
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'utilisation d'un jeton Esengo: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Une erreur est survenue lors de l'utilisation du jeton."
            ];
        }
    }
    
    /**
     * Valide un jeton Esengo pour utilisation
     * 
     * @param int $userId ID de l'utilisateur
     * @param string $jetonCode Code du jeton à valider
     * @return array Résultat de la validation avec l'utilisateur et le jeton si succès
     */
    private function validateJetonEsengo($userId, $jetonCode)
    {
        // Vérifier que l'utilisateur existe
        try {
            $user = User::findOrFail($userId);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Utilisateur introuvable'
            ];
        }
        
        // Vérifier que le jeton existe et qu'il appartient à l'utilisateur
        $jeton = UserJetonEsengo::where('user_id', $userId)
            ->where('code_unique', $jetonCode)
            ->where('is_used', false)
            ->first();
            
        if (!$jeton) {
            return [
                'success' => false,
                'message' => 'Jeton introuvable ou déjà utilisé'
            ];
        }
        
        // Vérifier si le jeton est expiré
        if ($jeton->isExpired()) {
            // Enregistrer l'expiration dans l'historique
            UserJetonEsengoHistory::logExpiration(
                $jeton,
                'Jeton expiré lors d\'une tentative d\'utilisation',
                ['Date d\'expiration' => $jeton->date_expiration->format('Y-m-d H:i:s')]
            );
            
            return [
                'success' => false,
                'message' => 'Ce jeton est expiré'
            ];
        }
        
        return [
            'success' => true,
            'user' => $user,
            'jeton' => $jeton
        ];
    }
    
    /**
     * Crée et enregistre un ticket gagnant
     * 
     * @param User $user Utilisateur concerné
     * @param UserJetonEsengo $jeton Jeton utilisé
     * @param Cadeau $cadeau Cadeau gagné
     * @param string $jetonCode Code du jeton
     * @return array Résultat de l'opération
     */
    private function createTicketGagnant($user, $jeton, $cadeau, $jetonCode)
    {
        // Générer un ticket gagnant
        $expirationDate = now()->addMonths(self::TICKET_EXPIRATION_MONTHS);
        $verificationCode = $this->generateVerificationCode();
        
        $ticketGagnant = new \App\Models\TicketGagnant([
            'user_id' => $user->id,
            'cadeau_id' => $cadeau->id,
            'code_jeton' => $jetonCode,
            'date_expiration' => $expirationDate,
            'consomme' => false,
            'code_verification' => $verificationCode
        ]);
        
        DB::beginTransaction();
        try {
            // Sauvegarder le ticket
            $ticketGagnant->save();
            
            // Marquer le jeton comme utilisé
            $jeton->markAsUsed($cadeau->id);
            
            // Enregistrer l'utilisation dans l'historique
            $this->logJetonUtilisation($jeton, $cadeau, $ticketGagnant, $expirationDate, $verificationCode);
            
            // Envoyer une notification à l'utilisateur
            $this->sendTicketNotification($user, $cadeau, $ticketGagnant, $expirationDate);
            
            DB::commit();
            
            return [
                'success' => true,
                'ticket' => $ticketGagnant,
                'cadeau' => $cadeau
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de l\'utilisation d\'un jeton Esengo: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'attribution du cadeau'
            ];
        }
    }
    
    /**
     * Génère un code de vérification unique pour un ticket gagnant
     * 
     * @return string Code de vérification
     */
    private function generateVerificationCode()
    {
        return strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, self::VERIFICATION_CODE_LENGTH));
    }
    
    /**
     * Enregistre l'utilisation d'un jeton dans l'historique
     * 
     * @param UserJetonEsengo $jeton Jeton utilisé
     * @param Cadeau $cadeau Cadeau gagné
     * @param TicketGagnant $ticketGagnant Ticket généré
     * @param Carbon $expirationDate Date d'expiration du ticket
     * @param string $verificationCode Code de vérification du ticket
     */
    private function logJetonUtilisation($jeton, $cadeau, $ticketGagnant, $expirationDate, $verificationCode)
    {
        UserJetonEsengoHistory::logUtilisation(
            $jeton,
            $cadeau,
            'Jeton utilisé pour obtenir le cadeau: ' . $cadeau->nom,
            [
                'Id ticket gagnant' => $ticketGagnant->id,
                'Code de vérification' => $verificationCode,
                'Date d\'expiration' => $expirationDate->format('Y-m-d H:i:s')
            ]
        );
    }
    
    /**
     * Envoie une notification à l'utilisateur pour l'informer du ticket gagné
     * 
     * @param User $user Utilisateur à notifier
     * @param Cadeau $cadeau Cadeau gagné
     * @param TicketGagnant $ticketGagnant Ticket généré
     * @param Carbon $expirationDate Date d'expiration du ticket
     */
    private function sendTicketNotification($user, $cadeau, $ticketGagnant, $expirationDate)
    {
        $user->notify(new \App\Notifications\TicketGagnantNotification(
            'Félicitations !',
            "Vous avez gagné {$cadeau->nom} ! Utilisez votre ticket avant le {$expirationDate->format('d/m/Y')}.",
            $cadeau,
            $ticketGagnant
        ));
    }
    
    /**
     * Sélectionne un cadeau aléatoirement en fonction des probabilités
     * 
     * @return \App\Models\Cadeau|null Cadeau sélectionné ou null si aucun n'est disponible
     */
    private function selectRandomCadeau($packId)
    {
        // Récupérer tous les cadeaux actifs avec du stock disponible
        $cadeaux = \App\Models\Cadeau::where('actif', true)
            ->where('stock', '>', 0)
            ->where('pack_id', $packId)
            ->get();
            
        if ($cadeaux->isEmpty()) {
            return null;
        }
        
        // Calculer la somme totale des probabilités
        $totalProbability = $cadeaux->sum('probabilite');
        
        if ($totalProbability <= 0) {
            // Si la somme est nulle ou négative, sélectionner un cadeau au hasard avec une probabilité égale
            return $cadeaux->random();
        }
        
        // Générer un nombre aléatoire entre 0 et la somme totale des probabilités
        $randomValue = mt_rand(0, $totalProbability * 100) / 100;
        
        // Sélectionner un cadeau en fonction de sa probabilité
        $cumulativeProbability = 0;
        
        foreach ($cadeaux as $cadeau) {
            $cumulativeProbability += $cadeau->probabilite;
            
            if ($randomValue <= $cumulativeProbability) {
                // Décrémenter le stock du cadeau
                $cadeau->stock -= 1;
                $cadeau->save();
                
                return $cadeau;
            }
        }
        
        // Si aucun cadeau n'a été sélectionné (ne devrait pas arriver), retourner le premier
        $firstCadeau = $cadeaux->first();
        $firstCadeau->stock -= 1;
        $firstCadeau->save();
        
        return $firstCadeau;
    }
    
    // La méthode markJetonAsUsed a été remplacée par la méthode markAsUsed du modèle UserJetonEsengo
    
    /**
     * Envoie une notification à l'utilisateur pour l'informer de l'attribution de bonus
     * 
     * @param User $user Utilisateur à notifier
     * @param int $points Nombre de points/jetons attribués
     * @param string $type Type de bonus (delais ou esengo)
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @return void
     */
    private function sendBonusNotification($user, $points, $type, $filleulsCount)
    {
        try {
            $message = '';
            $title = '';
            
            if ($type === BonusRates::TYPE_DELAIS) {
                $title = 'Bonus sur délais attribué';
                $message = "Grâce à vos parrainages cette semaine, vous avez gagné $points points bonus.";
            } else if ($type === BonusRates::TYPE_ESENGO) {
                $title = 'Jetons Esengo attribués';
                $message = "Grâce à vos parrainages au courant de ce mois, vous avez gagné $points jetons bonus.";
            }
            
            // Créer une notification dans la base de données
            $user->notify(new \App\Notifications\BonusPointsNotification(
                $title,
                $message,
                $points,
                $type
            ));
            
            // La notification toast sera gérée par le frontend lors de la connexion de l'utilisateur
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'envoi de la notification de bonus: " . $e->getMessage());
        }
    }
    

}
