<?php

namespace App\Notifications;

use App\Models\Page;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LivreurRevoqueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * La page associée à la notification.
     *
     * @var \App\Models\Page
     */
    protected $page;

    /**
     * Create a new notification instance.
     *
     * @param \App\Models\Page $page
     * @return void
     */
    public function __construct(Page $page)
    {
        $this->page = $page;
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
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Votre statut de livreur a été révoqué')
            ->greeting('Bonjour ' . $notifiable->name)
            ->line('Votre statut de livreur pour la page "' . $this->page->nom . '" a été révoqué.')
            ->line('Si vous avez des questions, veuillez contacter le propriétaire de la page.')
            ->action('Voir la page', url('/page/' . $this->page->id))
            ->line('Merci d\'utiliser notre application!');
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
            'type' => 'livreur_revoque',
            'page_id' => $this->page->id,
            'page_name' => $this->page->nom ?? 'La page',
            'titre' => 'Statut de livreur révoqué',
            'message' => 'Votre statut de livreur pour la page "' . $this->page->nom . '" a été révoqué.',
            'created_at' => now()->toIso8601String(),
            'read_at' => null,
        ];
    }
}
