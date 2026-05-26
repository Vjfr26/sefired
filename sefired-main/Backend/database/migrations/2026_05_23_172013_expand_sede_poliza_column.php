<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->string('sede_poliza', 60)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->string('sede_poliza', 10)->nullable()->change();
        });
    }
};
