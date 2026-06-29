<?php

namespace App\Http\Controllers;

use App\Traits\LogsActivity;
use Illuminate\Http\Request;

/**
 * CRUD para administrar el catálogo de modelos de vehículos en modelos_vehiculos.json.
 */
class VehiculoCatalogoController extends Controller
{
    use LogsActivity;

    private function getJsonPath()
    {
        return storage_path('app/public/modelos_vehiculos.json');
    }

    private function getItems()
    {
        $path = $this->getJsonPath();
        $existing = file_exists($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];

        // Catálogo vacío (instalación nueva o aún sin datos) → se siembra con
        // la lista base de vehículos comunes incluida en el repo, y se guarda
        // en storage para que los IDs queden estables.
        if (empty($existing)) {
            $seed = $this->seedData();
            if (!empty($seed)) {
                $this->saveItems($seed);
                return $seed;
            }
        }

        return $existing;
    }

    /** Lista base de modelos comunes incluida en el repo (database/data). */
    private function seedData(): array
    {
        $bundle = base_path('database/data/modelos_vehiculos.json');
        if (!file_exists($bundle)) {
            return [];
        }
        return json_decode(file_get_contents($bundle), true) ?: [];
    }

    private function saveItems(array $items)
    {
        $path = $this->getJsonPath();
        // Asegurar que exista la carpeta
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($path, json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    /**
     * Retorna la lista completa del catálogo.
     */
    public function index()
    {
        return response()->json($this->getItems());
    }

    /**
     * Guarda un nuevo modelo en el catálogo.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo'        => 'required|string|max:50',
            'marca'       => 'required|string|max:100',
            'modelo'      => 'required|string|max:100',
            'anio_inicio' => 'required|integer|min:1900|max:2100',
            'anio_fin'    => 'required|integer|min:1900|max:2100|gte:anio_inicio',
        ]);

        $items = $this->getItems();

        // Autogenerar ID único
        $maxId = 0;
        foreach ($items as $item) {
            if (isset($item['id']) && $item['id'] > $maxId) {
                $maxId = $item['id'];
            }
        }
        $newId = $maxId + 1;

        $newItem = [
            'id'          => $newId,
            'tipo'        => $data['tipo'],
            'marca'       => $data['marca'],
            'modelo'      => $data['modelo'],
            'anio_inicio' => (int) $data['anio_inicio'],
            'anio_fin'    => (int) $data['anio_fin'],
        ];

        $items[] = $newItem;
        $this->saveItems($items);

        $this->logActivity(
            'Catálogo Vehículos - Creado',
            "Se agregó el modelo: {$newItem['marca']} {$newItem['modelo']} ({$newItem['anio_inicio']}-{$newItem['anio_fin']})",
            'modelos_vehiculos',
            auth()->id()
        );

        return response()->json($newItem, 201);
    }

    /**
     * Actualiza un modelo del catálogo.
     */
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'tipo'        => 'required|string|max:50',
            'marca'       => 'required|string|max:100',
            'modelo'      => 'required|string|max:100',
            'anio_inicio' => 'required|integer|min:1900|max:2100',
            'anio_fin'    => 'required|integer|min:1900|max:2100|gte:anio_inicio',
        ]);

        $items = $this->getItems();
        $foundIndex = -1;

        foreach ($items as $index => $item) {
            if (isset($item['id']) && $item['id'] == $id) {
                $foundIndex = $index;
                break;
            }
        }

        if ($foundIndex === -1) {
            return response()->json(['message' => 'Modelo no encontrado en el catálogo'], 404);
        }

        $items[$foundIndex] = [
            'id'          => (int) $id,
            'tipo'        => $data['tipo'],
            'marca'       => $data['marca'],
            'modelo'      => $data['modelo'],
            'anio_inicio' => (int) $data['anio_inicio'],
            'anio_fin'    => (int) $data['anio_fin'],
        ];

        $this->saveItems($items);

        $this->logActivity(
            'Catálogo Vehículos - Actualizado',
            "Se actualizó el modelo ID {$id}: {$data['marca']} {$data['modelo']}",
            'modelos_vehiculos',
            auth()->id()
        );

        return response()->json($items[$foundIndex]);
    }

    /**
     * Elimina un modelo del catálogo.
     */
    public function destroy($id)
    {
        $items = $this->getItems();
        $foundIndex = -1;

        foreach ($items as $index => $item) {
            if (isset($item['id']) && $item['id'] == $id) {
                $foundIndex = $index;
                break;
            }
        }

        if ($foundIndex === -1) {
            return response()->json(['message' => 'Modelo no encontrado en el catálogo'], 404);
        }

        $removed = $items[$foundIndex];
        unset($items[$foundIndex]);

        $this->saveItems($items);

        $this->logActivity(
            'Catálogo Vehículos - Eliminado',
            "Se eliminó el modelo ID {$id}: {$removed['marca']} {$removed['modelo']}",
            'modelos_vehiculos',
            auth()->id()
        );

        return response()->json(['message' => 'Modelo eliminado correctamente']);
    }
}
