<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TestimonialSubmitted extends Notification
{
    use Queueable;

    /**
     * Les données du témoignage soumis.
     *
     * @var array
     */
    protected $data;

    /**
     * Create a new notification instance.
     *
     * @param array $data Les données du témoignage
     * @return void
     */
    public function __construct(array $data)
    {
        $this->data = $data;
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
                    ->line('Un nouveau témoignage a été soumis par ' . $this->data['user_name'])
                    ->line('Note: ' . $this->data['rating'] . '/5')
                    ->action('Voir le témoignage', url('/admin/testimonials'))
                    ->line('Merci d\'utiliser SOLIFIN!');
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
            'type' => 'warning',
            'icon' => 'exclamation-triangle',
            'titre' => "Nouveau témoignage",
            'message' => 'Un nouveau témoignage a été soumis par ' . $this->data['user_name'] . ' en attente de traitement',
            'link' => '/admin/content-management'
        ];
    }
}
