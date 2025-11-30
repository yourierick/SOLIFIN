<?php

namespace App\Notifications;

use App\Models\WithdrawalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalRequestPaid extends Notification implements ShouldQueue
{
    use Queueable;

    private $withdrawalRequest;

    public function __construct(WithdrawalRequest $withdrawalRequest)
    {
        $this->withdrawalRequest = $withdrawalRequest;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Votre retrait a été effectué')
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Votre retrait d'un montant de {$this->withdrawalRequest->payment_details['montant_a_retirer']} {$this->withdrawalRequest->payment_details['devise']} a été effectué avec succès.")
            ->line("Le paiement a été envoyé via {$this->withdrawalRequest->payment_method}.")
            ->line("Merci de votre confiance !");
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'success',
            'icon' => 'check-circle',
            'titre' => 'Retrait effectué',
            'message' => 'Votre retrait d\'un montant de ' . $this->withdrawalRequest->payment_details['montant_a_retirer'] . $this->withdrawalRequest->payment_details['devise'] .' a été effectué avec succès.',
        ];
    }
}
