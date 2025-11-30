# Configuration SerdiPay - Résolution du problème de whitelist

## Problème identifié
Erreur : `This domain or IP is not whitelisted` malgré la configuration correcte chez SerdiPay.

## Informations du serveur
- **Domaine** : solifinexpress.com
- **IP du serveur** : 185.22.110.179
- **Hébergeur** : PlanetHoster (The World Pro)
- **Configuration** : Backend Laravel + Frontend React sur le même domaine

## Solutions implémentées dans `SerdiPayService.php`

### 1. Configuration complète du client Guzzle (lignes 43-60)

```php
$this->client = new Client([
    'timeout' => 30,
    'connect_timeout' => 10,
    'http_errors' => false,
    'verify' => true, // Vérification SSL
    'headers' => [
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
        'User-Agent' => 'SolifinExpress/1.0 (Laravel)',
        'Origin' => 'https://solifinexpress.com',
        'Referer' => 'https://solifinexpress.com',
        'X-Forwarded-For' => '185.22.110.179',
        'X-Real-IP' => '185.22.110.179',
    ],
    'curl' => [
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, // Force IPv4
    ],
]);
```

**Explications** :
- `User-Agent` : Identifie votre application auprès de SerdiPay
- `Origin` et `Referer` : Indiquent le domaine source de la requête
- `X-Forwarded-For` et `X-Real-IP` : Transmettent l'IP réelle du serveur (important si vous passez par un proxy)
- `CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4` : Force l'utilisation d'IPv4 (SerdiPay peut ne pas accepter IPv6)

### 2. Logs détaillés pour le débogage

#### Au démarrage du service (lignes 34-40)
```php
Log::info('SerdiPay Service Initialization', [
    'base_url' => $this->baseUrl,
    'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
    'domain' => env('APP_URL', 'unknown'),
]);
```

#### Lors de l'authentification (lignes 77-98)
- Log de la tentative d'authentification
- Log de la réponse complète avec headers
- Log du token mis en cache

#### Lors des erreurs (lignes 119-142)
- Détails complets de la requête et de la réponse
- Informations du serveur (IP, host, remote_addr)
- Headers de la requête et de la réponse

### 3. Logs pour les paiements (lignes 218-258)
- Log avant initiation du paiement
- Log du payload complet
- Log de la réponse de l'API

## Actions à effectuer

### 1. Vérifier la configuration chez SerdiPay
Dans votre dashboard SerdiPay, assurez-vous que :
- ✅ IP `185.22.110.179` est ajoutée à la whitelist
- ✅ Domaine `solifinexpress.com` est ajouté (ou `*.solifinexpress.com`)
- ✅ Les changements sont sauvegardés et propagés (délai de 5-15 min)

### 2. Vérifier les variables d'environnement (.env)
```env
SERDIPAY_BASE_TEST_URL=https://api.kenzo.serdipay.cloud/api/public-api/v1
SERDIPAY_API_ID=votre_api_id
SERDIPAY_API_PASSWORD=votre_api_password
SERDIPAY_MERCHANT_CODE=votre_merchant_code
SERDIPAY_MERCHANT_PIN=votre_merchant_pin
APP_URL=https://solifinexpress.com
```

### 3. Vérifier la configuration dans config/app.php
```php
'serdipay_email' => env('SERDIPAY_EMAIL'),
'serdipay_password' => env('SERDIPAY_PASSWORD'),
```

Ajoutez dans `.env` :
```env
SERDIPAY_EMAIL=votre_email@example.com
SERDIPAY_PASSWORD=votre_mot_de_passe
```

### 4. Tester depuis le serveur
Connectez-vous en SSH à votre serveur et exécutez :

```bash
# Vérifier l'IP publique vue par l'extérieur
curl https://api.ipify.org

# Tester la connexion à SerdiPay
curl -X POST https://api.kenzo.serdipay.cloud/api/public-api/v1/merchant/get-token \
  -H "Content-Type: application/json" \
  -H "Origin: https://solifinexpress.com" \
  -H "Referer: https://solifinexpress.com" \
  -d '{"email":"votre_email","password":"votre_password"}'
```

### 5. Consulter les logs Laravel
```bash
tail -f storage/logs/laravel.log
```

Recherchez les entrées :
- `SerdiPay Service Initialization` : Informations au démarrage
- `SerdiPay authentication attempt` : Tentatives d'authentification
- `SerdiPay authentication response` : Réponses de l'API
- `SerdiPay authentication failed` : Échecs avec détails

## Cas particuliers PlanetHoster

### ⚠️ PROBLÈME IDENTIFIÉ : IP Interne vs IP Publique

**Situation découverte** :
- IP interne du serveur (vue par PHP) : `10.123.3.57`
- IP publique (vue par curl) : `185.22.110.179`
- SerdiPay voit l'IP interne `10.123.3.57` au lieu de l'IP publique

**Solution 1 : Ajouter l'IP interne à la whitelist SerdiPay (RECOMMANDÉ)**
Dans votre dashboard SerdiPay, ajoutez :

**IP à whitelister** :
- ✅ `185.22.110.179` (IP publique)
- ✅ `10.123.3.57` (IP interne - **IMPORTANT !**)

**Domaines à whitelister** :
- ✅ `www.solifinexpress.com` (avec www)
- ✅ `solifinexpress.com` (sans www)
- ✅ Ou utilisez `*.solifinexpress.com` pour couvrir tous les sous-domaines

**Solution 2 : Forcer l'utilisation de l'IP publique (IMPLÉMENTÉ)**
Le code a été modifié pour forcer l'utilisation de l'IP publique via :
```php
'curl' => [
    CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    CURLOPT_INTERFACE => '185.22.110.179', // Force l'IP publique
],
```

**Note** : Si `CURLOPT_INTERFACE` ne fonctionne pas (permissions serveur), vous DEVEZ ajouter l'IP interne `10.123.3.57` à la whitelist SerdiPay.

### Si vous utilisez un proxy/CDN
PlanetHoster utilise un reverse proxy. Dans ce cas :
1. L'IP vue par SerdiPay peut être celle du proxy, pas 185.22.110.179
2. Contactez le support PlanetHoster pour connaître les IP sortantes
3. Ajoutez toutes les IP possibles à la whitelist SerdiPay

### Si vous utilisez Cloudflare
1. Désactivez le proxy Cloudflare (nuage gris) pour votre domaine
2. Ou ajoutez les IP de Cloudflare à la whitelist SerdiPay

## Commandes de débogage utiles

### Vider le cache Laravel
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Tester l'authentification SerdiPay
```bash
php artisan tinker
```
Puis dans tinker :
```php
$service = new \App\Services\SerdiPayService();
$token = $service->getAuthToken();
dd($token);
```

## Contact support SerdiPay
Si le problème persiste, contactez le support SerdiPay avec :
- IP détectée : `curl https://api.ipify.org`
- Domaine : solifinexpress.com
- Timestamp de l'erreur (depuis les logs)
- Logs complets de la requête

## Checklist de vérification
- [ ] Variables d'environnement configurées
- [ ] IP 185.22.110.179 ajoutée chez SerdiPay
- [ ] Domaine solifinexpress.com ajouté chez SerdiPay
- [ ] Changements propagés (attendre 15 min)
- [ ] Cache Laravel vidé
- [ ] Logs consultés pour identifier l'IP réelle
- [ ] Test depuis le serveur effectué
- [ ] Pas de proxy/CDN intermédiaire (ou IP du proxy ajoutée)
