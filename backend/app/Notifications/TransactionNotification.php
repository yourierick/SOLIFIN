<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;

class TransactionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $transactionData;
    protected $amount;
    protected $currency;
    protected $transactionType;
    protected $success;

    /**
     * Create a new notification instance.
     *
     * @param object $transactionData
     * @param float $amount
     * @param string $currency
     * @param string $transactionType
     * @param bool $success
     * @return void
     */
    public function __construct($transactionData, $amount, $currency, $transactionType, $success)
    {
        $this->transactionData = $transactionData;
        $this->amount = $amount;
        $this->currency = $currency;
        $this->transactionType = $transactionType;
        $this->success = $success;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $typeLabel = $this->getTransactionTypeLabel();
        $status = $this->success ? 'réussie' : 'échouée';
        $subject = "{$typeLabel} {$status} - {$this->amount} {$this->currency}";
        
        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour,');
            
        if ($this->success) {
            $mailMessage->line("Votre {$typeLabel} de {$this->amount} {$this->currency} a été traitée avec succès.");
            
            switch ($this->transactionType) {
                case 'purchase_pack':
                    $packName = $this->transactionData->pack_name ?? 'Pack';
                    $mailMessage->line("Vous avez acheté le pack: {$packName}")
                        ->line("Votre pack est maintenant actif et vous pouvez commencer à l'utiliser.");
                    break;
                case 'renew_pack':
                    $packName = $this->transactionData->pack_name ?? 'Pack';
                    $mailMessage->line("Vous avez renouvelé le pack: {$packName}")
                        ->line("Votre pack a été prolongé avec succès.");
                    break;
                case 'purchase_virtual':
                    $mailMessage->line("Vous avez acheté de la monnaie virtuelle.")
                        ->line("Votre portefeuille a été crédité du montant correspondant.");
                    break;
            }
            
            $mailMessage->line('Merci pour votre confiance!');
        } else {
            $mailMessage->line("Votre {$typeLabel} de {$this->amount} {$this->currency} n'a pas pu être finalisée.")
                ->line("Bien que le paiement ait été traité, une erreur est survenue lors de la finalisation.")
                ->line("Notre équipe a été notifiée et résoudra ce problème dans les plus brefs délais.")
                ->line("Veuillez contacter notre service client si vous avez des questions.");
        }
        
        return $mailMessage->action('Accéder à mon compte', url('/'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toDatabase($notifiable)
    {
        $typeLabel = $this->getTransactionTypeLabel();
        $status = $this->success ? 'réussie' : 'échouée';
        
        return [
            'title' => "{$typeLabel} {$status}",
            'amount' => $this->amount,
            'currency' => $this->currency,
            'transaction_type' => $this->transactionType,
            'success' => $this->success,
            'data' => json_encode($this->transactionData),
            'message' => $this->success 
                ? "Votre {$typeLabel} de {$this->amount} {$this->currency} a été traitée avec succès."
                : "Votre {$typeLabel} de {$this->amount} {$this->currency} n'a pas pu être finalisée."
        ];
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
                return 'achat de pack';
            case 'renew_pack':
                return 'renouvellement de pack';
            case 'purchase_virtual':
                return 'achat de monnaie virtuelle';
            default:
                return 'transaction';
        }
    }
}
