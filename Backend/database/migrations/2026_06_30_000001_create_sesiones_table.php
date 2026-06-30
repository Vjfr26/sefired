<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sesiones por token de API — una fila por sesión/dispositivo, desacopladas de
 * la fila del usuario. Reemplaza el `api_token` único en `usuarios`:
 *  - habilita política de concurrencia configurable (1 + takeover por defecto),
 *  - el "último visto" se escribe aquí y no en `usuarios` (menos contención),
 *  - permite listar/cerrar sesiones y forzar logout desde el admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sesiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();      // sha256 hex del token
            $table->json('device_fingerprint')->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->string('ip_inicial', 45)->nullable();  // IP del login
            $table->string('ip', 45)->nullable();          // última IP vista
            $table->timestamp('created_at')->useCurrent(); // ancla del tope absoluto
            $table->timestamp('ultimo_visto')->nullable();
            $table->timestamp('expira_en')->nullable();    // ventana de inactividad

            $table->index('usuario_id');
            $table->index('expira_en');                    // para la purga
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sesiones');
    }
};
