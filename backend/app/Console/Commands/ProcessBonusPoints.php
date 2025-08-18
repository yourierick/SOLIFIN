<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BonusPointsService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Commande pour traiter l'attribution des points bonus
 * Cette commande peut être exécutée manuellement ou via le planificateur Laravel
 * Elle permet de traiter une fréquence spécifique ou toutes les fréquences selon le jour
 */
class ProcessBonusPoints extends Command
{
    /**
     * Le nom et la signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'solifin:process-bonus-points {frequency? : Fréquence spécifique à traiter (monthly)}';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Traite l\'attribution des jetons Esengo (mensuel)';

    /**
     * Le service d'attribution des points bonus.
     *
     * @var \App\Services\BonusPointsService
     */
    protected $bonusPointsService;

    /**
     * Crée une nouvelle instance de commande.
     *
     * @param \App\Services\BonusPointsService $bonusPointsService
     * @return void
     */
    public function __construct(BonusPointsService $bonusPointsService)
    {
        parent::__construct();
        $this->bonusPointsService = $bonusPointsService;
    }

    /**
     * Exécute la commande console.
     *
     * @return int
     */
    public function handle()
    {
        $frequency = $this->argument('frequency');
        
        $this->info('Début du traitement des points bonus...');
        
        try {
            if ($frequency) {
                // Vérifier que la fréquence est valide
                if ($frequency !== 'monthly') {
                    $this->error("Fréquence invalide: $frequency. Utilisez monthly pour les jetons Esengo.");
                    return Command::FAILURE;
                }
                
                $this->info("Traitement des jetons Esengo (mensuel)");
                $stats = $this->bonusPointsService->processBonusPointsByFrequency($frequency);
            } else {
                // Traiter uniquement les jetons Esengo si on est le premier jour du mois
                $today = Carbon::now();
                
                if ($today->day === 1) {
                    $this->info("Traitement des jetons Esengo (mensuel)");
                    $stats = $this->bonusPointsService->processBonusPointsByFrequency('monthly');
                } else {
                    $this->info("Aucun traitement prévu aujourd'hui. Les jetons Esengo sont traités le 1er de chaque mois.");
                    $stats = ['users_processed' => 0, 'points_attributed' => 0, 'errors' => 0];
                }
            }
            
            $this->info("Traitement terminé. {$stats['users_processed']} utilisateurs traités, {$stats['points_attributed']} points attribués, {$stats['errors']} erreurs.");
            
            if ($stats['errors'] > 0) {
                return Command::FAILURE;
            }
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Erreur lors du traitement des points bonus: ' . $e->getMessage());
            Log::error('Erreur lors du traitement des points bonus: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
