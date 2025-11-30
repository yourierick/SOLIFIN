<?php

namespace App\Notifications;

use App\Models\Pack;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PackPurchased extends Notification implements ShouldQueue
{
    use Queueable;

    protected $pack;
    protected $buyer;

    public function __construct(Pack $pack, User $buyer)
    {
        $this->pack = $pack;
        $this->buyer = $buyer;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        // Si le notifiable est l'acheteur
        if ($notifiable->id === $this->buyer->id) {
            return [
                'type' => 'success',
                'titre' => 'Achat de pack',
                'icon' => 'check-circle',
                'color' => 'success',
                'link' => 'dashboard/packs/:id',
                'message' => 'Vous avez acheté le pack ' . $this->pack->name,
            ];
        }

        // Si le notifiable est un parrain qui reçoit une commission
        return [
            'type' => 'info',
            'titre' => 'Commission de parrainage',
            'icon' => 'exclamation-circle',
            'message' => $this->buyer->name . ' a acheté le pack ' . $this->pack->name . ' - Commission reçue',
        ];
    }
} 