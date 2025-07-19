<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class PaymentStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $amount;
    protected $currency;
    protected $sessionId;
    protected $status;
    protected $transactionType;

    /**
     * Create a new notification instance.
     *
     * @param float $amount
     * @param string $currency
     * @param string $sessionId
     * @param string $status
     * @param string|null $transactionType
     * @return void
     */
    public function __construct($amount, $currency, $sessionId, $status, $transactionType = null)
    {
        $this->amount = $amount;
        $this->currency = $currency;
        $this->sessionId = $sessionId;
        $this->status = $status;
        $this->transactionType = $transactionType;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $status = $this->status === 'success' ? 'réussi' : 'échoué';
        $subject = "Paiement {$status} - {$this->amount} {$this->currency}";
        
        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour,');
            
        if ($this->status === 'success') {
            $mailMessage->line("Votre paiement de {$this->amount} {$this->currency} a été traité avec succès.")
                ->line("Référence de transaction: {$this->sessionId}");
                
            if ($this->transactionType) {
                $typeLabel = $this->getTransactionTypeLabel();
                $mailMessage->line("Type de transaction: {$typeLabel}");
            }
            
            $mailMessage->line('Merci pour votre confiance!');
        } else {
            $mailMessage->line("Votre paiement de {$this->amount} {$this->currency} n'a pas pu être traité.")
                ->line("Référence de transaction: {$this->sessionId}")
                ->line("Veuillez réessayer ou contacter notre service client si le problème persiste.");
        }
        
        return $mailMessage->action('Accéder à mon compte', url('/'));
    }

    /**
     * Get a human-readable label for the transaction type.
     *
     * @return string
     */
    protected function getTransactionTypeLabel()
    {
        switch ($this->transactionType) {
            case 'purchase_pack':
                return 'Achat de pack';
            case 'renew_pack':
                return 'Renouvellement de pack';
            case 'purchase_virtual':
                return 'Achat de monnaie virtuelle';
            default:
                return 'Paiement';
        }
    }
}
