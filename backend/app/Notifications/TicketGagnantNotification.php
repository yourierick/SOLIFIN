<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Cadeau;
use App\Models\TicketGagnant;

class TicketGagnantNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $title;
    protected $message;
    protected $cadeau;
    protected $ticket;

    /**
     * Create a new notification instance.
     *
     * @param string $title Titre de la notification
     * @param string $message Message de la notification
     * @param Cadeau $cadeau Cadeau gagné
     * @param TicketGagnant $ticket Ticket gagnant
     * @return void
     */
    public function __construct($title, $message, Cadeau $cadeau, TicketGagnant $ticket)
    {
        $this->title = $title;
        $this->message = $message;
        $this->cadeau = $cadeau;
        $this->ticket = $ticket;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
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
            'type' => 'info',
            'icon' => 'exclamation-circle',
            'titre' => $this->title,
            'message' => $this->message,
            'link' => '/dashboard/finances',
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
            'titre' => $this->title,
            'message' => $this->message,
            'type' => 'info',
            'icon' => 'exclamation-circle',
            'link' => '/dashboard/finances',
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
        $expirationDate = $this->ticket->date_expiration->format('d/m/Y');
        
        return (new MailMessage)
            ->subject('Félicitations ! Vous avez gagné un cadeau')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line($this->title)
            ->line($this->message)
            ->line('Détails de votre cadeau :')
            ->line('Nom : ' . $this->cadeau->nom)
            ->line('Description : ' . $this->cadeau->description)
            ->line('Valeur : ' . $this->cadeau->valeur . ' $')
            ->line('Code de vérification : ' . $this->ticket->code_verification)
            ->line('Date d\'expiration : ' . $expirationDate)
            ->line('Conservez précieusement ce code pour récupérer votre cadeau !')
            ->action('Voir mes finances', env('FRONTEND_URL') . '/dashboard/finances')
            ->line('Merci d\'utiliser notre application !');
    }
}
