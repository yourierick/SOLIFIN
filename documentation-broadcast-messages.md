# Documentation du système de messages de diffusion

## Vue d'ensemble

Le système de messages de diffusion permet à l'administration de créer et gérer des messages qui seront affichés aux utilisateurs en temps réel via un mécanisme de polling. Ces messages peuvent contenir du texte, des images ou des vidéos, et sont affichés sous forme de modals.

## Fonctionnalités

- Création, modification et suppression de messages de diffusion
- Support pour trois types de contenu : texte, image et vidéo
- Gestion des statuts des messages (brouillon, publié, terminé)
- Affichage séquentiel des messages (un après l'autre)
- Chaque message n'est affiché qu'une seule fois à l'utilisateur
- Possibilité de relancer un message pour qu'il soit à nouveau visible
- Interface d'administration dédiée
- Système de polling pour afficher les messages en temps réel

## Architecture

Le système est composé de plusieurs éléments :

1. **BroadcastContext** : Contexte React qui gère l'état global des messages de diffusion et le mécanisme de polling
2. **BroadcastMessageModal** : Composant qui affiche les messages aux utilisateurs
3. **AdminBroadcastMessages** : Interface d'administration pour gérer les messages
4. **Services API** : Fonctions pour interagir avec le backend
5. **Modèle BroadcastMessage** : Modèle de données côté backend
6. **Table broadcast_message_user** : Table de relation pour suivre les messages vus par chaque utilisateur

## Guide d'utilisation pour les administrateurs

### Accéder à l'interface d'administration

1. Connectez-vous avec un compte administrateur
2. Dans le menu latéral, cliquez sur "Messages de diffusion"

### Créer un nouveau message

1. Cliquez sur le bouton "Nouveau message"
2. Remplissez le formulaire :
   - **Titre** : Titre du message (obligatoire)
   - **Type** : Choisissez entre Texte, Image ou Vidéo
   - **URL du média** : Pour les types Image et Vidéo, indiquez l'URL du média
   - **Description** : Contenu du message (obligatoire)
   - **Statut** : Choisissez entre Brouillon et Publié
3. Cliquez sur "Ajouter"

### Gérer les messages existants

- **Prévisualiser** : Cliquez sur l'icône d'œil pour voir le message tel qu'il sera affiché aux utilisateurs
- **Modifier** : Cliquez sur l'icône de crayon pour modifier un message
- **Supprimer** : Cliquez sur l'icône de corbeille pour supprimer un message
- **Publier** : Publiez un message pour qu'il soit visible par les utilisateurs
- **Terminer** : Marquez un message comme terminé pour qu'il ne soit plus visible
- **Relancer** : Relancez un message terminé pour qu'il soit à nouveau visible par tous les utilisateurs

### Bonnes pratiques

- Créez des messages concis et informatifs
- Pour les images, utilisez des formats légers (JPG, PNG) et des dimensions raisonnables
- Pour les vidéos, privilégiez des formats compatibles avec tous les navigateurs (MP4)
- Utilisez le statut "Terminé" pour les messages obsolètes plutôt que de les supprimer
- Utilisez la fonction "Relancer" pour réutiliser un message terminé

## Comportement côté utilisateur

- Les messages publiés sont affichés à l'utilisateur en temps réel via un mécanisme de polling
- Le système vérifie périodiquement s'il y a de nouveaux messages à afficher
- Si plusieurs messages sont disponibles, ils sont affichés séquentiellement
- L'utilisateur peut naviguer entre les messages avec les boutons "Précédent" et "Suivant"
- L'utilisateur peut fermer le modal à tout moment
- Un message vu ne sera jamais affiché à nouveau à cet utilisateur, sauf si le message est relancé par l'administrateur

## Spécifications techniques

### Structure des données

Un message de diffusion contient les champs suivants :
- `id` : Identifiant unique
- `title` : Titre du message
- `description` : Contenu textuel du message
- `type` : Type de message ('text', 'image', 'video')
- `media_url` : URL du média pour les types image et vidéo
- `status` : État du message ('draft', 'published', 'completed')
- `published_at` : Date de publication
- `created_at` : Date de création
- `updated_at` : Date de dernière modification

### Endpoints API

#### Administration

- `GET /api/admin/broadcast-messages` : Liste tous les messages
- `POST /api/admin/broadcast-messages` : Crée un nouveau message
- `GET /api/admin/broadcast-messages/{id}` : Récupère un message spécifique
- `PUT /api/admin/broadcast-messages/{id}` : Met à jour un message
- `DELETE /api/admin/broadcast-messages/{id}` : Supprime un message
- `POST /api/admin/broadcast-messages/{id}/publish` : Publie un message
- `POST /api/admin/broadcast-messages/{id}/complete` : Marque un message comme terminé
- `POST /api/admin/broadcast-messages/{id}/republish` : Relance un message
- `GET /api/admin/broadcast-messages/stats` : Statistiques des messages

#### Utilisateur

- `GET /api/broadcast-messages` : Récupère les messages publiés non vus par l'utilisateur
- `POST /api/broadcast-messages/{id}/seen` : Marque un message comme vu
- `GET /api/broadcast-messages/check` : Vérifie s'il y a de nouveaux messages disponibles

### Stockage des messages vus

Le système utilise une table de relation `broadcast_message_user` pour suivre les messages vus par chaque utilisateur :
- `id` : Identifiant unique de la relation
- `broadcast_message_id` : ID du message vu
- `user_id` : ID de l'utilisateur qui a vu le message
- `seen_at` : Date à laquelle le message a été vu
- `created_at` et `updated_at` : Dates de création et de modification

## Dépannage

### Messages non affichés

1. Vérifiez que le message est bien publié (statut "published")
2. Vérifiez que l'utilisateur n'a pas déjà vu ce message (table `broadcast_message_user`)
3. Vérifiez que le mécanisme de polling fonctionne correctement
4. Pour les médias, vérifiez que les URLs sont accessibles et que les formats sont supportés

### Problèmes d'affichage des médias

1. Vérifiez que l'URL du média est correcte et accessible
2. Assurez-vous que le format du média est supporté par les navigateurs modernes
3. Vérifiez que le média n'est pas trop volumineux

## Évolutions futures

- Support pour la programmation des messages (dates de début et de fin)
- Ciblage des messages par groupe d'utilisateurs
- Statistiques détaillées sur les vues des messages
- Support pour les contenus interactifs (formulaires, sondages)
- Optimisation du mécanisme de polling pour réduire la charge serveur
- Implémentation d'un système de websockets pour une diffusion en temps réel plus efficace
