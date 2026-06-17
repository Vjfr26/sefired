<?php

namespace App\Http\Controllers;

use App\Models\Vehiculo;
use Illuminate\Http\Request;

/**
 * CRUD de vehículos asegurados para el panel interno.
 *
 * Rutas en routes/api.php (prefijo /api):
 *   GET    /api/vehiculos          → listado con propietario y estado de cobertura
 *   POST   /api/vehiculos          → registrar nuevo vehículo
 *   PUT    /api/vehiculos/{id}     → editar datos del vehículo
 *   DELETE /api/vehiculos/{id}     → eliminar (bloqueado si tiene conductores registrados)
 *
 * El estado de cobertura se calcula dinámicamente:
 *   - "Cliente Bloqueado" → el propietario fue desactivado manualmente
 *   - "Activo"            → la placa tiene al menos una póliza con status='ACTIVA'
 *   - "Inactivo"          → no tiene pólizas activas o nunca tuvo ninguna
 *
 * Este cálculo no se almacena en la base de datos; se resuelve en cada consulta
 * recorriendo la cadena: vehiculo → solicitudes (por placa) → polizas.
 */
class VehiculoController extends Controller
{
    /**
     * Lista todos los vehículos con su propietario y estado de cobertura.
     * Los vehículos se ordenan del más reciente al más antiguo (por ID).
     */
    public function index()
    {
        $vehiculos = Vehiculo::with(['cliente.persona', 'modeloVehiculo', 'solicitudes.polizas'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn($v) => $this->formatRow($v));

        return response()->json($vehiculos);
    }

    /**
     * Registra un nuevo vehículo en el sistema.
     *
     * La placa debe ser única en toda la tabla. El año máximo permitido es
     * el año siguiente al actual (cubre modelos recién importados).
     * Todos los campos son obligatorios al registrar un vehículo nuevo.
     */
    public function store(Request $request)
    {
        $anioMax = (int) date('Y') + 1;

        $data = $request->validate([
            'cliente_id'           => 'required|integer|exists:cliente,id',
            'placa'                => 'required|string|max:10|unique:vehiculo,placa',
            'marca'                => 'required|string|max:50',
            'modelo'               => 'required|string|max:50',
            'anio'                 => "required|integer|min:1900|max:{$anioMax}",
            'color'                => 'required|string|max:30',
            'tipo'                 => 'required|string|max:80',
            'clase'                => 'required|string|max:80',
            'uso'                  => 'required|string|max:40',
            'peso'                 => 'required|integer|min:0',
            'puestos'              => 'required|integer|min:1|max:50',
            'aparcamiento'         => 'required|string|max:30',
            'serial_carroceria'    => 'required|string|max:40',
            'serial_motor'         => 'required|string|max:40',
            'fecha_adquisicion'    => 'required|date',
            'certificado_transito' => 'required|string|max:20',
            'certificado_origen'   => 'required|string|max:20',
            'titulo'               => 'required|string|max:180',
        ]);

        // Adaptación a la DB optimizada: Extraer marca/modelo a su tabla catálogo
        $modelo = \App\Models\ModeloVehiculo::firstOrCreate([
            'marca' => $data['marca'],
            'modelo' => $data['modelo'],
        ]);
        $data['modelo_vehiculo_id'] = $modelo->id;
        unset($data['marca'], $data['modelo']);

        // Adaptación a la DB optimizada: Enums
        $tiposValidos = ['sedan', 'coupe', 'hatchback', 'suv', 'pickup', 'furgoneta', 'moto', 'otro'];
        if (!in_array($data['tipo'], $tiposValidos)) $data['tipo'] = 'otro';

        $usosValidos = ['particular', 'carga', 'transporte_publico', 'rustico', 'otro'];
        if (!in_array($data['uso'], $usosValidos)) $data['uso'] = 'otro';

        $vehiculo = Vehiculo::create($data);

        return response()->json(
            $this->formatRow($vehiculo->load(['cliente.persona', 'modeloVehiculo'])),
            201
        );
    }

    /**
     * Actualiza los datos de un vehículo existente.
     *
     * Al editar, los campos son opcionales (sometimes): solo se actualiza
     * lo que se envía en la petición. La placa no puede repetirse pero
     * se excluye el propio vehículo de la validación unique para que
     * pueda guardarse sin cambiar la placa.
     */
    public function update(Request $request, $id)
    {
        $vehiculo = Vehiculo::findOrFail($id);
        $anioMax  = (int) date('Y') + 1;

        $data = $request->validate([
            'cliente_id'           => 'sometimes|integer|exists:cliente,id',
            'placa'                => "sometimes|string|max:10|unique:vehiculo,placa,{$vehiculo->id}",
            'marca'                => 'sometimes|required|string|max:50',
            'modelo'               => 'sometimes|required|string|max:50',
            'anio'                 => "sometimes|required|integer|min:1900|max:{$anioMax}",
            'color'                => 'nullable|string|max:30',
            'tipo'                 => 'nullable|string|max:80',
            'clase'                => 'nullable|string|max:80',
            'uso'                  => 'nullable|string|max:40',
            'peso'                 => 'nullable|integer|min:0',
            'puestos'              => 'nullable|integer|min:1|max:50',
            'aparcamiento'         => 'nullable|string|max:30',
            'serial_carroceria'    => 'nullable|string|max:40',
            'serial_motor'         => 'nullable|string|max:40',
            'fecha_adquisicion'    => 'sometimes|nullable|date',
            'certificado_transito' => 'nullable|string|max:20',
            'certificado_origen'   => 'nullable|string|max:20',
            'titulo'               => 'nullable|string|max:180',
        ]);

        if (isset($data['marca']) || isset($data['modelo'])) {
            $marca = $data['marca'] ?? $vehiculo->modeloVehiculo?->marca ?? 'Desconocida';
            $modeloTxt = $data['modelo'] ?? $vehiculo->modeloVehiculo?->modelo ?? 'Desconocido';
            
            $modeloVehiculo = \App\Models\ModeloVehiculo::firstOrCreate([
                'marca' => $marca,
                'modelo' => $modeloTxt,
            ]);
            $data['modelo_vehiculo_id'] = $modeloVehiculo->id;
            unset($data['marca'], $data['modelo']);
        }

        if (array_key_exists('tipo', $data)) {
            $tiposValidos = ['sedan', 'coupe', 'hatchback', 'suv', 'pickup', 'furgoneta', 'moto', 'otro'];
            if (!in_array($data['tipo'], $tiposValidos)) $data['tipo'] = 'otro';
        }

        if (array_key_exists('uso', $data)) {
            $usosValidos = ['particular', 'carga', 'transporte_publico', 'rustico', 'otro'];
            if (!in_array($data['uso'], $usosValidos)) $data['uso'] = 'otro';
        }

        $vehiculo->update($data);

        return response()->json(
            $this->formatRow($vehiculo->fresh()->load(['cliente.persona', 'modeloVehiculo']))
        );
    }

    /**
     * Elimina un vehículo del sistema.
     *
     * Se bloquea si el vehículo tiene conductores registrados para evitar
     * dejar registros huérfanos. Si el cliente ya no necesita el vehículo
     * primero deben eliminarse sus conductores.
     */
    public function destroy($id)
    {
        $vehiculo = Vehiculo::with('conductores')->findOrFail($id);

        if ($vehiculo->conductores->isNotEmpty()) {
            return response()->json(
                ['error' => 'No se puede eliminar un vehículo con conductores registrados.'],
                409
            );
        }

        $vehiculo->delete();

        return response()->json(['message' => 'Vehículo eliminado correctamente']);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /**
     * Construye el objeto de respuesta que espera el frontend para cada vehículo.
     *
     * El estado se determina mirando si alguna póliza de sus solicitudes
     * tiene status='ACTIVA'. Las relaciones deben estar cargadas (with/load)
     * antes de llamar a este método para evitar N+1 queries.
     */
    private function formatRow(Vehiculo $v): array
    {
        // Si el propietario está desactivado el vehículo no puede operar,
        // independientemente de si tiene pólizas activas o no.
        $clienteBloqueado = $v->cliente && $v->cliente->activo === false;

        // Aplana todas las pólizas del vehículo a través de sus solicitudes
        $polizas  = $v->solicitudes?->flatMap->polizas ?? collect();
        $esActivo = $polizas->where('status', 'ACTIVA')->isNotEmpty();

        return [
            'id'                   => $v->id,
            'cliente_id'           => $v->cliente_id,
            'propietario'          => $v->cliente?->persona?->nombre ?? '—',
            'cedula'               => $v->cliente?->persona?->cedula  ?? '—',
            'placa'                => $v->placa,
            'marca'                => $v->modeloVehiculo?->marca  ?? '',
            'modelo'               => $v->modeloVehiculo?->modelo ?? '',
            'clase'                => $v->clase  ?? '',
            'tipo'                 => $v->tipo   ?? '',
            'anio'                 => $v->anio,
            'uso'                  => $v->uso    ?? '',
            'color'                => $v->color  ?? '',
            'peso'                 => $v->peso,
            'puestos'              => $v->puestos,
            'aparcamiento'         => $v->aparcamiento         ?? '',
            'serial_carroceria'    => $v->serial_carroceria    ?? '',
            'serial_motor'         => $v->serial_motor         ?? '',
            'fecha_adquisicion'    => $v->fecha_adquisicion?->format('Y-m-d') ?? '',
            'certificado_transito' => $v->certificado_transito ?? '',
            'certificado_origen'   => $v->certificado_origen   ?? '',
            'titulo'               => $v->titulo               ?? '',
            'estado'               => $clienteBloqueado ? 'Bloqueado' : 'Activo',
        ];
    }
}
