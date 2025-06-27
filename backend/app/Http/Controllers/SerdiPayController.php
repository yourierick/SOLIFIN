<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SerdiPayService;
use Illuminate\Support\Facades\Auth;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\SerdiPayTransaction;
use Illuminate\Support\Facades\Validator;

class SerdiPayController extends Controller
{
    protected $serdiPayService;

    public function __construct(SerdiPayService $serdiPayService)
    {
        $this->serdiPayService = $serdiPayService;
    }

    /**
     * Initie un paiement via SerdiPay pour un utilisateur authentifié avec wallet
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiatePayment(Request $request)
    {
        $request->validate([
            'wallet_id' => 'required|integer|exists:wallets,id',
            'phone_number' => 'required|string|regex:/^\+?[0-9]{8,15}$/',
            'amount' => 'required|numeric|min:100',
            'currency' => 'required|string|size:3',
            'telecom' => 'required|string|in:MP,OM,AM,AF',
            'reference' => 'nullable|string|max:50'
        ]);

        // Vérifier que le wallet appartient à l'utilisateur connecté
        $wallet = Wallet::where('id', $request->wallet_id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$wallet) {
            return response()->json([
                'status' => 'error',
                'message' => 'Wallet non trouvé ou non autorisé'
            ], 403);
        }

        $result = $this->serdiPayService->initiatePayment(
            $request->phone_number,
            $request->amount,
            $request->currency,
            $request->telecom,
            $request->reference
        );

        return response()->json($result, $result['status_code'] ?? 500);
    }

    /**
     * Vérifie le statut d'une transaction SerdiPay
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkStatus(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string'
        ]);

        // Vérifier que la transaction appartient à l'utilisateur connecté
        $transaction = SerdiPayTransaction::where('session_id', $request->session_id)
            ->where(function($query) {
                $query->where('user_id', Auth::id())
                      ->orWhere('email', Auth::user()->email);
            })
            ->first();

        if (!$transaction) {
            return response()->json([
                'status' => 'error',
                'message' => 'Transaction non trouvée ou non autorisée'
            ], 404);
        }

        $result = $this->serdiPayService->checkTransactionStatus($request->session_id);

        return response()->json($result, $result['status_code'] ?? 500);
    }

    /**
     * Initier un retrait via SerdiPay (merchant to client)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiateWithdrawal(Request $request)
    {
        // Valider les données de la requête
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|min:9|max:15',
            'amount' => 'required|numeric|min:1',
            'currency' => 'required|string|size:3',
            'telecom' => 'required|string|in:MP,OM,AM,AF',
            'reference' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Récupérer le wallet de l'utilisateur
        $user = Auth::user();
        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json([
                'success' => false,
                'message' => 'Wallet not found for this user'
            ], 404);
        }

        // Vérifier si l'utilisateur a suffisamment de fonds
        if ($wallet->balance < $request->amount) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient funds in wallet',
                'balance' => $wallet->balance,
                'requested_amount' => $request->amount
            ], 400);
        }

        // Initier le retrait via le service SerdiPay
        $result = $this->serdiPayService->initiateWithdrawal(
            $wallet->id,
            $request->phone_number,
            $request->amount,
            $request->currency,
            $request->telecom,
            $request->reference ?? null
        );

        if ($result['success']) {
            return response()->json($result);
        } else {
            return response()->json($result, 400);
        }
    }

    /**
     * Reçoit et traite les callbacks de SerdiPay
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handleCallback(Request $request)
    {
        // Pas de validation d'authentification pour les callbacks
        // SerdiPay envoie les callbacks directement à notre endpoint

        $result = $this->serdiPayService->handleCallback($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Callback traité avec succès'
        ]);
    }

    /**
     * Initie un paiement via SerdiPay pour un utilisateur non authentifié (achat de pack)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiateGuestPayment(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string|regex:/^\+?[0-9]{8,15}$/',
            'email' => 'required|email',
            'amount' => 'required|numeric|min:100',
            'currency' => 'required|string|size:3',
            'telecom' => 'required|string|in:MP,OM,AM,AF',
            'reference' => 'nullable|string|max:50'
        ]);

        $serdiPayService = new SerdiPayService();
        $result = $serdiPayService->initiatePayment(
            $request->phone_number,
            $request->amount,
            $request->currency,
            $request->telecom,
            $request->reference
        );

        return response()->json($result, $result['status_code'] ?? 500);
    }

    /**
     * Vérifie le statut d'une transaction SerdiPay pour un utilisateur non authentifié
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkGuestStatus(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'email' => 'required|email'
        ]);

        // Vérifier que la transaction correspond à l'email fourni
        $transaction = SerdiPayTransaction::where('session_id', $request->session_id)
            ->where('email', $request->email)
            ->first();

        if (!$transaction) {
            return response()->json([
                'status' => 'error',
                'message' => 'Transaction non trouvée ou non autorisée'
            ], 404);
        }

        $serdiPayService = new SerdiPayService();
        $result = $serdiPayService->checkTransactionStatus($request->session_id);

        return response()->json($result, $result['status_code'] ?? 500);
    }
}
