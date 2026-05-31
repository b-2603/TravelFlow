<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use MongoDB\Database;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        $this->refreshMongoDatabase();
    }

    protected function refreshMongoDatabase(): void
    {
        if (! app()->environment('testing')) {
            return;
        }

        try {
            $connection = DB::connection('mongodb');

            if (method_exists($connection, 'getDatabase')) {
                $database = $connection->getDatabase();

                if ($database instanceof Database) {
                    $database->drop();
                }
            }
        } catch (\Throwable $e) {
            // Let any MongoDB connection issues fail the test normally.
        }
    }
}
