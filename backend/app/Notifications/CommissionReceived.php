<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommissionReceived extends Notification implements ShouldQueue
{
    use Queueable;

    protected $commission;
    protected $currency;
    protected $pack;
    protected $generation;

    public function __construct($commission, $currency, $pack, $generation)
    {
        $this->commission = $commission;
        $this->currency = $currency;
        $this->pack = $pack;
        $this->generation = $generation;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Nouvelle Commission Reçue!')
            ->greeting('Bonjour ' . $notifiable->name)
            ->line('Vous avez reçu une nouvelle commission!')
            ->line('Détails de la commission:')
            ->line('- Montant: ' . number_format($this->commission, 2) . $this->currency === "USD" ? ' $' : ' FC')
            ->line('- Pack: ' . $this->pack->name)
            ->line('- Génération: ' . $this->generation)
            ->line('Merci de votre participation au programme de parrainage!');
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'info',
            'titre' => 'Commission de parrainage',
            'message' => 'Vous avez reçu une nouvelle commission!',
            'icon' => 'exclamation-circle',
        ];
    }
}
