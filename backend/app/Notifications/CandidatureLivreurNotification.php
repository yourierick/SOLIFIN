<?php

namespace App\Notifications;

use App\Models\Page;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CandidatureLivreurNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * L'utilisateur qui postule en tant que livreur.
     *
     * @var \App\Models\User
     */
    protected $applicant;

    /**
     * La page pour laquelle l'utilisateur postule.
     *
     * @var \App\Models\Page
     */
    protected $page;

    /**
     * Create a new notification instance.
     *
     * @param  \App\Models\User  $applicant
     * @param  \App\Models\Page  $page
     * @return void
     */
    public function __construct(User $applicant, Page $page)
    {
        $this->applicant = $applicant;
        $this->page = $page;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
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
                    ->subject('Nouvelle candidature de livreur')
                    ->greeting('Bonjour ' . $notifiable->name . '!')
                    ->line('L\'utilisateur ' . $this->applicant->name . ' a postulé en tant que livreur pour votre page.')
                    ->line('Vous pouvez consulter et gérer cette candidature dans votre espace personnel.')
                    ->action('Voir les candidatures', url('/user/my-page?tab=livreurs'))
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
            'type' => 'candidature_livreur',
            'applicant_id' => $this->applicant->id,
            'applicant_name' => $this->applicant->name,
            'page_id' => $this->page->id,
            'page_name' => $this->page->nom ?? 'Votre page',
            'link' => '/dashboard/my-page',
            'titre' => 'Nouvelle candidature de livreur',
            'message' => 'L\'utilisateur ' . $this->applicant->name . ' a postulé en tant que livreur pour votre page.',
            'created_at' => now()->toIso8601String(),
        ];
    }
}
