<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Cadeau;
use App\Models\TicketGagnant;

class TicketConsommeAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $ticket;
    protected $cadeau;
    protected $montant;

    /**
     * Create a new notification instance.
     *
     * @param TicketGagnant $ticket Ticket consommé
     * @param Cadeau $cadeau Cadeau remis
     * @param float $montant Montant ajouté au wallet
     * @return void
     */
    public function __construct(TicketGagnant $ticket, Cadeau $cadeau, float $montant)
    {
        $this->ticket = $ticket;
        $this->cadeau = $cadeau;
        $this->montant = $montant;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'type' => 'success',
            'icon' => 'cash',
            'titre' => 'Rémunération reçue',
            'message' => "Vous avez reçu {$this->montant} € pour la remise du cadeau {$this->cadeau->nom}.",
            'link' => '/admin',
            'ticket_id' => $this->ticket->id,
            'cadeau_id' => $this->cadeau->id,
            'montant' => $this->montant
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return BroadcastMessage
     */
    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'type' => 'success',
            'icon' => 'cash',
            'titre' => 'Rémunération reçue',
            'message' => "Vous avez reçu {$this->montant} € pour la remise du cadeau {$this->cadeau->nom}.",
            'link' => '/admin/wallet',
        ]);
    }
    
    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Rémunération pour remise de cadeau')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Vous avez reçu une rémunération pour la remise d\'un cadeau.')
            ->line('Détails de la transaction :')
            ->line('Cadeau remis : ' . $this->cadeau->nom)
            ->line('Montant reçu : ' . $this->montant . ' €')
            ->line('Code du ticket : ' . $this->ticket->code_verification)
            ->line('Date de remise : ' . now()->format('d/m/Y H:i'))
            ->action('Voir mon wallet', env('FRONTEND_URL') . '/admin/wallet')
            ->line('Merci pour votre travail !');
    }
}
