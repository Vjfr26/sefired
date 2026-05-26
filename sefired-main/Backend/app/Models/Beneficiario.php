<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Beneficiario extends Model
{
    protected $table = 'beneficiarios';

    protected $fillable = [
        'poliza_id',
        'nombre',
        'cedula',
        'parentesco',
        'porcentaje',
    ];

    protected function casts(): array
    {
        return [
            'poliza_id'  => 'integer',
            'porcentaje' => 'decimal:2',
        ];
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }
}
