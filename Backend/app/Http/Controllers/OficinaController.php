<?php

namespace App\Http\Controllers;

use App\Models\Oficina;
use App\Support\CodigoPoliza;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OficinaController extends Controller
{
    use LogsActivity;

    public function index()
    {
        return response()->json(
            Oficina::orderBy('nombre')->get(['id', 'nombre', 'codigo'])
        );
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // 60 = mismo límite que poliza.sede_poliza y retiro_efectivo.sede
            'nombre' => 'required|string|max:60',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 400);
        }

        $nombre = strip_tags(trim($request->nombre));

        // Duplicados por nombre normalizado (sin acentos, sin mayúsculas/
        // minúsculas) — "Mérida" y "MERIDA" serían la misma oficina.
        $clave = CodigoPoliza::normalizar($nombre);
        $existente = Oficina::all()->first(
            fn ($o) => CodigoPoliza::normalizar($o->nombre) === $clave
        );
        if ($existente) {
            return response()->json([
                'status'  => 'error',
                'message' => "Ya existe la oficina \"{$existente->nombre}\".",
            ], 422);
        }

        // Sin dígito de oficina: el código de póliza solo reserva 1 dígito y
        // hay más sedes que dígitos, así que las oficinas nuevas emiten con 0
        // — igual que producción desde siempre. Los dígitos existentes
        // (sedes históricas) se conservan; asignar uno nuevo es acción manual
        // en la BD si algún día se quiere.
        $oficina = Oficina::create(['nombre' => $nombre, 'codigo' => null]);

        $this->logActivity(
            'Creación de Oficina',
            "Se creó la oficina {$oficina->nombre}",
            'oficina',
            auth()->id()
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Oficina creada correctamente',
            'data'    => $oficina->only(['id', 'nombre', 'codigo']),
        ], 201);
    }
}
