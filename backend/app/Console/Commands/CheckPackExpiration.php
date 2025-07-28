<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UserPack;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CheckPackExpiration extends Command
{
    protected $signature = 'packs:check-expiration';
    protected $description = 'Vérifie et met à jour le statut des packs expirés';

    /**
     * Taille du lot pour le traitement des jetons
     *
     * @var int
     */
    protected $chunkSize = 100;

    public function handle()
    {
        $this->info('Vérification des packs expirés...');

        try {
            $processedCount = 0;
            // Récupérer tous les packs actifs qui sont expirés
            UserPack::where('status', 'active')
                ->where('is_admin_pack', false)
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<', Carbon::now())
                ->chunk($this->chunkSize, function ($expiredPacks) use (&$processedCount) {
                    DB::beginTransaction();
                    try {
                        foreach ($expiredPacks as $pack) {
                            // Enregistrer l'expiration
                            $pack->status = "expired";
                            $pack->save();
                            
                            $this->line("Pack ID: {$pack->id} marqué comme expiré");
                            $processedCount++;
                        }
                        
                        DB::commit();
                        $this->info("Lot traité: {$expiredPacks->count()} packs");
                    } catch (\Exception $e) {
                        DB::rollBack();
                        throw $e;
                    }
                });

            $this->info("Nombre de packs expirés mis à jour : " . $processedCount);
            return Command::SUCCESS;

        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification des packs expirés: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            $this->error('Une erreur est survenue lors de la vérification des packs expirés');
            return Command::FAILURE;
        }
    }
}
