<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UserJetonEsengo;
use App\Models\UserJetonEsengoHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckExpiredJetonsEsengo extends Command
{
    /**
     * Le nom et la signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'solifin:check-expired-jetons-esengo';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Vérifie et marque les jetons Esengo expirés';

    /**
     * Taille du lot pour le traitement des jetons
     *
     * @var int
     */
    protected $chunkSize = 100;

    public function handle()
    {
        $this->info('Vérification des jetons Esengo expirés...');
        
        try {
            // Compter le nombre total de jetons expirés mais non marqués comme utilisés
            $totalExpiredJetons = UserJetonEsengo::where('is_used', false)
                ->where('date_expiration', '<', Carbon::now())
                ->count();
            
            if ($totalExpiredJetons === 0) {
                $this->info('Aucun jeton Esengo expiré trouvé.');
                return Command::SUCCESS;
            }
            
            $this->info('Nombre de jetons expirés trouvés: ' . $totalExpiredJetons);
            $processedCount = 0;
            
            // Traitement par lots pour éviter les problèmes de mémoire avec de grandes quantités de données
            UserJetonEsengo::where('is_used', false)
                ->where('date_expiration', '<', Carbon::now())
                ->chunk($this->chunkSize, function ($expiredJetons) use (&$processedCount) {
                    DB::beginTransaction();
                    
                    try {
                        foreach ($expiredJetons as $jeton) {
                            // Marquer le jeton comme utilisé
                            $jeton->is_used = true;
                            $jeton->save();
                            
                            // Enregistrer l'expiration dans l'historique avec des métadonnées complètes
                            UserJetonEsengoHistory::logExpiration(
                                $jeton,
                                'Jeton expiré automatiquement par le système',
                                [
                                    'expired_at' => $jeton->date_expiration->format('Y-m-d H:i:s'),
                                    'checked_at' => Carbon::now()->format('Y-m-d H:i:s'),
                                    'code_unique' => $jeton->code_unique,
                                    'type_jeton' => $jeton->type_jeton ?? 'standard',
                                    'valeur' => $jeton->valeur ?? null,
                                    'system_expiration' => true
                                ]
                            );
                            
                            $this->line("Jeton ID: {$jeton->id}, Code: {$jeton->code_unique} marqué comme expiré");
                            $processedCount++;
                        }
                        
                        DB::commit();
                        $this->info("Lot traité: {$expiredJetons->count()} jetons");
                    } catch (\Exception $e) {
                        DB::rollBack();
                        throw $e;
                    }
                });
            
            $this->info("Traitement terminé. $processedCount jetons expirés ont été traités.");
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Erreur lors de la vérification des jetons expirés: ' . $e->getMessage());
            Log::error('Erreur lors de la vérification des jetons expirés: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
