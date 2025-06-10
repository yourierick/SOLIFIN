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
                    ->line('Une nouvelle publicité nécessitant des livreurs a été approuvée.')
                    ->line('Titre: ' . $this->publicite->titre)
                    ->line('Vous pouvez contacter le propriétaire via les coordonnées de la publicité si vous êtes intéressé.')
                    ->action('Voir la publicité', url('/publicites/' . $this->publicite->id))
                    ->line('Merci d\'utiliser notre plateforme!');
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
            'type' => 'publicite_livreur',
            'publicite_id' => $this->publicite->id,
            'publicite_titre' => $this->publicite->titre,
            'page_id' => $this->publicite->page_id,
            'message' => 'Une nouvelle publicité nécessitant des livreurs a été approuvée: ' . $this->publicite->titre,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
