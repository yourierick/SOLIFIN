<?php

namespace App\Console\Commands;

use App\Models\TicketGagnant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CheckExpiredTicketsGagnants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solifin:check-expired-tickets-gagnants {--notify : Envoyer des notifications aux utilisateurs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifie et marque les tickets gagnants expirés';

    /**
     * Taille du lot pour le traitement des tickets
     *
     * @var int
     */
    protected $chunkSize = 100;

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Démarrage de la vérification des tickets gagnants expirés...');
        
        $startTime = now();
        $totalExpired = 0;
        $totalNotified = 0;
        $totalErrors = 0;
        
        try {
            // Récupérer les tickets non consommés et expirés
            TicketGagnant::where('consomme', false)
                ->where('date_expiration', '<', now())
                ->chunk($this->chunkSize, function ($tickets) use (&$totalExpired, &$totalNotified, &$totalErrors) {
                    $this->info("Traitement d'un lot de " . $tickets->count() . " tickets expirés...");
                    
                    foreach ($tickets as $ticket) {
                        DB::beginTransaction();
                        
                        try {
                            // Récupérer les informations du ticket
                            $userId = $ticket->user_id;
                            $user = User::find($userId);
                            $cadeau = $ticket->cadeau;
                            
                            if (!$user || !$cadeau) {
                                $this->warn("Ticket ID {$ticket->id}: Utilisateur ou cadeau introuvable.");
                                DB::rollBack();
                                continue;
                            }
                            
                            // Enregistrer les métadonnées pour l'historique
                            $metadata = [
                                'Date d\'expiration' => $ticket->date_expiration->format('Y-m-d H:i:s'),
                                'Code de vérification' => $ticket->code_verification,
                                'Cadeau' => $cadeau->nom,
                                'Date d\'expiration dépassée de' => now()->diffForHumans($ticket->date_expiration, true)
                            ];
                            
                            // Notifier l'utilisateur si l'option est activée
                            if ($this->option('notify') && $user) {
                                try {
                                    $user->notify(new \App\Notifications\TicketExpireNotification(
                                        'Ticket expiré',
                                        "Votre ticket pour {$cadeau->nom} a expiré le {$ticket->date_expiration->format('d/m/Y')}.",
                                        $cadeau,
                                        $ticket
                                    ));
                                    
                                    $totalNotified++;
                                    $this->line("Notification envoyée à l'utilisateur ID: {$userId} pour le ticket ID: {$ticket->id}");
                                } catch (\Exception $e) {
                                    $this->error("Erreur lors de l'envoi de la notification pour le ticket ID: {$ticket->id} - {$e->getMessage()}");
                                    Log::error("Erreur lors de l'envoi de la notification d'expiration de ticket: {$e->getMessage()}", [
                                        'ticket_id' => $ticket->id,
                                        'user_id' => $userId,
                                        'exception' => $e->getTraceAsString()
                                    ]);
                                }
                            }
                            
                            // Marquer le ticket comme expiré (on utilise consomme=true pour indiquer qu'il n'est plus utilisable)
                            $ticket->consomme = true;
                            $ticket->date_consommation = now(); // Date de "consommation" = date d'expiration effective
                            $ticket->save();
                            
                            // Journaliser l'expiration
                            Log::info("Ticket gagnant expiré", [
                                'ticket_id' => $ticket->id,
                                'user_id' => $userId,
                                'cadeau_id' => $cadeau->id,
                                'date_expiration' => $ticket->date_expiration->format('Y-m-d H:i:s')
                            ]);
                            
                            DB::commit();
                            $totalExpired++;
                            
                            $this->line("Ticket ID: {$ticket->id} marqué comme expiré.");
                            
                        } catch (\Exception $e) {
                            DB::rollBack();
                            $totalErrors++;
                            
                            $this->error("Erreur lors du traitement du ticket ID: {$ticket->id} - {$e->getMessage()}");
                            Log::error("Erreur lors du traitement d'un ticket gagnant expiré: {$e->getMessage()}", [
                                'ticket_id' => $ticket->id,
                                'exception' => $e->getTraceAsString()
                            ]);
                        }
                    }
                });
            
            $duration = now()->diffInSeconds($startTime);
            $this->info("Traitement terminé en {$duration} secondes.");
            $this->info("Total de tickets expirés: {$totalExpired}");
            
            if ($this->option('notify')) {
                $this->info("Total de notifications envoyées: {$totalNotified}");
            }
            
            if ($totalErrors > 0) {
                $this->warn("Erreurs rencontrées: {$totalErrors}");
            }
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error("Erreur fatale lors du traitement des tickets gagnants expirés: {$e->getMessage()}");
            Log::error("Erreur fatale lors du traitement des tickets gagnants expirés: {$e->getMessage()}", [
                'exception' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }
}
