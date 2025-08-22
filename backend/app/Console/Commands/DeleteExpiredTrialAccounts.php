<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Setting;
use App\Services\RegistrationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DeleteExpiredTrialAccounts extends Command
{
    /**
     * La signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'users:delete-expired-trials';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Supprime les comptes utilisateurs en période d\'essai expirée';

    /**
     * Taille du lot pour le traitement des utilisateurs
     *
     * @var int
     */
    protected $chunkSize = 100;

    /**
     * Exécute la commande console.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Vérification des comptes utilisateurs en période d\'essai expirée...');

        try {
            // Récupérer la durée de la période d'essai depuis les paramètres
            $trialDurationDays = (int) Setting::getValue('essai_duration_days', 10);
            $this->info("Durée de la période d'essai configurée: {$trialDurationDays} jours");

            // Calculer la date limite pour les comptes en essai
            $cutoffDate = Carbon::now()->subDays($trialDurationDays);
            $this->info("Date limite pour les comptes en essai: {$cutoffDate->format('Y-m-d H:i:s')}");

            $processedCount = 0;
            $deletedCount = 0;

            // Récupérer tous les comptes en essai créés avant la date limite
            User::where('status', RegistrationService::STATUS_TRIAL)
                ->where('created_at', '<', $cutoffDate)
                ->chunk($this->chunkSize, function ($expiredTrialUsers) use (&$processedCount, &$deletedCount) {
                    DB::beginTransaction();
                    try {
                        foreach ($expiredTrialUsers as $user) {
                            $this->line("Suppression du compte utilisateur ID: {$user->id}, Email: {$user->email}, Créé le: {$user->created_at}");
                            
                            // Supprimer l'utilisateur et toutes ses données associées
                            $user->delete();
                            
                            $processedCount++;
                            $deletedCount++;
                        }
                        
                        DB::commit();
                        $this->info("Lot traité: {$expiredTrialUsers->count()} comptes");
                    } catch (\Exception $e) {
                        DB::rollBack();
                        $this->error("Erreur lors du traitement du lot: {$e->getMessage()}");
                        Log::error('Erreur lors de la suppression des comptes en essai: ' . $e->getMessage());
                        Log::error($e->getTraceAsString());
                    }
                });

            $this->info("Nombre de comptes traités: {$processedCount}");
            $this->info("Nombre de comptes supprimés: {$deletedCount}");
            
            return Command::SUCCESS;

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression des comptes en essai: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            $this->error('Une erreur est survenue lors de la suppression des comptes en essai');
            return Command::FAILURE;
        }
    }
}
