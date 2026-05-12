<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Beneficio extends Model
{
    protected $table = 'beneficios';
    public $timestamps = false;

    protected $fillable = [
        'producto_id',
        'descripcion',
        'monto',
    ];

    protected function casts(): array
    {
        return [
            'producto_id' => 'integer',
            'monto' => 'decimal:2',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
