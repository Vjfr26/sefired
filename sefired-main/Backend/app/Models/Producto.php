<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Producto extends Model
{
    use SoftDeletes;

    protected $table = 'producto';
    public $timestamps = false;

    protected $fillable = [
        'parent_id',
        'nombre',
        'codigo',
        'tipo',
        'tipo_bien',
        'categoria',
        'tipo_calculo',
        'derecho_poliza',
        'descripcion',
        'cobertura',
        'prima',
        'moneda',
        'documento_path',
        'documentos',
        'documentos_requeridos',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'derecho_poliza'        => 'decimal:2',
            'cobertura'             => 'decimal:2',
            'prima'                 => 'decimal:2',
            'documentos'            => 'array',
            'documentos_requeridos' => 'array',
        ];
    }

    /** Producto padre (si este es un sub-tipo) */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'parent_id');
    }

    /** Sub-tipos asociados a este producto padre */
    public function subtipos(): HasMany
    {
        return $this->hasMany(Producto::class, 'parent_id');
    }

    public function tarifarios(): HasMany
    {
        return $this->hasMany(Tarifario::class, 'producto_id');
    }

    public function beneficios(): HasMany
    {
        return $this->hasMany(Beneficio::class, 'producto_id');
    }

    public function polizas(): HasMany
    {
        return $this->hasMany(Poliza::class, 'producto_id');
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(Solicitud::class, 'producto_id');
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'producto_id');
    }
}
