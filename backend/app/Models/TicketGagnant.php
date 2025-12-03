<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use App\Notifications\TicketConsommeAdminNotification;
use App\Notifications\TicketConsommeUserNotification;
use Illuminate\Support\Facades\DB;

class TicketGagnant extends Model
{
    use HasFactory;

    const CONSOMME = "consommé";
    const PROGRAMME = "programmé";
    const EXPIRE = "expiré";
    const NON_CONSOMME = "non consommé";
    
    /**
     * Table associée au modèle.
     *
     * @var string
     */
    protected $table = 'tickets_gagnants';

    /**
     * Les attributs qui sont mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'cadeau_id',
        'code_jeton',
        'date_expiration',
        'consomme',
        'admin_id',
        'date_consommation',
        'code_verification'
    ];

    /**
     * Les attributs à caster.
     *
     * @var array
     */
    protected $casts = [
        'date_expiration' => 'datetime',
        'date_consommation' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Relation avec l'administrateur qui a remis le cadeau
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id', 'id');
    }

    /**
     * Relation avec le cadeau
     */
    public function cadeau()
    {
        return $this->belongsTo(Cadeau::class, 'cadeau_id', 'id');
    }

    /**
     * Vérifie si le ticket est expiré
     *
     * @return bool
     */
    public function estExpire()
    {
        return $this->date_expiration->isPast();
    }

    /**
     * Vérifie si le ticket est valide (non expiré et non consommé)
     *
     * @return bool
     */
    public function estValide()
    {
        return !$this->consomme && !$this->estExpire();
    }

    /**
     * Marque le ticket comme consommé
     *
     * @return bool
     */
    public function marquerCommeConsomme($admin_id)
    {
        try {
        //Ajouter la valeur du cadeau dans le wallet de l'administrateur.
        $admin = User::find($admin_id);
        $cadeau = Cadeau::find($this->cadeau_id);

        if (!$admin) {
            return false;
        }

        DB::beginTransaction();
        $admin->wallet->addFunds($this->cadeau->valeur, 'USD', 'reception', 'completed', [
            'ID du Ticket' => $this->id,
            'ID du Cadeau' => $this->cadeau_id,
            'Nom du Cadeau' => $this->cadeau->nom,
            'Valeur du Cadeau' => $this->cadeau->valeur,
            'Code du Ticket' => $this->code_verification,
            'Déscription' => "Réception des fonds d'une valeur de " . $this->cadeau->valeur . " pour rémise du cadeau " . $this->cadeau->nom,
        ]);

        $walletSystem = WalletSystem::first();
        $walletSystem->transactions()->create([
            'wallet_system_id' => $walletSystem->id,
            'mouvment' => 'out',
            'type' => 'transfer',
            'amount' => $this->cadeau->valeur,
            'currency' => 'USD',
            'status' => 'completed',
            'metadata' => [
                'ID du Ticket' => $this->id,
                'ID du Cadeau' => $this->cadeau_id,
                'Nom du Cadeau' => $this->cadeau->nom,
                'Valeur du Cadeau' => $this->cadeau->valeur,
                'Code du Ticket' => $this->code_verification,
                'Distributeur' => $admin->name,
                'Déscription' => "Paiement des fonds d'une valeur de " . $this->cadeau->valeur . " pour rémise du cadeau " . $this->cadeau->nom,
            ],
        ]);

        $this->consomme = self::CONSOMME;
        $this->date_consommation = Carbon::now();
        $this->admin_id = $admin_id;
        $saved = $this->save();
        
        if ($saved) {
            // Notification pour l'administrateur
            $admin->notify(new TicketConsommeAdminNotification($this, $this->cadeau, $this->cadeau->valeur));
            
            // Notification pour l'utilisateur
            $user = $this->user;
            if ($user) {
                $user->notify(new TicketConsommeUserNotification($this, $this->cadeau, $admin));
            }
        }
        
        return $saved;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function programmerLaRemise($date, $admin_id)
    {
        $this->date_expiration = $date;
        $this->consomme = self::PROGRAMME;
        $this->admin_id = $admin_id;
        return $this->save();
    }

    /**
     * Génère un code de vérification unique
     *
     * @return string
     */
    public static function genererCodeVerification()
    {
        return strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
    }
}
