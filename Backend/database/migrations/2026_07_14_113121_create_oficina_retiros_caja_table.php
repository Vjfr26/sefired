<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('oficina_retiros_caja', function (Blueprint $table) {
            $table->id();
            $table->string('sede', 60);
            $table->decimal('monto_bs', 18, 2)->default(0.00);
            $table->decimal('monto_usd', 18, 2)->default(0.00);
            $table->decimal('monto_eur', 18, 2)->default(0.00);
            $table->text('observaciones')->nullable();
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->timestamps();

            $table->foreign('usuario_id', 'fk_oficina_retiros_usuario')
                  ->references('id')->on('usuarios')->onDelete('set null');
        });

        Schema::table('poliza', function (Blueprint $table) {
            $table->unsignedBigInteger('retiro_caja_id')->nullable()->after('status');
            $table->foreign('retiro_caja_id', 'fk_poliza_retiro_caja')
                  ->references('id')->on('oficina_retiros_caja')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropForeign('fk_poliza_retiro_caja');
            $table->dropColumn('retiro_caja_id');
        });

        Schema::dropIfExists('oficina_retiros_caja');
    }
};
