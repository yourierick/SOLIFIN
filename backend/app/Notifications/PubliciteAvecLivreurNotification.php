<?php

namespace App\Notifications;

use App\Models\Publicite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PubliciteAvecLivreurNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * La publicité qui a besoin de livreurs.
     *
     * @var \App\Models\Publicite
     */
    protected $publicite;

    /**
     * Create a new notification instance.
     *
     * @param  \App\Models\Publicite  $publicite
     * @return void
     */
    public function __construct(Publicite $publicite)
    {
        $this->publicite = $publicite;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Nouvelle publicité avec besoin de livreurs')
                    ->greeting('Bonjour ' . $notifiable->name . '!')
                    ->line('Une nouvelle publicité nécessitant des livreurs a été publiée.')
                    ->line('Titre: ' . $this->publicite->titre)
                    ->line('Vous pouvez contacter le propriétaire via les coordonnées de la publicité si vous êtes intéressé.')
                    ->action('Voir la publicité', env('FRONTEND_URL') . '/dashboard/pages/' . $this->publicite->page_id)
                    ->line('Merci d\'utiliser SOLIFIN!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'info',
            'icon' => 'exclamation-circle',
            'link' => '/dashboard/pages/' . $this->publicite->page_id,
            'titre' => 'Une nouvelle publicité avec besoin de livreurs',
            'message' => 'Une nouvelle publicité nécessitant des livreurs a été publiée: ' . $this->publicite->titre,
        ];
    }
}
