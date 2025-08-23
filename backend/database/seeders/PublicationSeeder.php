<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\User;
use App\Models\Publicite;
use App\Models\OffreEmploi;
use App\Models\OpportuniteAffaire;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PublicationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Récupérer tous les utilisateurs non-admin
        $users = User::where('is_admin', false)->get();
        
        // Définir des données réalistes pour les seeds
        $pays = ['RDC', 'Sénégal', 'Côte d\'Ivoire', 'Cameroun', 'Mali'];
        $villes = [
            'RDC' => ['Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu', 'Kisangani'],
            'Sénégal' => ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Mbour'],
            'Côte d\'Ivoire' => ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Korhogo', 'San-Pédro'],
            'Cameroun' => ['Douala', 'Yaoundé', 'Garoua', 'Bamenda', 'Maroua'],
            'Mali' => ['Bamako', 'Sikasso', 'Mopti', 'Ségou', 'Kayes']
        ];
        
        $secteurs = ['Agriculture', 'Commerce', 'Technologie', 'Immobilier', 'Éducation', 'Santé', 'Transport', 'Finance', 'Énergie', 'Tourisme'];
        $types_contrat = ['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel', 'Intérim'];
        $devises = ['XOF', 'CDF', 'EUR', 'USD'];

        foreach ($users as $user) {
            // Créer une page pour chaque utilisateur
            $page = Page::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'nombre_abonnes' => rand(0, 100),
                    'nombre_likes' => rand(0, 200)
                ]
            );
            
            // Pays aléatoire pour cet utilisateur
            $pays_user = $pays[array_rand($pays)];
            $villes_pays = $villes[$pays_user];

            // Créer des publicités pour chaque page
            for ($i = 0; $i < rand(1, 3); $i++) {
                $categorie = rand(0, 1) ? 'produit' : 'service';
                $sous_categories = [
                    'produit' => ['location de véhicule', 'location de maison'],
                    'service' => ['réservation', 'livraison', 'vente', 'sous-traitance', 'autre à préciser']
                ];
                $sous_categorie = $sous_categories[$categorie][array_rand($sous_categories[$categorie])];
                
                $besoin_livreurs = rand(0, 1) ? 'OUI' : 'NON';
                $conditions_livraison = null;
                
                if ($besoin_livreurs === 'OUI') {
                    $conditions_livraison = json_encode([
                        'zone_livraison' => $villes_pays[array_rand($villes_pays)],
                        'delai_livraison' => rand(1, 7) . ' jours',
                        'frais_supplementaires' => rand(0, 1) ? 'OUI' : 'NON'
                    ]);
                }
                
                $statut = ['en_attente', 'approuvé', 'rejeté'][rand(0, 2)];
                $raison_rejet = null;
                
                if ($statut === 'rejeté') {
                    $raison_rejet = 'Non conforme aux règles de la plateforme';
                }
                
                Publicite::create([
                    'page_id' => $page->id,
                    'pays' => $pays_user,
                    'ville' => $villes_pays[array_rand($villes_pays)],
                    'type' => rand(0, 1) ? 'publicité' : 'annonce',
                    'categorie' => $categorie,
                    'sous_categorie' => $sous_categorie,
                    'autre_sous_categorie' => rand(0, 10) > 8 ? 'Autre catégorie personnalisée' : null,
                    'titre' => 'Publicité ' . ($i + 1) . ' de ' . $user->name,
                    'description' => 'Description détaillée de la publicité ' . ($i + 1) . '. Ceci est un texte généré pour tester la fonctionnalité avec des informations complètes sur le produit/service proposé.',
                    'image' => rand(0, 1) ? 'publicites/pub_' . Str::random(10) . '.jpg' : null,
                    'video' => rand(0, 5) > 4 ? 'publicites/video_' . Str::random(10) . '.mp4' : null,
                    'contacts' => $user->whatsapp ?? $user->phone ?? '+243 ' . rand(8, 9) . rand(10000000, 99999999),
                    'email' => $user->email,
                    'adresse' => $user->address ?? 'Adresse à ' . $villes_pays[array_rand($villes_pays)],
                    'besoin_livreurs' => $besoin_livreurs,
                    'conditions_livraison' => $conditions_livraison,
                    'point_vente' => rand(0, 1) ? 'Point de vente à ' . $villes_pays[array_rand($villes_pays)] : null,
                    'quantite_disponible' => rand(1, 100),
                    'prix_unitaire_vente' => rand(500, 50000),
                    'devise' => $devises[array_rand($devises)],
                    'commission_livraison' => rand(0, 1) ? 'OUI' : 'NON',
                    'prix_unitaire_livraison' => rand(0, 1) ? rand(500, 5000) : null,
                    'lien' => rand(0, 3) > 2 ? 'https://exemple.com/' . Str::random(8) : null,
                    'statut' => $statut,
                    'raison_rejet' => $raison_rejet,
                    'etat' => rand(0, 1) ? 'disponible' : 'terminé',
                    'duree_affichage' => $user->pack_de_publication ? $user->pack_de_publication->duree_publication_en_jour : 30,
                ]);
            }

            // Créer des offres d'emploi pour chaque page
            for ($i = 0; $i < rand(1, 2); $i++) {
                $statut = ['en_attente', 'approuvé', 'rejeté'][rand(0, 2)];
                $raison_rejet = null;
                
                if ($statut === 'rejeté') {
                    $raison_rejet = 'Informations incomplètes ou non conformes';
                }
                
                OffreEmploi::create([
                    'page_id' => $page->id,
                    'type' => rand(0, 1) ? 'offre_emploi' : 'appel_manifestation_intéret',
                    'pays' => $pays_user,
                    'ville' => $villes_pays[array_rand($villes_pays)],
                    'secteur' => $secteurs[array_rand($secteurs)],
                    'entreprise' => 'Entreprise de ' . $user->name,
                    'titre' => 'Offre d\'emploi ' . ($i + 1) . ' de ' . $user->name,
                    'reference' => 'REF-' . strtoupper(Str::random(6)),
                    'description' => 'Description détaillée du poste ' . ($i + 1) . '. Nous recherchons un profil dynamique et motivé pour rejoindre notre équipe en pleine croissance.',
                    'type_contrat' => $types_contrat[array_rand($types_contrat)],
                    'date_limite' => now()->addDays(rand(5, 30)),
                    'email_contact' => $user->email,
                    'contacts' => $user->whatsapp ?? $user->phone ?? '+243 ' . rand(8, 9) . rand(10000000, 99999999),
                    'offer_file' => 'emplois/offre_' . Str::random(10) . '.pdf',
                    'lien' => rand(0, 3) > 2 ? 'https://carriere.exemple.com/' . Str::random(8) : null,
                    'statut' => $statut,
                    'raison_rejet' => $raison_rejet,
                    'etat' => rand(0, 1) ? 'disponible' : 'terminé',
                    'duree_affichage' => $user->pack_de_publication ? $user->pack_de_publication->duree_publication_en_jour : 30,
                ]);
            }

            // Créer des opportunités d'affaires pour chaque page
            for ($i = 0; $i < rand(1, 2); $i++) {
                $statut = ['en_attente', 'approuvé', 'rejeté'][rand(0, 2)];
                $raison_rejet = null;
                
                if ($statut === 'rejeté') {
                    $raison_rejet = 'Opportunité non conforme aux critères de la plateforme';
                }
                
                OpportuniteAffaire::create([
                    'page_id' => $page->id,
                    'type' => rand(0, 1) ? 'parténariat' : 'appel_projet',
                    'pays' => $pays_user,
                    'ville' => $villes_pays[array_rand($villes_pays)],
                    'secteur' => $secteurs[array_rand($secteurs)],
                    'entreprise' => 'Entreprise de ' . $user->name,
                    'titre' => 'Opportunité d\'affaire ' . ($i + 1) . ' de ' . $user->name,
                    'reference' => 'OPP-' . strtoupper(Str::random(6)),
                    'description' => 'Description détaillée de l\'opportunité ' . ($i + 1) . '. Un projet innovant avec un fort potentiel de croissance dans un marché en expansion.',
                    'contacts' => $user->whatsapp ?? $user->phone ?? '+243 ' . rand(8, 9) . rand(10000000, 99999999),
                    'email' => $user->email,
                    'opportunity_file' => 'opportunites/doc_' . Str::random(10) . '.pdf',
                    'lien' => rand(0, 3) > 2 ? 'https://opportunites.exemple.com/' . Str::random(8) : null,
                    'date_limite' => now()->addDays(rand(10, 60)),
                    'statut' => $statut,
                    'raison_rejet' => $raison_rejet,
                    'etat' => rand(0, 1) ? 'disponible' : 'terminé',
                    'duree_affichage' => $user->pack_de_publication ? $user->pack_de_publication->duree_publication_en_jour : 30,
                ]);
            }
        }
    }
}
