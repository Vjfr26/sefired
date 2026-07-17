<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Log;
use App\Models\Persona;
use App\Models\Poliza;
use App\Models\Producto;
use App\Models\Solicitud;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_usuario_logs_activity_and_audit(): void
    {
        $admin = Usuario::factory()->admin()->create([
            'nick' => 'admin_test'
        ]);
        $this->actingAs($admin);

        $usuario = Usuario::factory()->create([
            'nick' => 'user_to_delete'
        ]);

        $usuario->delete();

        // Check audit_log
        $this->assertDatabaseHas('audit_log', [
            'modelo' => 'Usuario',
            'modelo_id' => $usuario->id,
            'accion' => 'deleted',
            'usuario_id' => $admin->id,
        ]);

        // Check logs (activity log)
        $this->assertDatabaseHas('logs', [
            'accion' => 'Eliminación de Usuario',
            'tabla' => 'usuarios',
            'descripcion' => 'Se eliminó el usuario user_to_delete',
            'usuario_id' => $admin->id,
        ]);
    }

    public function test_deleting_persona_cascades_and_logs_all(): void
    {
        $admin = Usuario::factory()->admin()->create();
        $this->actingAs($admin);

        $persona = Persona::create([
            'cedula' => 'V-99999999',
            'nombre' => 'Test Client',
        ]);

        $producto = Producto::create([
            'nombre' => 'Test Product',
            'cobertura' => 1000.00,
            'prima' => 50.00,
        ]);

        $solicitud = Solicitud::create([
            'persona_id' => $persona->id,
            'producto_id' => $producto->id,
            'placa' => 'ABC123Y',
            'fecha_solicitud' => now(),
        ]);

        $poliza = Poliza::create([
            'nro_contrato' => 'POL-TEST-001',
            'solicitud_id' => $solicitud->id,
            'producto_id' => $producto->id,
            'total' => 120.00,
            'status' => 'ACTIVA',
            'pago' => 'Transferencia USD',
            'tipo' => 'Nuevo',
            'fecha_emision' => now()->toDateString(),
            'fecha_vencimiento' => now()->addYear()->toDateString(),
        ]);

        // Trigger cascade delete (replicates ClienteController@destroy logic)
        foreach ($persona->solicitudes as $sol) {
            foreach ($sol->polizas as $p) {
                $p->delete();
            }
            $sol->delete();
        }
        $persona->delete();

        // 1. Assert Persona (Client) deletion logs
        $this->assertDatabaseHas('audit_log', [
            'modelo' => 'Persona',
            'modelo_id' => $persona->id,
            'accion' => 'deleted',
        ]);
        $this->assertDatabaseHas('logs', [
            'accion' => 'eliminar_cliente',
            'tabla' => 'persona',
            'descripcion' => 'Cliente Test Client (CI V-99999999) eliminado',
        ]);

        // 2. Assert Solicitud deletion logs
        $this->assertDatabaseHas('audit_log', [
            'modelo' => 'Solicitud',
            'modelo_id' => $solicitud->id,
            'accion' => 'deleted',
        ]);
        $this->assertDatabaseHas('logs', [
            'accion' => 'eliminar_cotizacion',
            'tabla' => 'solicitud',
            'descripcion' => "Cotización #{$solicitud->id} eliminada",
        ]);

        // 3. Assert Poliza deletion logs
        $this->assertDatabaseHas('audit_log', [
            'modelo' => 'Poliza',
            'modelo_id' => $poliza->id,
            'accion' => 'deleted',
        ]);
        $this->assertDatabaseHas('logs', [
            'accion' => 'eliminar_poliza',
            'tabla' => 'poliza',
            'descripcion' => 'Póliza POL-TEST-001 eliminada',
        ]);
    }
}
