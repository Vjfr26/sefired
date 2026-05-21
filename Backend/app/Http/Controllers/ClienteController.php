<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Persona;
use Illuminate\Http\Request;

/**
 * CRUD de clientes para el panel interno.
 *
 * Estructura de datos:
 *   cliente → persona (datos personales: cedula, nombre, telefono, correo)
 *   cliente → solicitudes → polizas (historial de pólizas contratadas)
 *
 * Rutas registradas en routes/api.php (prefijo /api, sin CSRF):
 *   GET    /api/clientes
 *   POST   /api/clientes
 *   PUT    /api/clientes/{id}
 *   DELETE /api/clientes/{id}
 */
class ClienteController extends Controller
{
    /**
     * Lista todos los clientes con el resumen de su última póliza.
     *
     * La cadena de relaciones es: cliente → solicitudes → polizas.
     * flatMap aplana las pólizas de todas las solicitudes de un cliente
     * para poder buscar la más reciente sin importar cuántas solicitudes tenga.
     *
     * Estado del cliente:
     *   - "Activo"   → tiene al menos una póliza con status = 'ACTIVA'
     *   - "Inactivo" → no tiene pólizas activas (puede tener vencidas)
     */
    public function index()
    {
        $clientes = Cliente::with(['persona', 'solicitudes.polizas'])
            ->get()
            ->map(function ($c) {
                // Aplana todas las pólizas del cliente sin importar cuántas solicitudes tenga
                $polizas = $c->solicitudes->flatMap->polizas;

                // La póliza activa determina si el cliente está "Activo" o "Inactivo"
                $activa  = $polizas->where('status', 'ACTIVA')->sortByDesc('fecha_emision')->first();

                // Si no hay activa, se muestra la última emitida (para renovación)
                $ultima  = $activa ?? $polizas->sortByDesc('fecha_emision')->first();

                $p = $c->persona;
                return [
                    // ── Campos de visualización en tabla ──
                    'id'    => $c->id,
                    'nom'   => $p->nombre,
                    'ci'    => $p->cedula,
                    // celular tiene prioridad sobre teléfono fijo para mostrar en tabla
                    'tel'   => $p->celular ?? $p->telefono ?? '—',
                    'email' => $p->correo ?? '—',
                    'activo' => (bool) $c->activo,
                    'est'   => !$c->activo ? 'Bloqueado' : ($activa ? 'Activo' : 'Inactivo'),
                    'pol'   => $ultima?->nro_contrato ?? '—',
                    'vig'   => $ultima
                        ? $ultima->fecha_emision->format('d/m/Y') . ' – ' . $ultima->fecha_vencimiento->format('d/m/Y')
                        : '—',
                    'prima' => $ultima ? '$' . number_format($ultima->total, 2) : '—',

                    // ── Campos completos de persona para pre-llenar el formulario de edición ──
                    'nombre'        => $p->nombre,
                    'cedula'        => $p->cedula,
                    'condicion'     => $p->condicion,
                    'sexo'          => $p->sexo,
                    'nacimiento'    => $p->nacimiento?->format('Y-m-d'),
                    'nacionalidad'  => $p->nacionalidad,
                    'telefono'      => $p->telefono,
                    'celular'       => $p->celular,
                    'correo'        => $p->correo,
                    'estado'        => $p->estado,
                    'ciudad'        => $p->ciudad,
                    'codigo_postal' => $p->codigo_postal,
                    'direccion'     => $p->direccion,
                    'profesion'     => $p->profesion,
                    'actividad'     => $p->actividad,
                ];
            });

        return response()->json($clientes);
    }

    /**
     * Crea un nuevo cliente.
     *
     * El diseño separa "persona" (datos generales reutilizables) de "cliente"
     * (rol dentro del sistema). Primero se crea la persona y luego se le asigna
     * el rol de cliente enlazándola mediante persona_id.
     *
     * La cédula debe ser única en la tabla persona; se valida aquí para devolver
     * un error claro antes de llegar a la DB.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'        => 'required|string|max:120',
            'cedula'        => 'required|string|max:20|unique:persona,cedula',
            'condicion'     => 'required|string|max:40',
            'sexo'          => 'required|string|max:15',
            'nacimiento'    => 'required|date',
            'nacionalidad'  => 'required|string|max:30',
            'telefono'      => 'nullable|string|max:20',
            'celular'       => 'nullable|string|max:20',
            'correo'        => 'required|email|max:100',
            'estado'        => 'required|string|max:70',
            'ciudad'        => 'required|string|max:60',
            'codigo_postal' => 'nullable|string|max:10',
            'direccion'     => 'required|string',
            'profesion'     => 'nullable|string|max:50',
            'actividad'     => 'nullable|string|max:50',
        ]);

        $persona = Persona::create($data);
        $cliente = Cliente::create(['persona_id' => $persona->id, 'activo' => true]);

        // El nuevo cliente arranca sin pólizas: est = Inactivo, pol/vig/prima = '—'
        return response()->json([
            'id'            => $cliente->id,
            'nom'           => $persona->nombre,
            'ci'            => $persona->cedula,
            'tel'           => $persona->celular ?? $persona->telefono ?? '—',
            'email'         => $persona->correo ?? '—',
            'activo'        => true,
            'est'           => 'Inactivo',
            'pol'           => '—',
            'vig'           => '—',
            'prima'         => '—',
            'nombre'        => $persona->nombre,
            'cedula'        => $persona->cedula,
            'condicion'     => $persona->condicion,
            'sexo'          => $persona->sexo,
            'nacimiento'    => $persona->nacimiento?->format('Y-m-d'),
            'nacionalidad'  => $persona->nacionalidad,
            'telefono'      => $persona->telefono,
            'celular'       => $persona->celular,
            'correo'        => $persona->correo,
            'estado'        => $persona->estado,
            'ciudad'        => $persona->ciudad,
            'codigo_postal' => $persona->codigo_postal,
            'direccion'     => $persona->direccion,
            'profesion'     => $persona->profesion,
            'actividad'     => $persona->actividad,
        ], 201);
    }

    /**
     * Actualiza los datos personales de un cliente.
     *
     * Solo se modifican los campos enviados en la request (PATCH semántico con PUT).
     * array_key_exists en lugar de isset() para permitir vaciar campos opcionales
     * enviando null explícitamente.
     *
     * La validación unique excluye la propia persona del cliente para que pueda
     * guardar sin cambiar su cédula (unique:tabla,columna,id_a_ignorar).
     */
    public function update(Request $request, $id)
    {
        $cliente = Cliente::with('persona')->findOrFail($id);

        $data = $request->validate([
            'nombre'        => 'sometimes|required|string|max:120',
            // Excluye el persona_id actual para no conflictar consigo mismo
            'cedula'        => 'sometimes|required|string|max:20|unique:persona,cedula,' . $cliente->persona_id,
            'condicion'     => 'sometimes|required|string|max:40',
            'sexo'          => 'sometimes|required|string|max:15',
            'nacimiento'    => 'sometimes|required|date',
            'nacionalidad'  => 'sometimes|required|string|max:30',
            'telefono'      => 'nullable|string|max:20',
            'celular'       => 'nullable|string|max:20',
            'correo'        => 'sometimes|required|email|max:100',
            'estado'        => 'sometimes|required|string|max:70',
            'ciudad'        => 'sometimes|required|string|max:60',
            'codigo_postal' => 'nullable|string|max:10',
            'direccion'     => 'sometimes|required|string',
            'profesion'     => 'nullable|string|max:50',
            'actividad'     => 'nullable|string|max:50',
        ]);

        // array_key_exists permite vaciar campos opcionales enviando null explícitamente
        $allowed = ['nombre','cedula','condicion','sexo','nacimiento','nacionalidad',
                    'telefono','celular','correo','estado','ciudad',
                    'codigo_postal','direccion','profesion','actividad'];

        $update = array_intersect_key($data, array_flip($allowed));

        $cliente->persona->update($update);

        return response()->json(['message' => 'Cliente actualizado correctamente']);
    }

    /**
     * Activa o desactiva un cliente (toggle del campo activo).
     *
     * Un cliente desactivado aparece como "Bloqueado" en el panel y no puede
     * operar, aunque sus pólizas y datos se conservan intactos.
     */
    public function toggle($id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->activo = !$cliente->activo;
        $cliente->save();

        $msg = $cliente->activo ? 'Cliente activado correctamente' : 'Cliente desactivado correctamente';
        return response()->json(['message' => $msg, 'activo' => (bool) $cliente->activo]);
    }

    /**
     * Elimina un cliente y su persona asociada.
     *
     * Se bloquea la eliminación si el cliente tiene solicitudes registradas
     * para preservar el historial de pólizas y facturas (integridad referencial).
     *
     * Se elimina la persona después del cliente porque la FK cliente→persona
     * tiene onDelete('cascade') en dirección contraria: si se elimina la persona
     * primero, el cascade borraría el cliente automáticamente, pero también podría
     * afectar a tomadores o conductores que compartan el mismo persona_id.
     */
    public function destroy($id)
    {
        $cliente = Cliente::with('solicitudes')->findOrFail($id);

        // Protege el historial: no se pueden borrar clientes con pólizas emitidas
        if ($cliente->solicitudes->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar un cliente con solicitudes o pólizas activas.'],
                409
            );
        }

        $personaId = $cliente->persona_id;
        $cliente->delete();
        Persona::destroy($personaId); // solo si no tiene otros roles (tomador, conductor)

        return response()->json(['message' => 'Cliente eliminado correctamente']);
    }
}
