<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ip_bloqueada', function (Blueprint $table) {
            $table->id();
            $table->string('ip', 45);
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('motivo', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique('ip');
            $table->index('usuario_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ip_bloqueada');
    }
};
