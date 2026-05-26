<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliente', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('persona_id')->unique('uq_cliente_persona');

            $table->foreign('persona_id', 'fk_cliente_persona')
                  ->references('id')->on('persona')
                  ->onDelete('cascade')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente');
    }
};
