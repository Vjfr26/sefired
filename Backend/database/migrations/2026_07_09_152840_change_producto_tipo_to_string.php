<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the columns 'tipo', 'categoria', and 'tipo_bien' in the 'producto' table.
        // We use raw SQL to ensure maximum compatibility and stability.
        DB::statement("ALTER TABLE producto MODIFY COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'otro'");
        DB::statement("ALTER TABLE producto MODIFY COLUMN categoria VARCHAR(50) NULL DEFAULT NULL");
        DB::statement("ALTER TABLE producto MODIFY COLUMN tipo_bien VARCHAR(50) NOT NULL DEFAULT 'ninguno'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert it back to the original values.
        DB::statement("ALTER TABLE producto MODIFY COLUMN tipo ENUM('rcv','apov','alpd','ec','ep','vida','salud','hogar','accidentes','funeraria','otro') NOT NULL DEFAULT 'otro'");
        DB::statement("ALTER TABLE producto MODIFY COLUMN categoria VARCHAR(30) NULL DEFAULT NULL");
        DB::statement("ALTER TABLE producto MODIFY COLUMN tipo_bien VARCHAR(30) NOT NULL DEFAULT 'ninguno'");
    }
};
