<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\JetonEsengoService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Commande pour traiter l'attribution des jetons Esengo
 * Cette commande peut être exécutée manuellement ou via le planificateur Laravel
 * Elle traite l'attribution mensuelle des jetons Esengo
 */
class ProcessJetonEsengo extends Command
{
    /**
     * Le nom et la signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'solifin:process-jeton-esengo';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Traite l\'attribution mensuelle des jetons Esengo';

    /**
     * Le service d'attribution des jetons Esengo.
     *
     * @var \App\Services\JetonEsengoService
     */
    protected $jetonEsengoService;

    /**
     * Crée une nouvelle instance de commande.
     *
     * @param \App\Services\JetonEsengoService $jetonEsengoService
     * @return void
     */
    public function __construct(JetonEsengoService $jetonEsengoService)
    {
        parent::__construct();
        $this->jetonEsengoService = $jetonEsengoService;
    }

    /**
     * Exécute la commande console.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Début du traitement des jetons Esengo...');
        
        try {
            // Traiter l'attribution hebdomadaire des jetons Esengo
            $stats = $this->jetonEsengoService->processWeeklyJetons();
            
            $this->info("Traitement terminé. {$stats['users_processed']} utilisateurs traités, {$stats['jetons_attributed']} jetons attribués, {$stats['errors']} erreurs.");
            
            if ($stats['errors'] > 0) {
                return Command::FAILURE;
            }
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Erreur lors du traitement des jetons Esengo: ' . $e->getMessage());
            Log::error('Erreur lors du traitement des jetons Esengo: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
