<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FundsTransferred extends Notification implements ShouldQueue
{
    use Queueable;

    private $amount;
    private $senderName;
    private $recipientName;
    private $isRecipient;
    private $description;

    /**
     * Create a new notification instance.
     *
     * @param float $amount Le montant transféré
     * @param string $senderName Nom de l'expéditeur
     * @param string $recipientName Nom du destinataire
     * @param bool $isRecipient Indique si le destinataire de la notification est le destinataire du transfert
     * @param string $description Description du transfert (optionnel)
     */
    public function __construct($amount, $senderName, $recipientName, $isRecipient, $description = null)
    {
        $this->amount = $amount;
        $this->senderName = $senderName;
        $this->recipientName = $recipientName;
        $this->isRecipient = $isRecipient;
        $this->description = $description;
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
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        if ($this->isRecipient) {
            // Notification pour le destinataire du transfert
            return [
                'type' => 'info',
                'icon' => 'exclamation-circle',
                'titre' => 'Réception de fonds',
                'message' => 'Vous avez reçu ' . $this->amount . ' de ' . $this->senderName . '.',
            ];
        } else {
            // Notification pour l'expéditeur du transfert
            return [
                'type' => 'success',
                'icon' => 'check-circle',
                'titre' => 'Transfert des fonds',
                'message' => 'Vous avez transféré ' . $this->amount . ' à ' . $this->recipientName . '.',
            ];
        }
    }
}
