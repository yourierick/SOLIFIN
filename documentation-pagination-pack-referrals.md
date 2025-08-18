# Documentation - Pagination des filleuls par pack

## Objectif
Implémenter la pagination côté serveur pour la fonction `getPackReferrals` dans le contrôleur `PackController.php` afin de limiter les données de filleuls retournées à 10 éléments par page, tout en assurant la compatibilité avec l'interface utilisateur existante.

## Modifications apportées

### Backend (PackController.php)

1. **Paramètres de pagination ajoutés**
   - `page` : Numéro de page (défaut: 1)
   - `per_page` : Nombre d'éléments par page (défaut: 10)
   - `search` : Terme de recherche pour filtrer les résultats
   - `status` : Filtre par statut (all, active, inactive, expired)
   - `start_date` et `end_date` : Filtres de date
   - `generation_tab` : Onglet de génération actif (0-3)

2. **Structure de la réponse API**
   ```json
   {
     "success": true,
     "data": [
       [...], // Première génération (paginée)
       [...], // Deuxième génération (paginée)
       [...], // Troisième génération (paginée)
       [...], // Quatrième génération (paginée)
     ],
     "pagination": [
       {
         "total": 25,
         "per_page": 10,
         "current_page": 1,
         "last_page": 3,
         "from": 1,
         "to": 10
       },
       // ... métadonnées pour chaque génération
     ]
   }
   ```

3. **Filtrage des données**
   - Implémentation de filtres par terme de recherche (nom, pack, code de parrainage)
   - Filtrage par statut du pack (actif, inactif, expiré)
   - Filtrage par date d'achat

4. **Pagination par génération**
   - Chaque génération est paginée indépendamment
   - Les métadonnées de pagination sont retournées pour chaque génération

### Frontend (MyPacks.jsx)

1. **États de pagination ajoutés**
   ```jsx
   const [referralsPagination, setReferralsPagination] = useState({
     page: 1,
     per_page: 10,
     search: "",
     status: "all",
     start_date: "",
     end_date: ""
   });
   
   const [referralsPaginationMeta, setReferralsPaginationMeta] = useState([]);
   const [selectedPackId, setSelectedPackId] = useState(null);
   ```

2. **Fonction de récupération des filleuls mise à jour**
   ```jsx
   const handleReferralsClick = async (packId, newPage = 1, filters = {}) => {
     // Définir le pack sélectionné
     setSelectedPackId(packId);
     
     // Construction des paramètres de requête avec pagination
     const queryParams = new URLSearchParams();
     // ...
     
     // Appel API avec paramètres de pagination
     const response = await axios.get(`/api/packs/${packId}/referrals?${queryParams.toString()}`);
     
     // Mise à jour des états avec les données paginées
     setCurrentPackReferrals(response.data.data);
     setReferralsPaginationMeta(response.data.pagination || []);
     // ...
   };
   ```

3. **Fonctions de navigation et filtrage**
   ```jsx
   // Fonction pour changer de page
   const handleReferralsPageChange = (packId, newPage) => {
     handleReferralsClick(packId, newPage);
   };
   
   // Fonction pour appliquer les filtres
   const handleReferralsFilterChange = (packId, filters) => {
     handleReferralsClick(packId, 1, filters);
   };
   ```

4. **Interface utilisateur de pagination**
   - Remplacement de la pagination intégrée du DataGrid par une pagination personnalisée
   - Affichage des métadonnées de pagination (total, page actuelle, etc.)
   - Contrôles de pagination avec le composant Pagination de Material-UI

5. **Gestion du changement d'onglet**
   ```jsx
   <Tabs
     value={currentTab}
     onChange={(e, newValue) => {
       setCurrentTab(newValue);
       // Recharger les données avec le nouvel onglet
       if (selectedPackId) {
         const updatedFilters = {
           ...referralsPagination,
           page: 1,
           generation_tab: newValue
         };
         handleReferralsClick(selectedPackId, 1, updatedFilters);
       }
     }}
   />
   ```

## Avantages de cette implémentation

1. **Performance améliorée**
   - Réduction de la charge serveur en limitant les données transmises
   - Temps de réponse plus rapide pour les utilisateurs avec beaucoup de filleuls

2. **Expérience utilisateur optimisée**
   - Navigation fluide entre les pages de filleuls
   - Filtrage efficace des données
   - Compatibilité avec l'interface existante

3. **Extensibilité**
   - Structure permettant d'ajouter facilement d'autres filtres ou fonctionnalités
   - Séparation claire des préoccupations entre backend et frontend

## Utilisation

L'utilisateur peut désormais:
- Naviguer entre les pages de filleuls pour chaque génération
- Voir le nombre total de filleuls et la pagination
- Changer d'onglet de génération avec rechargement automatique des données paginées
