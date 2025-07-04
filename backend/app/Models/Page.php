<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nombre_abonnes',
        'nombre_likes',
        'photo_de_couverture'
    ];

    /**
     * Récupérer l'utilisateur propriétaire de cette page
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Récupérer les abonnés de cette page
     */
    public function abonnes(): HasMany
    {
        return $this->hasMany(PageAbonnes::class);
    }

    /**
     * Récupérer les publicités associées à cette page
     */
    public function publicites(): HasMany
    {
        return $this->hasMany(Publicite::class);
    }

    /**
     * Récupérer les offres d'emploi associées à cette page
     */
    public function offresEmploi(): HasMany
    {
        return $this->hasMany(OffreEmploi::class);
    }

    /**
     * Récupérer les opportunités d'affaires associées à cette page
     */
    public function opportunitesAffaires(): HasMany
    {
        return $this->hasMany(OpportuniteAffaire::class);
    }
    
    /**
     * Récupérer les livreurs associés à cette page
     */
    public function livreurs(): HasMany
    {
        return $this->hasMany(Livreur::class);
    }
    
    /**
     * Récupérer les livreurs approuvés associés à cette page
     */
    public function livreursApprouves(): HasMany
    {
        return $this->hasMany(Livreur::class)->where('statut', 'approuve');
    }
    
    /**
     * Récupérer les produits numériques associés à cette page
     */
    public function produitsNumeriques(): HasMany
    {
        return $this->hasMany(DigitalProduct::class);
    }
}
