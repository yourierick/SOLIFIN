<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletSystem;
use App\Models\WithdrawalRequest;
use App\Models\UserPack;
use App\Models\Pack;
use App\Models\TransactionFee;
use App\Notifications\WithdrawalRequestProcessed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\CurrencyController;
use App\Models\ExchangeRates;
use App\Services\WalletService;

class WithdrawalService
{
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';    

    /**
     * Approuve une demande de retrait
     *
     * @param WithdrawalRequest $withdrawal
     * @param string|null $adminNote
     * @param int $adminId
     * @return array
     */
    public function approveWithdrawal(WithdrawalRequest $withdrawal, ?string $adminNote, int $adminId): array
    {
        try {
            DB::beginTransaction();
            
            if ($withdrawal->status !== self::STATUS_PENDING || $withdrawal->payment_status !== self::STATUS_FAILED) {
                return [
                    'success' => false,
                    'message' => 'Cette demande ne peut pas être approuvée ou réessayée car elle n\'est pas en attente ou échouée',
                    'status_code' => 400
                ];
            }

            $withdrawal->status = self::STATUS_APPROVED;
            $withdrawal->admin_note = $adminNote;
            $withdrawal->processed_by = $adminId;
            $withdrawal->processed_at = now();

            $withdrawal->save();
            
            // Début de l'initialisation du paiement
            $serdiPayController = app()->make(\App\Http\Controllers\SerdiPayController::class);
            $paymentResult = $serdiPayController->initialWithdrawal($withdrawal);

            if (!$paymentResult['success']) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Erreur lors de l\'initialisation du paiement: ' . $paymentResult['message'],
                    'status_code' => 500
                ];
            }

            DB::commit();

            $user = $withdrawal->user;
            $user->notify(new WithdrawalRequestProcessed($withdrawal));
            
            return [
                'success' => true,
                'message' => 'Demande approuvée avec succès',
                'status_code' => 200,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de l\'approbation de la demande', [
                'error' => $e->getMessage(),
                'withdrawal_id' => $withdrawal->id
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'approbation de la demande: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Rejette une demande de retrait
     *
     * @param WithdrawalRequest $withdrawal
     * @param string|null $adminNote
     * @param int $adminId
     * @return array
     */
    public function rejectWithdrawal(WithdrawalRequest $withdrawal, ?string $adminNote, int $adminId): array
    {   
        if ($withdrawal->status !== self::STATUS_PENDING) {
            return [
                'success' => false,
                'message' => 'Cette demande ne peut pas être rejetée car elle n\'est pas en attente',
                'status_code' => 400
            ];
        }

        DB::beginTransaction();
        try {
            // Rembourser le montant au wallet de l'utilisateur
            $wallet = $withdrawal->user->wallet;
            $wallet->addFunds($withdrawal->amount, $withdrawal->payment_details['devise'], "remboursement", self::STATUS_COMPLETED, [
                "user" => $withdrawal->user->name,
                "Montant" => $withdrawal->amount,
                "Description" => "remboursement du montant gélé " . $withdrawal->amount . ($withdrawal->payment_details['devise'] === 'USD' ? '$' : 'FC') . " pour le retrait ID: " . $withdrawal->id . " d'un montant de " . $withdrawal->payment_details['montant_a_retirer'] . ($withdrawal->payment_details['devise'] === 'USD' ? '$' : 'FC') ." pour cause de rejet",
            ]);

            // Mettre à jour la transaction originale
            $this->updateUserTransaction($withdrawal, self::STATUS_REJECTED);

            // Rejeter la demande
            $withdrawal->status = self::STATUS_REJECTED;
            $withdrawal->admin_note = $adminNote;
            $withdrawal->processed_by = $adminId;
            $withdrawal->processed_at = now();
            $withdrawal->refund_at = now();
            $withdrawal->save();

            DB::commit();

            // Notifier l'utilisateur
            $withdrawal->user->notify(new WithdrawalRequestProcessed($withdrawal));

            return [
                'success' => true,
                'message' => 'Demande rejetée avec succès',
                'status_code' => 200
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors du rejet de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors du rejet de la demande: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Annule une demande de retrait par l'utilisateur
     *
     * @param WithdrawalRequest $withdrawal
     * @param User $user
     * @return array
     */
    public function cancelWithdrawal(WithdrawalRequest $withdrawal, User $user): array
    {
        if ($withdrawal->status !== self::STATUS_PENDING) {
            return [
                'success' => false,
                'message' => 'Cette demande ne peut pas être annulée car elle n\'est pas en attente',
                'status_code' => 400
            ];
        }

        if ($user->id !== $withdrawal->user_id) {
            return [
                'success' => false,
                'message' => 'Vous n\'avez pas la permission d\'annuler cette demande',
                'status_code' => 403
            ];
        }

        DB::beginTransaction();
        try {
            // Rembourser le montant au wallet de l'utilisateur
            $wallet = $user->wallet;
            $wallet->addFunds($withdrawal->amount, $withdrawal->currency, "remboursement", self::STATUS_COMPLETED, [
                "user" => $withdrawal->user->name,
                "Montant" => $withdrawal->amount,
                "Description" => "remboursement du montant gélé " . $withdrawal->amount . ($withdrawal->currency === 'USD' ? '$' : 'FC') . " de votre compte suite à l'annulation de votre demande de retrait de " . $withdrawal->payment_details['montant_a_retirer'] . ($withdrawal->currency === 'USD' ? '$' : 'FC'),
            ]);

            // Mettre à jour la transaction originale
            $this->updateUserTransaction($withdrawal, self::STATUS_CANCELLED);

            // Annuler la demande
            $withdrawal->status = self::STATUS_CANCELLED;
            $withdrawal->payment_status = self::STATUS_FAILED;
            $withdrawal->refund_at = now();
            $withdrawal->save();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Demande annulée avec succès',
                'status_code' => 200
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de l\'annulation de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la demande: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Supprime une demande de retrait (admin uniquement)
     *
     * @param WithdrawalRequest $withdrawal
     * @return array
     */
    public function deleteWithdrawal(WithdrawalRequest $withdrawal): array
    {
        if ($withdrawal->status !== self::STATUS_APPROVED && $withdrawal->payment_status !== 'paid') {
            return [
                'success' => false,
                'message' => 'Cette demande ne peut pas être supprimée car elle n\'est pas approuvée',
                'status_code' => 400
            ];
        }

        DB::beginTransaction();
        try {
            // Supprimer la transaction associée si elle existe
            $transaction = $withdrawal->user->wallet->transactions()
                ->where('type', 'withdrawal')
                ->where('metadata->withdrawal_request_id', $withdrawal->id)
                ->first();

            if ($transaction) {
                $transaction->delete();
            }

            // Supprimer la demande
            $withdrawal->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Demande supprimée avec succès',
                'status_code' => 200
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la suppression de la demande', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur lors de la suppression de la demande: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Paie la commission au parrain
     *
     * @param User $sponsor
     * @param float $commissionFees
     * @param WithdrawalRequest $withdrawal
     * @return void
     */
    private function paySponsorCommission(User $sponsor, float $commissionFees, WithdrawalRequest $withdrawal): void
    {
        $sponsor->wallet->addFunds($commissionFees, $withdrawal->payment_details['devise'], "commission de retrait", self::STATUS_COMPLETED, [
            "Source" => $withdrawal->user->name, 
            "Type" => "commission de retrait",
            "Montant" => $commissionFees . ($withdrawal->payment_details['devise'] === 'USD' ? '$' : 'FC'),
            "Description" => "vous avez gagné une commission de ". $commissionFees . ($withdrawal->payment_details['devise'] === 'USD' ? '$' : 'FC') . " pour le retrait d'un montant de ". $withdrawal->payment_details['montant_a_retirer_en_USD'] . ($withdrawal->payment_details['devise'] === 'USD' ? '$' : 'FC') . " par votre filleul " . $withdrawal->user->name,
        ]);
    }

    /**
     * Met à jour la transaction utilisateur
     *
     * @param WithdrawalRequest $withdrawal
     * @param string $status
     * @return void
     */
    private function updateUserTransaction(WithdrawalRequest $withdrawal, string $status): void
    {
        $transaction = $withdrawal->user->wallet->transactions()
            ->where('type', 'withdrawal')
            ->where('metadata->withdrawal_request_id', $withdrawal->id)
            ->first();

        if ($transaction) {
            $transaction->status = $status;
            $transaction->save();
        }
    }
}
