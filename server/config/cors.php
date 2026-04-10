<?php

$defaultOrigins = array_values(array_filter([
    env('FRONTEND_URL'),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]));

$configuredOrigins = env('CORS_ALLOWED_ORIGINS');
$allowedOrigins = $configuredOrigins
    ? array_values(array_filter(array_map('trim', explode(',', $configuredOrigins))))
    : $defaultOrigins;

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
