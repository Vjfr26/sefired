<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudApov extends Model
{
    protected $table = 'solicitud_apov';
    protected $primaryKey = 'solicitud_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'solicitud_id',
        'plan_elegido',
    ];

    protected function casts(): array
    {
        return [
            'solicitud_id' => 'integer',
        ];
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(Solicitud::class, 'solicitud_id');
    }
}
