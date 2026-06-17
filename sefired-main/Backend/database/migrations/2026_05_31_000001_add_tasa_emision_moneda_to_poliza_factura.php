<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->decimal('tasa_emision', 18, 4)->default(1.0)->after('total_bs');
            $table->string('moneda', 5)->default('USD')->after('pago');
        });

        Schema::table('factura', function (Blueprint $table) {
            $table->string('moneda', 5)->default('USD')->after('forma_pago');
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropColumn(['tasa_emision', 'moneda']);
        });

        Schema::table('factura', function (Blueprint $table) {
            $table->dropColumn('moneda');
        });
    }
};
