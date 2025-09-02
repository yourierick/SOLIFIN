<?php

/*
|--------------------------------------------------------------------------
| Configuration de Broadcasting - Migration vers Polling
|--------------------------------------------------------------------------
|
| Ce fichier a été modifié dans le cadre de la migration du système de chat
| de WebSockets vers un mécanisme de polling. Les configurations WebSocket
| ont été conservées mais désactivées, et le driver par défaut est défini
| sur 'null' pour éviter toute tentative de diffusion d'événements via WebSockets.
|
| Le système de chat utilise désormais exclusivement des requêtes HTTP
| périodiques (polling) pour récupérer les nouveaux messages et les
| notifications de frappe.
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | Cette option contrôle le broadcaster par défaut qui sera utilisé par le
    | framework lorsqu'un événement doit être diffusé. Nous utilisons 'null'
    | car le système de chat utilise maintenant le polling au lieu de WebSockets.
    |
    */

    'default' => 'null', // Utilisation de 'null' pour désactiver complètement le broadcasting

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the broadcast connections that will be used
    | to broadcast events to other systems or over websockets. Samples of
    | each available type of connection are provided inside this array.
    |
    */

    'connections' => [

        'reverb' => [
            'driver' => 'reverb',
            'app_id' => env('REVERB_APP_ID', 'solifin'),
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'client_options' => [
                'host' => env('REVERB_HOST', 'localhost'),
                'port' => env('REVERB_PORT', 8080),
                'scheme' => env('REVERB_SCHEME', 'http'),
            ],
            'options' => [
                'cluster' => env('REVERB_APP_CLUSTER', 'mt1'),
                'encrypted' => true,
                'host' => env('REVERB_HOST', '127.0.0.1'),
                'port' => env('REVERB_PORT', 8080),
                'scheme' => env('REVERB_SCHEME', 'http'),
                'curl_options' => [
                    CURLOPT_SSL_VERIFYHOST => 0,
                    CURLOPT_SSL_VERIFYPEER => 0,
                ],
            ],
        ],

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'cluster' => env('PUSHER_APP_CLUSTER'),
                'host' => env('PUSHER_HOST') ?: 'api-'.env('PUSHER_APP_CLUSTER', 'mt1').'.pusher.com',
                'port' => env('PUSHER_PORT', 443),
                'scheme' => env('PUSHER_SCHEME', 'https'),
                'encrypted' => true,
                'useTLS' => env('PUSHER_SCHEME', 'https') === 'https',
            ],
            'client_options' => [
                // Guzzle client options: https://docs.guzzlephp.org/en/stable/request-options.html
            ],
        ],

        'ably' => [
            'driver' => 'ably',
            'key' => env('ABLY_KEY'),
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
