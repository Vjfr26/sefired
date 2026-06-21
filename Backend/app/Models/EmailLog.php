<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    protected $table = 'email_log';
    public $timestamps = false;

    protected $fillable = [
        'tipo', 'destinatario', 'asunto',
        'persona_id', 'poliza_id',
        'status', 'error_msg', 'sent_at',
    ];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }

    public function poliza(): BelongsTo
    {
        return $this->belongsTo(Poliza::class, 'poliza_id');
    }

    public static function registrar(
        string $tipo,
        string $destinatario,
        string $asunto,
        ?int   $personaId = null,
        ?int   $polizaId  = null,
        string $status    = 'enviado',
        ?string $errorMsg = null,
    ): void {
        static::create([
            'tipo'         => $tipo,
            'destinatario' => $destinatario,
            'asunto'       => $asunto,
            'persona_id'   => $personaId,
            'poliza_id'    => $polizaId,
            'status'       => $status,
            'error_msg'    => $errorMsg,
            'sent_at'      => now(),
        ]);
    }
}
