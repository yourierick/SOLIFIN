# Documentation: Pagination des statistiques de pack

## Résumé des modifications

Cette documentation détaille l'implémentation de la pagination côté serveur pour la récupération et l'affichage des statistiques détaillées des filleuls d'un pack dans l'application Solifin.

## 1. Modifications Backend

### Contrôleur `PackController.php`

La méthode `getDetailedPackStats` a été modifiée pour prendre en charge la pagination côté serveur:

```php
public function getDetailedPackStats(Request $request, Pack $pack)
{
    // Récupération des paramètres de pagination
    $page = $request->input('page', 1);
    $perPage = $request->input('per_page', 10);
    $searchTerm = $request->input('search', '');
    $startDate = $request->input('start_date');
    $endDate = $request->input('end_date');
    
    // Filtrage et pagination des référés
    $allReferralsCollection = collect($allReferrals);
    
    // Application des filtres
    if (!empty($searchTerm)) {
        // Filtre par terme de recherche
    }
    if (!empty($startDate)) {
        // Filtre par date de début
    }
    if (!empty($endDate)) {
        // Filtre par date de fin
    }
    
    // Pagination
    $totalReferrals = $allReferralsCollection->count();
    $paginatedReferrals = $allReferralsCollection->sortByDesc('purchase_date')
        ->forPage($page, $perPage)
        ->values()
        ->toArray();
    
    // Ajout des métadonnées de pagination à la réponse
    return response()->json([
        'success' => true,
        'data' => [
            // Autres données...
            'all_referrals' => $paginatedReferrals,
            'pagination' => [
                'total' => $totalReferrals,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => ceil($totalReferrals / $perPage),
                'from' => ($page - 1) * $perPage + 1,
                'to' => min($page * $perPage, $totalReferrals)
            ]
        ]
    ]);
}
```

## 2. Modifications Frontend

### Composant `PackStatsModal.jsx`

#### Fonction `fetchStats`

La fonction `fetchStats` a été modifiée pour envoyer les paramètres de pagination et de filtrage à l'API:

```javascript
const fetchStats = async (page = 1, perPage = 10, searchTerm = "", startDate = "", endDate = "") => {
  try {
    setLoading(true);
    const response = await axios.get(`/api/packs/${packId}/detailed-stats`, {
      params: {
        page,
        per_page: perPage,
        search: searchTerm,
        start_date: startDate,
        end_date: endDate
      }
    });
    if (response.data.success) {
      setStats(response.data.data);
    }
  } catch (error) {
    setError("Erreur lors de la récupération des statistiques");
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

#### Composant `AllReferrals`

Le composant `AllReferrals` a été adapté pour utiliser la pagination côté serveur:

```javascript
const AllReferrals = () => {
  const [filters, setFilters] = useState({
    searchTerm: "",
    dateRange: { start: "", end: "" },
  });
  const [page, setPage] = useState(1); // Page commence à 1 pour l'API
  const rowsPerPage = 10;

  // Les filtres sont maintenant appliqués côté serveur
  const referrals = useMemo(() => {
    return stats?.all_referrals || [];
  }, [stats?.all_referrals]);
  
  // Informations de pagination
  const pagination = useMemo(() => {
    return stats?.pagination || {
      total: 0,
      per_page: rowsPerPage,
      current_page: 1,
      last_page: 1,
      from: 0,
      to: 0
    };
  }, [stats?.pagination]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Réinitialiser à la première page lors du changement de filtre
    
    // Appliquer les filtres côté serveur
    fetchStats(
      1, 
      rowsPerPage, 
      newFilters.searchTerm, 
      newFilters.dateRange.start, 
      newFilters.dateRange.end
    );
  };
  
  // Gérer le changement de page
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    fetchStats(
      newPage, 
      rowsPerPage, 
      filters.searchTerm, 
      filters.dateRange.start, 
      filters.dateRange.end
    );
  };

  // Rendu du composant avec pagination Material-UI
  return (
    // ...
    <Pagination 
      count={pagination.last_page} 
      page={page} 
      onChange={handlePageChange}
      color="primary"
      shape="rounded"
      // ...
    />
    // ...
  );
};
```

#### Composant `FiltersAndSearch`

Le composant `FiltersAndSearch` a été mis à jour pour appliquer les filtres côté serveur:

```javascript
const FiltersAndSearch = ({
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  onFilterChange,
}) => {
  // ...
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({ searchTerm: value, dateRange });
  };

  const handleDateChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    onFilterChange({ searchTerm, dateRange: newDateRange });
  };
  
  // ...
};
```

## 3. Avantages de cette implémentation

1. **Performance améliorée**: Seules les données nécessaires sont chargées, ce qui réduit la charge sur le serveur et le temps de chargement.
2. **Expérience utilisateur fluide**: Les utilisateurs peuvent naviguer facilement entre les pages de filleuls sans attendre le chargement de toutes les données.
3. **Filtrage efficace**: Les filtres sont appliqués côté serveur, ce qui permet de filtrer efficacement de grandes quantités de données.
4. **Scalabilité**: Cette approche est plus scalable et peut gérer un grand nombre de filleuls sans problème de performance.

## 4. Utilisation

Pour utiliser cette fonctionnalité:

1. Ouvrez le modal des statistiques d'un pack
2. Naviguez vers l'onglet "Liste complète des filleuls"
3. Utilisez les filtres de recherche et de date pour filtrer les filleuls
4. Utilisez la pagination en bas de la liste pour naviguer entre les pages de résultats
