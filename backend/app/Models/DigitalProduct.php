<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DigitalProduct extends Model
{
    use HasFactory;

    protected $table = 'digital_products';

    protected $fillable = [
        'page_id',
        'titre',
        'description',
        'type', // 'ebook', 'fichier_admin'
        'prix',
        'devise',
        'image',
        'fichier',
        'expiry_date',
        'statut', // 'en_attente', 'approuve', 'rejete'
        'raison_rejet',
        'etat', // 'disponible', 'termine'
        'nombre_ventes',
    ];

    protected $casts = [
        'prix' => 'float',
        'nombre_ventes' => 'integer',
    ];

    /**
     * Récupérer la page associée à ce produit digital
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
    
    /**
     * Obtenir l'utilisateur associé à ce produit digital via la page
     */
    public function user()
    {
        return $this->hasOneThrough(User::class, Page::class, 'id', 'id', 'page_id', 'user_id');
    }
    
    /**
     * Obtenir les achats de ce produit digital
     */
    public function purchases()
    {
        return $this->hasMany(DigitalProductPurchase::class);
    }
}
