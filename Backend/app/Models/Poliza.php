<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Support\Moneda;

/**
 * Representa una póliza de seguro emitida.
 *
 * Ciclo de vida del status:
 *   ACTIVA → póliza vigente dentro de su fecha de vencimiento
 *   VENCIDA → superó fecha_vencimiento sin renovarse
 *   ANULADA → cancelada antes del vencimiento
 *
 * Los montos se almacenan en dos monedas:
 *   total / cobertura_dolares → moneda nativa del producto, ver moneda_producto (no siempre USD)
 *   total_bs / cobertura_bs   → Bolívares (calculado con la tasa del día de emisión)
 *
 * `moneda_producto` (USD/BS/EUR) es la moneda en la que está denominado
 * `total`/`cobertura_dolares` — no confundir con `moneda`, que es la moneda
 * en la que el CLIENTE pagó (puede diferir, ver Moneda::convertir()).
 *
 * Ruta hasta el cliente dueño de esta póliza:
 *   $poliza->solicitud->persona
 */
class Poliza extends Model
{
    use SoftDeletes;

    protected $table = 'poliza';
    public $timestamps = false;

    protected $fillable = [
        'nro_contrato',
        'solicitud_id',
        'producto_id',
        'total',
        'total_bs',
        'tasa_emision',
        'tasa_emision_eur',
        'cobertura_dolares',
        'cobertura_bs',
        'pago',
        'frecuencia_pago',
        'moneda',
        'moneda_producto',
        'tipo',
        'asegurado_nombre',
        'asegurado_ci',
        'fecha_emision',
        'fecha_vencimiento',
        'nro_venezolana',
        'papeleria',
        'vendedor_id',
        'sede_poliza',
        'status',
        'created_by',
        'updated_by',
        'snapshot_datos',
        'tarifario_version_id',
    ];

    protected function casts(): array
    {
        return [
            'solicitud_id'         => 'integer',
            'producto_id'          => 'integer',
            'vendedor_id'          => 'integer',
            'total'                => 'decimal:2',
            'total_bs'             => 'decimal:2',
            'tasa_emision'         => 'decimal:4',
            'tasa_emision_eur'     => 'decimal:4',
            'cobertura_dolares'    => 'decimal:2',
            'cobertura_bs'         => 'decimal:2',
            'fecha_emision'        => 'date',
            'fecha_vencimiento'    => 'date',
            'snapshot_datos'       => 'array',
            'tarifario_version_id' => 'integer',
        ];
    }

    /** Solicitud que originó esta póliza (contiene el cliente y el vehículo) */
    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }

    /** Producto/cobertura contratado (APOV, RCV, HCM, etc.) */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    /** Vendedor que emitió la póliza (puede ser null si fue importada) */
    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'vendedor_id');
    }

    /** Facturas emitidas contra esta póliza */
    public function facturas(): HasMany
    {
        return $this->hasMany(Factura::class, 'poliza_id');
    }

    /** Comisión del vendedor generada por esta póliza (1 a 1) */
    public function comision(): HasOne
    {
        return $this->hasOne(Comision::class, 'poliza_id');
    }

    /** Beneficiarios registrados para pólizas de vida/muerte/accidente */
    public function beneficiarios(): HasMany
    {
        return $this->hasMany(Beneficiario::class, 'poliza_id');
    }

    /**
     * Bienes cubiertos por esta póliza (el original de la solicitud + los
     * agregados después). Ver App\Models\PolizaBien.
     */
    public function bienes(): HasMany
    {
        return $this->hasMany(PolizaBien::class, 'poliza_id');
    }

    /**
     * Cuotas mensuales (solo pólizas con frecuencia_pago='Mensual'). Ver
     * App\Models\Cuota y App\Support\Mensualidades.
     */
    public function cuotas(): HasMany
    {
        return $this->hasMany(Cuota::class, 'poliza_id');
    }

    /**
     * Bienes ADICIONALES (más allá del original de la solicitud, que no
     * tiene certificado propio) — usado por el cuadro póliza para mostrar
     * la sección "Bienes Adicionales" solo cuando aplica.
     * Requiere `bienes.bien` precargado para no disparar más queries.
     */
    public function bienesAdicionales()
    {
        return $this->bienes->filter(fn($pb) => $pb->certificado !== null);
    }

    /**
     * Número de recibo real (el de la factura asociada), distinto del
     * número de contrato de la póliza. Requiere `facturas` precargado.
     */
    public function numeroRecibo(): string
    {
        return $this->facturas->sortBy('id')->first()?->numero ?? $this->nro_contrato;
    }

    /**
     * true si esta póliza reemplazó a una anterior de la misma solicitud
     * (la anterior queda en status='RENOVADA') — para mostrar "RENOVACIÓN"
     * en vez de "EMISIÓN / ALTA" en el cuadro póliza.
     */
    public function esRenovacion(): bool
    {
        return (bool) ($this->solicitud_id && self::where('solicitud_id', $this->solicitud_id)
            ->where('id', '<', $this->id)
            ->where('status', 'RENOVADA')
            ->exists());
    }

    /**
     * Tarifa VIGENTE que le aplica a esta póliza (misma resolución que el
     * cuadro de coberturas del PDF): sigue el linaje de versiones desde la
     * referencia guardada; sin referencia (migradas) usa la única vigente del
     * producto, o el match por nombre de nivel "tipo / clase" del bien
     * asegurado (así se nombran las tarifas por nivel). Null si no se puede
     * determinar sin ambigüedad — con varias tarifas vigentes no se adivina.
     */
    public function tarifaVigente(): ?Tarifario
    {
        $snap = $this->snapshot_datos ?? [];
        $ref  = $this->tarifario_version_id
            ?? ($snap['coberturas']['tarifa']['id'] ?? null)
            ?? ($snap['tarifario']['id'] ?? null);
        if ($ref) {
            $tv   = Tarifario::find($ref);
            $hops = 0;
            while ($tv && $tv->estado !== 'vigente' && $hops++ < 20) {
                $tv = Tarifario::where('parent_id', $tv->id)->orderByDesc('version')->first();
            }
            if ($tv && $tv->estado === 'vigente' && is_array($tv->datos)) return $tv;
        }
        if (!$this->producto_id) return null;

        $vigentes = Tarifario::where('producto_id', $this->producto_id)
            ->where('estado', 'vigente')->where('activo', true)->limit(2)->get();
        if ($vigentes->count() === 1 && is_array($vigentes->first()->datos)) {
            return $vigentes->first();
        }

        $attrs = $this->solicitud?->bien?->atributos ?? ($snap['bien']['atributos'] ?? []);
        if (!empty($attrs['tipo']) && !empty($attrs['clase'])) {
            $nivel = mb_strtolower(trim($attrs['tipo']) . ' / ' . trim($attrs['clase']));
            $match = Tarifario::where('producto_id', $this->producto_id)
                ->where('estado', 'vigente')->where('activo', true)
                ->whereRaw('LOWER(nombre) = ?', [$nivel])
                ->limit(2)->get();
            if ($match->count() === 1 && is_array($match->first()->datos)) {
                return $match->first();
            }
        }

        return null;
    }

    /**
     * Total de RENOVACIÓN recotizado con la tarifa vigente: prima + IVA +
     * derecho de póliza — la misma fórmula con la que el Simulador cotiza una
     * emisión nueva. Null si la tarifa no se puede determinar o no tiene
     * prima cargada: en ese caso la renovación cobra el total anterior.
     */
    public function totalRenovacion(): ?array
    {
        $tarifa   = $this->tarifaVigente();
        $producto = $this->producto;
        if (!$tarifa || !$producto) return null;

        $d = $tarifa->datos;
        $prima = match ($producto->tipo_calculo) {
            'fijo'      => (float) ($d['prima_anual'] ?? $d['primaanual'] ?? $d['prima'] ?? 0),
            // Suma las primas de las coberturas nombradas del plan; las demás
            // entradas-array de datos (coberturas_pdf, _legacy) no traen 'prima'.
            'por_plan'  => collect($d)->reduce(fn ($s, $v) => $s + ((is_array($v) && isset($v['prima'])) ? (float) $v['prima'] : 0), 0.0),
            'por_nivel' => (float) ($d['prima'] ?? $d['prima_anual'] ?? $d['primaanual'] ?? 0),
            // El valor declarado del bien quedó en cobertura_dolares al emitir.
            'por_valor' => round(((float) $this->cobertura_dolares) * ((float) ($d['tasa_pct'] ?? 0)) / 100, 2),
            default     => 0.0,
        };
        if ($prima <= 0) return null;

        $ivaPct  = $producto->iva_aplica ? (float) ($producto->iva_porcentaje ?? 0) : 0.0;
        $iva     = round($prima * $ivaPct / 100, 2);
        $derecho = (float) ($producto->derecho_poliza ?? 0);

        return [
            'tarifa'  => $tarifa,
            'prima'   => round($prima, 2),
            'iva'     => $iva,
            'derecho' => $derecho,
            'total'   => round($prima + $iva + $derecho, 2),
        ];
    }

    /**
     * Moneda en la que está denominado total/cobertura_dolares. Pólizas
     * emitidas antes de moneda_producto caen al snapshot, luego al producto
     * en vivo, y por último a USD (correcto: históricamente todo se forzó a USD).
     */
    public function monedaNativa(): string
    {
        $snap = $this->snapshot_datos['producto']['moneda'] ?? null;

        return Moneda::normalizar(
            $this->moneda_producto ?? $snap ?? $this->producto?->moneda ?? 'USD'
        );
    }

    /** Saldo pendiente de las cuotas mensuales (0 si no es Mensual). */
    public function saldoCuotas(): float
    {
        if ($this->frecuencia_pago !== 'Mensual') {
            return 0.0;
        }
        return round($this->cuotas->sum(fn ($c) => max(0, (float) $c->monto - (float) $c->monto_pagado)), 2);
    }

    /**
     * ¿La póliza (mensual, vigente/vencida) tiene alguna cuota atrasada? Es
     * decir, una cuota cuyo vencimiento ya pasó y que aún tiene saldo pendiente.
     * Se usa para avisar en la tabla de clientes quién debe una cuota.
     */
    public function tieneCuotaAtrasada(): bool
    {
        if ($this->frecuencia_pago !== 'Mensual' || !in_array($this->status, ['ACTIVA', 'VENCIDA'], true)) {
            return false;
        }
        $hoy = now()->startOfDay();
        return $this->cuotas->contains(fn ($c) =>
            $c->fecha_vencimiento
            && $c->fecha_vencimiento->lt($hoy)
            && ((float) $c->monto - (float) $c->monto_pagado) > 0.001
        );
    }

    /** Cantidad de cuotas atrasadas (vencidas y con saldo). */
    public function cuotasAtrasadas(): int
    {
        if ($this->frecuencia_pago !== 'Mensual' || !in_array($this->status, ['ACTIVA', 'VENCIDA'], true)) {
            return 0;
        }
        $hoy = now()->startOfDay();
        return $this->cuotas->filter(fn ($c) =>
            $c->fecha_vencimiento
            && $c->fecha_vencimiento->lt($hoy)
            && ((float) $c->monto - (float) $c->monto_pagado) > 0.001
        )->count();
    }

    /**
     * Días antes del vencimiento desde los que se permite renovar:
     * 30 para pólizas anuales, 7 para mensuales (una VENCIDA siempre se puede).
     */
    public function ventanaRenovacionDias(): int
    {
        return $this->frecuencia_pago === 'Mensual' ? 7 : 30;
    }

    /** ¿Se puede renovar ahora? (ver motivoNoRenovable para la razón). */
    public function esRenovable(): bool
    {
        return $this->motivoNoRenovable() === null;
    }

    /**
     * ¿Se puede renovar anticipadamente (fuera de la ventana, previa
     * confirmación explícita del usuario)? Mantiene el resto de reglas:
     * solo ACTIVA/VENCIDA y mensuales sin saldo de cuotas.
     */
    public function esRenovableAnticipada(): bool
    {
        return $this->motivoNoRenovable(permitirAnticipada: true) === null;
    }

    /**
     * Razón por la que NO se puede renovar, o null si sí se puede. Reglas:
     *  - Solo ACTIVA (próxima a vencer) o VENCIDA.
     *  - Mensual: no debe quedar saldo de cuotas (saldar el contrato primero).
     *  - ACTIVA: debe estar dentro de la ventana (30 anual / 7 mensual),
     *    salvo que $permitirAnticipada sea true (renovación anticipada
     *    confirmada por el usuario).
     */
    public function motivoNoRenovable(bool $permitirAnticipada = false): ?string
    {
        if (!in_array($this->status, ['ACTIVA', 'VENCIDA'], true)) {
            return "No se puede renovar una póliza {$this->status}.";
        }
        if ($this->frecuencia_pago === 'Mensual' && $this->saldoCuotas() > 0.001) {
            return 'Debe saldar las cuotas pendientes antes de renovar.';
        }
        if ($this->status === 'VENCIDA') {
            return null; // vencida (sin saldo) siempre renovable
        }
        if ($permitirAnticipada || !$this->fecha_vencimiento) {
            return null;
        }
        $ventana = $this->ventanaRenovacionDias();
        $dias = now()->startOfDay()->diffInDays($this->fecha_vencimiento->copy()->startOfDay(), false);
        if ($dias > $ventana) {
            return "La póliza aún no está próxima a vencer (se puede renovar desde {$ventana} días antes).";
        }
        return null;
    }
}
