<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitudes_renovacion_qr', function (Blueprint $table) {
            // Eliminar columnas de pago individual — reemplazadas por JSON
            $table->dropColumn(['metodo_pago', 'banco', 'referencia', 'monto', 'moneda']);

            // Datos personales ahora son opcionales: se toman del snapshot de la póliza
            $table->string('nombre', 100)->nullable()->change();
            $table->string('telefono', 30)->nullable()->change();

            // Array de pagos: [{ metodo, banco, referencia, monto, moneda }]
            $table->json('pagos')->after('correo');

            // Monto total en USD para referencia rápida en listados
            $table->decimal('total_usd_estimado', 18, 2)->nullable()->after('pagos');
        });
    }

    public function down(): void
    {
        Schema::table('solicitudes_renovacion_qr', function (Blueprint $table) {
            $table->dropColumn(['pagos', 'total_usd_estimado']);
            $table->string('metodo_pago', 50)->after('correo');
            $table->string('banco', 80)->nullable()->after('metodo_pago');
            $table->string('referencia', 100)->after('banco');
            $table->decimal('monto', 18, 2)->after('referencia');
            $table->string('moneda', 5)->after('monto');
            $table->string('nombre', 100)->nullable(false)->change();
            $table->string('telefono', 30)->nullable(false)->change();
        });
    }
};
