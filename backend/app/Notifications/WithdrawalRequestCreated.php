<?php

namespace App\Notifications;

use App\Models\WithdrawalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class WithdrawalRequestCreated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $withdrawalRequest;

    public function __construct(WithdrawalRequest $withdrawalRequest)
    {
        $this->withdrawalRequest = $withdrawalRequest;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'warning',
            'icon' => 'exclamation-triangle',
            'titre' => 'Demande de retrait',
            'message' => 'Nouvelle demande de retrait de ' . number_format($this->withdrawalRequest->amount, 2) . $this->withdrawalRequest->payment_details['devise'],
            'link' => '/admin/finances',
        ];
    }
} 