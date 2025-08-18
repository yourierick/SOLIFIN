<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Cadeau;
use App\Models\TicketGagnant;
use App\Models\User;

class TicketConsommeUserNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $ticket;
    protected $cadeau;
    protected $admin;

    /**
     * Create a new notification instance.
     *
     * @param TicketGagnant $ticket Ticket consommé
     * @param Cadeau $cadeau Cadeau remis
     * @param User $admin Administrateur qui a remis le cadeau
     * @return void
     */
    public function __construct(TicketGagnant $ticket, Cadeau $cadeau, User $admin)
    {
        $this->ticket = $ticket;
        $this->cadeau = $cadeau;
        $this->admin = $admin;
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
            'icon' => 'gift',
            'titre' => 'Cadeau remis',
            'message' => "Votre cadeau {$this->cadeau->nom} a été remis avec succès.",
            'link' => '/dashboard/finances',
            'ticket_id' => $this->ticket->id,
            'cadeau_id' => $this->cadeau->id,
            'admin_id' => $this->admin->id,
            'admin_name' => $this->admin->name
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
            'icon' => 'gift',
            'titre' => 'Cadeau remis',
            'message' => "Votre cadeau {$this->cadeau->nom} a été remis avec succès.",
            'link' => '/dashboard/tickets',
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
            ->subject('Votre cadeau a été remis')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Nous vous informons que votre cadeau a été remis avec succès.')
            ->line('Détails de la remise :')
            ->line('Cadeau : ' . $this->cadeau->nom)
            ->line('Valeur : ' . $this->cadeau->valeur . ' €')
            ->line('Remis par : ' . $this->admin->name)
            ->line('Date de remise : ' . now()->format('d/m/Y H:i'))
            ->line('Code du ticket : ' . $this->ticket->code_verification)
            ->action('Voir mes tickets', env('FRONTEND_URL') . '/dashboard/tickets')
            ->line('Merci d\'utiliser notre application !');
    }
}
