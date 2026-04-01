<?php

return [
    'default' => env('DB_CONNECTION', 'mongodb'),

    'connections' => [
        'mongodb' => [
            'driver' => 'mongodb',
            'dsn' => env('MONGODB_URI'),
            'host' => env('MONGODB_HOST', '127.0.0.1'),
            'port' => (int) env('MONGODB_PORT', 27017),
            'database' => env('MONGODB_DATABASE', 'travel_management'),
            'username' => env('MONGODB_USERNAME'),
            'password' => env('MONGODB_PASSWORD'),
            'options' => [
                'database' => env('MONGODB_AUTH_DATABASE', 'admin'),
            ],
        ],
    ],
];
