<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DigitalProductSold extends Notification
{
    use Queueable;

    protected $data;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($data)
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
        return ['database', 'mail'];
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
            ->subject('Votre produit numérique a été vendu')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Votre produit numérique "' . $this->data['product_title'] . '" a été acheté.')
            ->line('Montant reçu: ' . $this->data['amount'] . ' ' . $this->data['currency'])
            ->line('Acheteur: ' . $this->data['buyer_name'])
            ->line('Merci d\'utiliser notre plateforme!');
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
            'type' => 'info',
            'titre' => 'Vente de produit numérique',
            'icon' => 'exclamation-circle',
            'link' => '/dashboard/finances',
            'message' => 'Votre produit numérique "' . $this->data['product_title'] . '" a été acheté par ' . $this->data['buyer_name'] . ' pour ' . $this->data['amount'] . ' ' . $this->data['currency'] . '.'
        ];
    }
}
