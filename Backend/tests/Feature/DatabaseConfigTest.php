<?php

namespace Tests\Feature;

use Tests\TestCase;

class DatabaseConfigTest extends TestCase
{
    public function test_database_connection_timezone_is_configured(): void
    {
        $this->assertEquals('-04:00', config('database.connections.mysql.timezone'));
        $this->assertEquals('-04:00', config('database.connections.mariadb.timezone'));
    }
}
