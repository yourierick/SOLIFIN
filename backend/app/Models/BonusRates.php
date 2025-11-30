<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BonusRates extends Model
{
    protected $fillable = [
        'pack_id',
        'frequence',
        'nombre_filleuls',    // Nombre de filleuls pour obtenir 1 Jeton Esengo (seuil)
        'points_attribues',   // Nombre de jetons attribués pour ce seuil
        'valeur_point',       // Valeur d'un point en devise
        'type',
    ];

    // Types de bonus disponibles
    const TYPE_ESENGO = 'esengo';

    /**
     * Relation avec le pack
     */
    public function pack()
    {
        return $this->belongsTo(Pack::class);
    }
}
