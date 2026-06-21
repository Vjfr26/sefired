<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Permite definir, por tipo de póliza (producto), si admite varios bienes
 * (ej. "hasta 5 vehículos") y si aplican beneficiarios — antes esto era
 * implícito e idéntico para cualquier producto, sin forma de que un admin
 * lo configurara al crear un nuevo tipo de póliza.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->boolean('permite_multiples_bienes')->default(false)->after('tipo_bien');
            $table->unsignedInteger('max_bienes')->nullable()->after('permite_multiples_bienes');
            $table->boolean('aplica_beneficiarios')->default(false)->after('max_bienes');
            $table->unsignedInteger('min_beneficiarios')->nullable()->after('aplica_beneficiarios');
            $table->unsignedInteger('max_beneficiarios')->nullable()->after('min_beneficiarios');
        });

        // Backfill de productos existentes según su tipo actual, para que la
        // nueva configuración refleje el comportamiento que ya tenían en la
        // práctica (vida individual ya admitía beneficiarios, por ejemplo).
        DB::table('producto')->where('tipo_bien', 'vehiculo')->update(['permite_multiples_bienes' => true]);
        DB::table('producto')->whereIn('tipo', ['vida'])->update(['aplica_beneficiarios' => true]);
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn(['permite_multiples_bienes', 'max_bienes', 'aplica_beneficiarios', 'min_beneficiarios', 'max_beneficiarios']);
        });
    }
};
