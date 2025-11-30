<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Bus\Queueable;
use App\Models\Pack;
use App\Models\Setting;

class VerifyEmailWithCredentials extends VerifyEmailFrench implements ShouldQueue
{
    use Queueable;
    
    protected $password;

    public function __construct($password)
    {
        $this->password = $password;
    }
    
    /**
     * Get the notification's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        $trialDurationDays = (int) Setting::getValue('essai_duration_days', 10);

        return (new MailMessage)
            ->subject('Confirmation de votre adresse e-mail')
            ->greeting('Bonjour !')
            ->line('Félicitations, bienvenue dans la famille SOLIFIN')
            ->line('Voici vos coordonnées de connexion :')
            ->line('- ID de votre compte: ' . $notifiable->account_id)
            ->line('- Mot de passe: ' . $this->password)
            ->line('- Email: ' . $notifiable->email)
            ->line('Veuillez avant de vous connecter, cliquer sur ce lien ci-dessous pour vérifier votre adresse email.')
            ->action('Vérifier l\'adresse e-mail', $verificationUrl)
            ->line('Vous avez une période d\'essai de ' . $trialDurationDays . ' jours pour tester les fonctionnalités basiques, veuillez souscrire à un pack pour accéder aux fonctionnalités premium.')
            ->line('Si vous ne souscrivez pas à un pack avant la fin de votre période d\'essai, votre compte sera supprimé')
            ->line('Si vous n\'avez pas créé de compte, aucune action supplémentaire n\'est requise.')
            ->salutation('Cordialement, L\'équipe SOLIFIN');
    }
}
