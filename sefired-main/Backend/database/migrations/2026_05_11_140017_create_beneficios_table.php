<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficios', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('producto_id');
            $table->string('descripcion', 100);
            $table->decimal('monto', 18, 2)->default(0.00);

            $table->unique(['producto_id', 'descripcion'], 'uq_beneficio_producto_desc');
            $table->foreign('producto_id', 'fk_beneficios_producto')
                  ->references('id')->on('producto')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficios');
    }
};
