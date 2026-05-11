<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    protected $table = 'producto';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'cobertura',
        'prima',
        'moneda',
    ];

    protected function casts(): array
    {
        return [
            'cobertura' => 'decimal:2',
            'prima' => 'decimal:2',
        ];
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
