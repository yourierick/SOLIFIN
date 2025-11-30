<?php

require_once 'vendor/autoload.php';

use App\Models\Pack;
use App\Models\BonusRates;
use Illuminate\Support\Facades\DB;

// Vérifier les BonusRates existants
echo "=== BONUS RATES EXISTANTS ===\n";
$bonusRates = BonusRates::all();

foreach ($bonusRates as $rate) {
    echo "Pack ID: {$rate->pack_id}\n";
    echo "Type: {$rate->type}\n";
    echo "Fréquence: {$rate->frequence}\n";
    echo "Nombre de filleuls: {$rate->nombre_filleuls}\n";
    echo "Points attribués: {$rate->points_attribues}\n";
    echo "Valeur point: {$rate->valeur_point}\n";
    echo "---\n";
}

echo "\n=== PACKS AVEC LEURS BONUS RATES ===\n";
$packs = Pack::with(['bonusRates' => function($query) {
    $query->where('type', 'esengo')->where('frequence', 'weekly');
}])->get();

foreach ($packs as $pack) {
    echo "Pack: {$pack->name} (ID: {$pack->id})\n";
    echo "Bonus rates trouvés: " . $pack->bonusRates->count() . "\n";
    
    if ($pack->bonusRates->isNotEmpty()) {
        $bonusRate = $pack->bonusRates->first();
        echo "  - Seuil: {$bonusRate->nombre_filleuls} filleuls\n";
        echo "  - Points: {$bonusRate->points_attribues} jetons\n";
        echo "  - Fréquence: {$bonusRate->frequence}\n";
    }
    echo "---\n";
}
