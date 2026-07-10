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
            Oficina::orderBy('codigo')->get(['id', 'nombre', 'codigo'])
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

        // El código de póliza reserva un solo dígito para la oficina.
        $codigo = ((int) Oficina::max('codigo')) + 1;
        if ($codigo > 9) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Se alcanzó el máximo de 9 oficinas (el código de póliza usa un solo dígito de oficina).',
            ], 422);
        }

        $oficina = Oficina::create(['nombre' => $nombre, 'codigo' => $codigo]);

        $this->logActivity(
            'Creación de Oficina',
            "Se creó la oficina {$oficina->nombre} (código {$oficina->codigo})",
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
