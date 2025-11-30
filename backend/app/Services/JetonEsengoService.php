<?php

namespace App\Services;

use App\Models\BonusRates;
use App\Models\Cadeau;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserJetonEsengo;
use App\Models\UserJetonEsengoHistory;
use App\Models\Pack;
use App\Models\UserPack;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service pour gérer l'attribution et l'utilisation des jetons Esengo
 * Ce service s'occupe de vérifier les parrainages des utilisateurs
 * et d'attribuer des jetons Esengo selon les règles configurées pour chaque pack
 */
class JetonEsengoService
{
    /**
     * Constantes pour les statuts de tickets
     */
    const CONSOMME = "consommé";
    const PROGRAMME = "programmé";
    const EXPIRE = "expiré";
    const NON_CONSOMME = "non consommé";
    
    /**
     * Taille des lots pour le traitement des utilisateurs
     */
    const BATCH_SIZE = 100;
    
    /**
     * Longueur du code de vérification des tickets
     */
    const VERIFICATION_CODE_LENGTH = 8;
    
    /**
     * Traite l'attribution hebdomadaire des jetons Esengo
     * Pour chaque utilisateur avec des packs actifs, calcule et attribue les jetons Esengo
     * en fonction du nombre de filleuls parrainés durant la semaine précédente terminée (lundi au dimanche)
     * 
     * Note: On traite TOUJOURS la semaine précédente terminée, jamais la semaine en cours
     * Cela garantit que la semaine est complète avant le traitement
     * 
     * @return array Statistiques sur les jetons attribués
     */
    public function processWeeklyJetons()
    {
        $stats = [
            'users_processed' => 0,
            'jetons_attributed' => 0,
            'errors' => 0
        ];
        
        try {
            // Définir la période hebdomadaire
            list($startDate, $endDate) = $this->getWeeklyDateRange();
            
            // Traiter les utilisateurs par lots pour éviter les problèmes de mémoire
            User::whereHas('packs', function($query) {
                $query->where('user_packs.status', 'active')
                      ->where('user_packs.payment_status', 'completed');
            })
            ->chunk(self::BATCH_SIZE, function($users) use ($startDate, $endDate, &$stats) {
                foreach ($users as $user) {
                    $this->processJetonsForUser($user, $startDate, $endDate, $stats);
                }
            });
            
            return $stats;
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement des jetons Esengo: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return [
                'users_processed' => 0,
                'jetons_attributed' => 0,
                'errors' => 1,
                'error_message' => $e->getMessage()
            ];
        }
    }

    /**
     * Traite l'attribution mensuelle des jetons Esengo (gardé pour compatibilité)
     * Pour chaque utilisateur avec des packs actifs, calcule et attribue les jetons Esengo
     * en fonction du nombre de filleuls parrainés durant le mois
     * 
     * @return array Statistiques sur les jetons attribués
     */
    public function processMonthlyJetons()
    {
        $stats = [
            'users_processed' => 0,
            'jetons_attributed' => 0,
            'errors' => 0
        ];
        
        try {
            // Définir la période mensuelle
            list($startDate, $endDate) = $this->getMonthlyDateRange();
            
            // Traiter les utilisateurs par lots pour éviter les problèmes de mémoire
            User::whereHas('packs', function($query) {
                $query->where('user_packs.status', 'active')
                      ->where('user_packs.payment_status', 'completed');
            })
            ->chunk(self::BATCH_SIZE, function($users) use ($startDate, $endDate, &$stats) {
                foreach ($users as $user) {
                    $this->processJetonsForUser($user, $startDate, $endDate, $stats);
                }
            });
            
            return $stats;
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement des jetons Esengo: " . $e->getMessage());
            Log::error($e->getTraceAsString());
            return [
                'users_processed' => 0,
                'jetons_attributed' => 0,
                'errors' => 1,
                'error_message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Traite les jetons Esengo pour un utilisateur spécifique
     * 
     * @param User $user Utilisateur à traiter
     * @param Carbon $startDate Date de début de la période
     * @param Carbon $endDate Date de fin de la période
     * @param array &$stats Statistiques à mettre à jour
     */
    private function processJetonsForUser($user, $startDate, $endDate, &$stats)
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
                $this->processJetonsForUserPack($user, $userPack, $filleulsCount, $stats);
            }
            
            $stats['users_processed']++;
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement des jetons Esengo pour l'utilisateur {$user->id}: " . $e->getMessage());
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
     * Traite les jetons Esengo pour un pack spécifique d'un utilisateur
     * 
     * @param User $user Utilisateur concerné
     * @param UserPack $userPack Pack de l'utilisateur
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param array &$stats Statistiques à mettre à jour
     */
    private function processJetonsForUserPack($user, $userPack, $filleulsCount, &$stats)
    {
        $pack = Pack::find($userPack->pack_id);
        if (!$pack) {
            return;
        }
        
        // Trouver le taux de bonus applicable pour les jetons Esengo
        $bonusRate = $this->findJetonRateForPack($pack->id);
        
        if (!$bonusRate || $bonusRate->nombre_filleuls <= 0) {
            return;
        }
        
        // Calculer les jetons à attribuer (multiple du seuil)
        $jetonsToAward = $this->calculateJetonsToAward($filleulsCount, $bonusRate);
        
        if ($jetonsToAward <= 0) {
            return;
        }
        
        // Attribuer les jetons Esengo
        $this->attributeJetonEsengo($user, $userPack, $pack, $bonusRate, $jetonsToAward, $filleulsCount, $stats);
    }
    
    /**
     * Calcule le nombre de jetons à attribuer en fonction du nombre de filleuls et du taux
     * 
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param BonusRates $bonusRate Taux de bonus applicable
     * @return int Nombre de jetons à attribuer
     */
    private function calculateJetonsToAward($filleulsCount, $bonusRate)
    {
        if ($filleulsCount < $bonusRate->nombre_filleuls) {
            return 0;
        }
        
        return floor($filleulsCount / $bonusRate->nombre_filleuls) * $bonusRate->points_attribues;
    }
    
    /**
     * Obtient la plage de dates pour la semaine à traiter
     * Traite TOUJOURS la semaine précédente terminée (du lundi au dimanche)
     * Peu importe le jour d'exécution, on attend toujours que la semaine soit finie
     * 
     * @return array Tableau contenant la date de début et la date de fin de la semaine
     */
    private function getWeeklyDateRange()
    {
        $now = Carbon::now();
        
        // On traite TOUJOURS la semaine précédente terminée
        $startDate = $now->copy()->subWeek()->startOfWeek(Carbon::MONDAY);
        $endDate = $now->copy()->subWeek()->endOfWeek(Carbon::SUNDAY);
        
        return [$startDate, $endDate];
    }

    /**
     * Obtient la plage de dates pour le mois en cours
     * 
     * @return array Tableau contenant la date de début et la date de fin du mois
     */
    private function getMonthlyDateRange()
    {
        $now = Carbon::now();
        $startDate = $now->copy()->startOfMonth();
        $endDate = $now->copy()->endOfMonth();
        
        return [$startDate, $endDate];
    }
    
    /**
     * Compte le nombre de filleuls parrainés par un utilisateur durant une période donnée
     * 
     * @param int $userId ID de l'utilisateur
     * @param Carbon $startDate Date de début de la période
     * @param Carbon $endDate Date de fin de la période
     * @return int Nombre de filleuls parrainés durant la période
     */
    private function countReferralsInPeriod($userId, Carbon $startDate, Carbon $endDate)
    {
        return UserPack::where('sponsor_id', $userId)
            ->where('payment_status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->distinct('user_id')
            ->count('user_id');
    }
    
    /**
     * Trouve le taux de jetons Esengo pour un pack
     * 
     * @param int $packId ID du pack
     * @return BonusRates|null Taux de bonus ou null si aucun n'est configuré
     */
    private function findJetonRateForPack($packId)
    {
        return BonusRates::where('pack_id', $packId)
            ->where('frequence', 'weekly')
            ->where('type', BonusRates::TYPE_ESENGO)
            ->first();
    }
    
    /**
     * Récupère la durée d'expiration des jetons Esengo depuis les paramètres
     * 
     * @return int Durée en mois
     */
    private function getJetonExpirationMonths()
    {
        return (int) Setting::getValue('jeton_expiration_months', 3);
    }
    
    /**
     * Attribue les jetons Esengo à un utilisateur
     * 
     * @param User $user Utilisateur concerné
     * @param UserPack $userPack Pack de l'utilisateur
     * @param Pack $pack Pack concerné
     * @param BonusRates $bonusRate Taux de bonus applicable
     * @param int $jetonsToAward Nombre de jetons à attribuer
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @param array &$stats Statistiques à mettre à jour
     * @return void
     */
    private function attributeJetonEsengo($user, $userPack, $pack, $bonusRate, $jetonsToAward, $filleulsCount, &$stats)
    {
        try {
            $description = "Jetons Esengo pour $filleulsCount filleuls parrainés ce mois";
            
            // Métadonnées pour les jetons
            $metadata = [
                'filleuls_count' => $filleulsCount,
                'pack_id' => $pack->id,
                'pack_name' => $pack->name,
                'jetons_per_threshold' => $bonusRate->points_attribues,
                'threshold' => $bonusRate->nombre_filleuls,
                'type' => BonusRates::TYPE_ESENGO
            ];
            
            // Date d'expiration des jetons
            $expirationDate = Carbon::now()->addMonths($this->getJetonExpirationMonths());
            
            // Créer les jetons Esengo pour l'utilisateur
            $jetonsCreated = $this->createJetonsForUser(
                $user,
                $pack->id,
                $jetonsToAward,
                $expirationDate,
                $description,
                $metadata
            );
            
            if ($jetonsCreated > 0) {
                $stats['jetons_attributed'] += $jetonsCreated;
                
                // Envoyer une notification à l'utilisateur
                $this->sendJetonNotification($user, $jetonsToAward, $filleulsCount);
            }
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'attribution des jetons Esengo: " . $e->getMessage());
            $stats['errors']++;
        }
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
    
    /**
     * Envoie une notification à l'utilisateur pour l'informer de l'attribution de jetons
     * 
     * @param User $user Utilisateur à notifier
     * @param int $jetons Nombre de jetons attribués
     * @param int $filleulsCount Nombre de filleuls parrainés
     * @return void
     */
    private function sendJetonNotification($user, $jetons, $filleulsCount)
    {
        try {
            $title = 'Jetons Esengo attribués';
            $message = "Grâce à vos parrainages au courant de ce mois, vous avez gagné $jetons jetons Esengo.";
            
            $user->notify(new \App\Notifications\BonusPointsNotification(
                $title,
                $message,
                $jetons,
                BonusRates::TYPE_ESENGO
            ));
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'envoi de la notification de jetons Esengo: " . $e->getMessage());
        }
    }
    
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
        $expirationDate = now()->addMonths($this->getTicketExpirationMonths());
        $verificationCode = $this->generateVerificationCode();
        
        $ticketGagnant = new \App\Models\TicketGagnant([
            'user_id' => $user->id,
            'cadeau_id' => $cadeau->id,
            'code_jeton' => $jetonCode,
            'date_expiration' => $expirationDate,
            'consomme' => self::NON_CONSOMME,
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
     * Récupère la durée d'expiration des tickets gagnants depuis les paramètres
     * 
     * @return int Durée en mois
     */
    private function getTicketExpirationMonths()
    {
        return (int) Setting::getValue('ticket_expiration_months', 3);
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
     * @param int $packId ID du pack
     * @return \App\Models\Cadeau|null Cadeau sélectionné ou null si aucun n'est disponible
     */
    private function selectRandomCadeau($packId)
    {
        // Récupérer tous les cadeaux actifs avec du stock disponible
        $cadeaux = Cadeau::where('actif', true)
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
}
