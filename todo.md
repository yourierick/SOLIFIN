Voici ce que tu vas faire:

1. Analyse en profondeur ces fichiers: 
C:\SOLIFIN\backend\app\Http\Controllers\UserBonusPointController.php, 
C:\SOLIFIN\backend\app\Console\Commands\ProcessBonusPoints.php, 
C:\SOLIFIN\backend\app\Services\BonusPointsService.php, 
C:\SOLIFIN\backend\database\migrations\2025_04_02_202855_create_bonus_rates_table.php, 
C:\SOLIFIN\backend\app\Models\BonusRates.php
C:\SOLIFIN\frontend\src\pages\admin\Packs.jsx à partir de la ligne 866

Objectif :
Mettre à jour le système de gestion des bonus pour inclure un nouveau type de bonus, le jeton Esengo, en plus du bonus sur délais, tout en adaptant la gestion des fréquences et les notifications pour les utilisateurs.

Modifications à apporter :
1. Ajout du champ type au modèle BonusRates
- Fichier concerné : C:\SOLIFIN\backend\app\Models\BonusRates.php
- Ajouter un champ type permettant de distinguer les bonus en deux catégories :
- "bonus sur délais" (hebdomadaire)
- "jeton Esengo" (mensuel)
2. Mise à jour du système de gestion des bonus
- Fichier concerné : C:\SOLIFIN\backend\app\Services\BonusPointsService.php
- Adapter le service pour prendre en compte la distinction entre les deux types de bonus.
- Définir la logique de génération des jetons Esengo avec attribution des codes uniques.
3. Modification du processus de gestion des points bonus
- Fichier concerné : C:\SOLIFIN\backend\app\Console\Commands\ProcessBonusPoints.php
- Adapter le traitement des points bonus en fonction du type (bonus sur délais ou jeton Esengo).
- Modifier la fréquence :
- Bonus sur délais → hebdomadaire
- Jeton Esengo → mensuel
4. Ajustement des fréquences de traitement
- Fichier concerné : C:\SOLIFIN\backend\routes\console.php
- Supprimer les fréquences daily, monthly, et yearly pour le bonus sur délais.
- Assurer une exécution hebdomadaire pour le bonus sur délais et mensuelle pour le jeton Esengo.
5. Implémentation des notifications
- Fichier concerné : C:\SOLIFIN\backend\app\Notifications
- Ajouter une notification en dur via la base de données.
- Envoyer un message toast à l'utilisateur lorsqu'un bonus est attribué.
- Définir les messages de notification en fonction du type de bonus :
- Jeton Esengo → "Grâce à vos parrainages au courant de ce mois, vous avez gagné X jetons bonus."
- Bonus sur délais -> "grâce à vos parrainage cette semaine, vous avez gagné X points bonus."
Chaque jeton aura un code unique permettant de tourner la roue de la chance.
- il y aura une interface utilisateur pour gérer ses jetons Esengo, si c'est un jéton qui n'a pas encore été utilisé, le bouton "tourner la roue" sera affiché.
6. Gestion des cadeaux et des tickets gagnants
- Modèle à créer : Cadeau
- Contient les cadeaux disponibles.
- Ces cadeaux seront utilisés comme options de la roue de la chance.
- Modèle à créer : TicketGagnant
- Stocke le code du jeton utilisé pour tourner la roue.
- Permet à l'utilisateur de récupérer son cadeau au bureau SOLIFIN.
- Une fois le cadeau récupéré, le ticket gagnant sera marqué comme consommé.
- Chaque ticket aura une durée de validité de 48h.

A chaque étape terminé, mentionne le dans ce fichier.
