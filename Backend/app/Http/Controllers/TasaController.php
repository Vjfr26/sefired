<?php

namespace App\Http\Controllers;

use App\Models\IndicadorEconomico;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

/**
 * CRUD de tasas de cambio BCV (USD y EUR) para el panel interno.
 *
 * Rutas en routes/api.php (prefijo /api):
 *   GET    /api/tasas          → estado actual (USD, EUR) + historial
 *   POST   /api/tasas          → registrar USD y EUR de un día
 *   PUT    /api/tasas/{id}     → corregir el valor de una tasa
 *   DELETE /api/tasas/{id}     → eliminar un registro del historial
 */
class TasaController extends Controller
{
    use LogsActivity;

    /**
     * Devuelve las tasas actuales y el historial de los últimos 60 días.
     *
     * La variación se calcula comparando el registro con el anterior del
     * mismo tipo de moneda, ordenado por fecha. Si no hay registro anterior
     * la variación es 0.
     */
    public function index()
    {
        // ── Tasas actuales (último registro por moneda) ───────────────────
        $usd = IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first();
        $eur = IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->first();

        // ── Historial de los últimos 60 días ─────────────────────────────
        $historial = IndicadorEconomico::tasaCambio()
            ->orderByDesc('fecha')
            ->orderByDesc('fecha_registro')
            ->limit(60)
            ->get()
            ->map(fn($r) => $this->formatRow($r));

        return response()->json([
            'usd'      => $usd ? $this->formatCurrent($usd) : null,
            'eur'      => $eur ? $this->formatCurrent($eur) : null,
            'historial' => $historial,
        ]);
    }

    /**
     * Registra o actualiza las tasas USD y EUR para una fecha (upsert).
     *
     * Si ya existen registros para esa fecha los sobreescribe, permitiendo
     * corregir las tasas del día sin tener que eliminarlas primero.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'fecha' => 'required|date|before_or_equal:today',
            'usd'   => 'required|numeric|min:0.0001',
            'eur'   => 'required|numeric|min:0.0001',
        ]);

        // updateOrCreate: busca por (tipo + moneda + fecha) y actualiza valor; crea si no existe
        $registroUsd = IndicadorEconomico::updateOrCreate(
            ['tipo' => 'tasa_cambio', 'moneda' => 'USD', 'fecha' => $data['fecha']],
            ['valor' => $data['usd']]
        );

        $registroEur = IndicadorEconomico::updateOrCreate(
            ['tipo' => 'tasa_cambio', 'moneda' => 'EUR', 'fecha' => $data['fecha']],
            ['valor' => $data['eur']]
        );

        $this->logActivity(
            'Tasas Registradas',
            "Tasas del {$data['fecha']} → USD {$data['usd']} / EUR {$data['eur']}",
            'indicador_economico',
            auth()->id()
        );

        return response()->json([
            'usd'  => $this->formatRow($registroUsd),
            'eur'  => $this->formatRow($registroEur),
        ], 201);
    }

    /**
     * Corrige el valor de una tasa ya registrada.
     * Solo se puede modificar el valor; la fecha y moneda son inmutables.
     */
    public function update(Request $request, $id)
    {
        $tasa = IndicadorEconomico::tasaCambio()->findOrFail($id);

        $data = $request->validate([
            'valor' => 'required|numeric|min:0.0001',
        ]);

        $valorAnterior = $tasa->valor;
        $tasa->update(['valor' => $data['valor']]);

        $this->logActivity(
            'Tasa Corregida',
            "Tasa {$tasa->moneda} del " . $tasa->fecha?->format('d/m/Y') . " → {$valorAnterior} a {$data['valor']}",
            'indicador_economico',
            auth()->id()
        );

        return response()->json($this->formatRow($tasa->fresh()));
    }

    /**
     * Elimina un registro del historial de tasas.
     */
    public function destroy($id)
    {
        $tasa = IndicadorEconomico::tasaCambio()->findOrFail($id);
        $detalle = "{$tasa->moneda} del " . $tasa->fecha?->format('d/m/Y') . " (valor {$tasa->valor})";
        $tasa->delete();

        $this->logActivity('Tasa Eliminada', "Tasa {$detalle}", 'indicador_economico', auth()->id());

        return response()->json(['message' => 'Tasa eliminada correctamente']);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /**
     * Formatea una tasa para los cards de "tasa actual" en el frontend.
     * Incluye variación respecto al día anterior para la misma moneda.
     */
    private function formatCurrent(IndicadorEconomico $tasa): array
    {
        return [
            'id'        => $tasa->id,
            'valor'     => (float) $tasa->valor,
            'fecha'     => $tasa->fecha?->format('d/m/Y'),
            'hora'      => $tasa->fecha_registro->format('h:i A'),
            'variacion' => $this->calcVariacion($tasa),
        ];
    }

    /**
     * Formatea una tasa para las filas del historial.
     */
    private function formatRow(IndicadorEconomico $tasa): array
    {
        $variacion = $this->calcVariacion($tasa);
        $signo     = $variacion >= 0 ? '+' : '';
        $color     = $variacion > 0 ? 'green' : ($variacion < 0 ? 'red' : 'slate');

        return [
            'id'        => $tasa->id,
            'fecha'     => $tasa->fecha?->format('d/m/Y') ?? '—',
            'moneda'    => $tasa->moneda,
            'valor'     => number_format((float) $tasa->valor, 4),
            'variacion' => $signo . number_format($variacion, 2) . '%',
            'var_color' => $color,
        ];
    }

    /**
     * Calcula la variación porcentual respecto al registro anterior de la misma moneda.
     * Retorna 0 si no hay registro anterior.
     */
    private function calcVariacion(IndicadorEconomico $tasa): float
    {
        if (! $tasa->fecha) {
            return 0.0;
        }

        $anterior = IndicadorEconomico::where('tipo', 'tasa_cambio')
            ->where('moneda', $tasa->moneda)
            ->where('fecha', '<', $tasa->fecha)
            ->orderByDesc('fecha')
            ->first();

        if (! $anterior || (float) $anterior->valor == 0) {
            return 0.0;
        }

        return round(((float) $tasa->valor - (float) $anterior->valor) / (float) $anterior->valor * 100, 2);
    }
}
