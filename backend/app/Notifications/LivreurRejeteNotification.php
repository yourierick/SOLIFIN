<?php

namespace App\Notifications;

use App\Models\Page;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LivreurRejeteNotification extends Notification implements ShouldQueue
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
            ->subject('Votre candidature de livreur a été rejetée')
            ->greeting('Bonjour ' . $notifiable->name)
            ->line('Nous sommes désolés de vous informer que votre candidature pour devenir livreur de la page "' . $this->page->nom . '" a été rejetée.')
            ->line('Vous pouvez contacter le propriétaire de la page pour plus d\'informations.')
            ->action('Voir la page', env('FRONTEND_URL') . '/dashboard/pages/' . $this->page->id)
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
            'type' => 'danger',
            'titre' => 'Rejet de livraison',
            'icon' => 'exclamation-triangle',
            'link' => '/dashboard/pages/' . $this->page->id,
            'message' => 'Nous sommes désolés de vous informer que votre candidature pour devenir livreur de la page de l\'utilisateur "' . $this->page->user->name . '" a été rejetée.',
        ];
    }
}
