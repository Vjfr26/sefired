<?php

namespace App\Models;

use App\Models\UnderwritingEvaluacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Solicitud extends Model
{
    use SoftDeletes;

    protected $table = 'solicitud';
    public $timestamps = false;

    protected $fillable = [
        'persona_id',
        'bien_asegurado_id',
        'fuente',
        'producto_id',
        'tarifario_id',
        'total',
        'total_bs',
        'moneda_producto',
        'suma_cobertura_bs',
        'suma_prima_bs',
        'fecha_solicitud',
        'status',
        'vendedor_id',
        'coberturas',
        'nombre_tomador',
        'ci_tomador',
        'asegurado_nombre',
        'asegurado_ci',
        'asegurado_telefono',
        'asegurado_direccion',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'persona_id'        => 'integer',
            'bien_asegurado_id' => 'integer',
            'producto_id'       => 'integer',
            'tarifario_id'      => 'integer',
            'vendedor_id'       => 'integer',
            'total'             => 'decimal:2',
            'total_bs'          => 'decimal:2',
            'suma_cobertura_bs' => 'decimal:2',
            'suma_prima_bs'     => 'decimal:2',
            'fecha_solicitud'   => 'date',
            'coberturas'        => 'array',
        ];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function bien(): BelongsTo
    {
        return $this->belongsTo(BienAsegurado::class, 'bien_asegurado_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function tarifario(): BelongsTo
    {
        return $this->belongsTo(Tarifario::class, 'tarifario_id');
    }

    public function polizas(): HasMany
    {
        return $this->hasMany(Poliza::class, 'solicitud_id');
    }

    public function evaluaciones(): HasMany
    {
        return $this->hasMany(UnderwritingEvaluacion::class, 'solicitud_id');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'vendedor_id');
    }
}
