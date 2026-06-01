<?php

return [
    'default' => env('DB_CONNECTION', 'mongodb'),
    'connections' => [
        'mongodb' => [
            'driver' => 'mongodb',
            'dsn' => env('MONGODB_URI', env('MONGODB_DSN')),
            'host' => env('MONGODB_HOST', env('DB_HOST')),
            'port' => env('MONGODB_PORT', env('DB_PORT')),
            'database' => env('MONGODB_DATABASE', 'travel_management'),
            'username' => env('MONGODB_USERNAME'),
            'password' => env('MONGODB_PASSWORD'),
            'options' => [
                'database' => env('MONGODB_AUTH_DATABASE', 'admin'),
            ],
        ],
    ],
];
