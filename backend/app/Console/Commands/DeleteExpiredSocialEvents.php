<?php

namespace App\Console\Commands;

use App\Models\SocialEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DeleteExpiredSocialEvents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:delete-expired-social-events {--hours=24 : Nombre d\'heures après lesquelles les statuts sont considérés comme expirés}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete social events that are older than 24 hours';
    
    /**
     * Taille du lot pour le traitement des événements sociaux
     *
     * @var int
     */
    protected $chunkSize = 50;

    /**
     * Execute the console command.
     * 
     * @return int
     */
    public function handle()
    {
        $this->info('Starting to delete expired social events...');
        
        $hours = $this->option('hours');
        $this->info("Looking for social events older than {$hours} hours");
        
        $startTime = now();
        $totalDeleted = 0;
        $totalErrors = 0;
        
        try {
            // Traitement par lots des statuts sociaux expirés
            SocialEvent::where('statut', 'approuvé')
                ->where('created_at', '<', now()->subHours($hours))
                ->chunk($this->chunkSize, function ($events) use (&$totalDeleted, &$totalErrors) {
                    $this->info("Processing batch of {$events->count()} events...");
                    
                    foreach ($events as $event) {
                        DB::beginTransaction();
                        
                        try {
                            // Supprimer les fichiers associés (images, vidéos)
                            if ($event->image) {
                                Storage::disk('public')->delete($event->image);
                            }
                            
                            if ($event->video) {
                                Storage::disk('public')->delete($event->video);
                            }
                            
                            // Supprimer les signalements associés
                            $event->reports()->delete();
                            
                            // Supprimer le statut social
                            $event->delete();
                            
                            DB::commit();
                            $totalDeleted++;
                            
                            $this->line("Deleted social event ID: {$event->id}");
                        } catch (\Exception $e) {
                            DB::rollBack();
                            $totalErrors++;
                            
                            $this->error("Error deleting social event ID: {$event->id} - {$e->getMessage()}");
                            Log::error("Error deleting social event: {$e->getMessage()}", [
                                'event_id' => $event->id,
                                'exception' => $e->getTraceAsString(),
                            ]);
                        }
                    }
                });
                
            $duration = now()->diffInSeconds($startTime);
            $this->info("Finished deleting expired social events in {$duration} seconds.");
            $this->info("Total deleted: {$totalDeleted}, Total errors: {$totalErrors}");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Fatal error during batch processing: {$e->getMessage()}");
            Log::error("Fatal error during batch processing of expired social events: {$e->getMessage()}", [
                'exception' => $e->getTraceAsString(),
            ]);
            
            return Command::FAILURE;
        }
    }
}
