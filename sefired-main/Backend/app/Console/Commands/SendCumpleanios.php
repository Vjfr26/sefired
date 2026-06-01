<?php

namespace App\Console\Commands;

use App\Mail\CumpleaniosMail;
use App\Models\EmailLog;
use App\Models\Persona;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendCumpleanios extends Command
{
    protected $signature   = 'correos:cumpleanios';
    protected $description = 'Envía felicitaciones de cumpleaños a los clientes que cumplen hoy';

    public function handle(): void
    {
        $hoy = now();

        $personas = Persona::whereNotNull('correo')
            ->whereNotNull('nacimiento')
            ->where('activo', true)
            ->whereMonth('nacimiento', $hoy->month)
            ->whereDay('nacimiento', $hoy->day)
            ->get();

        foreach ($personas as $persona) {
            try {
                Mail::to($persona->correo)->send(new CumpleaniosMail($persona));
                EmailLog::registrar(
                    tipo: 'cumpleanios',
                    destinatario: $persona->correo,
                    asunto: '¡Feliz Cumpleaños!',
                    personaId: $persona->id,
                );
            } catch (\Throwable $e) {
                EmailLog::registrar(
                    tipo: 'cumpleanios',
                    destinatario: $persona->correo,
                    asunto: 'Error',
                    personaId: $persona->id,
                    status: 'error',
                    errorMsg: $e->getMessage(),
                );
            }
        }

        $this->info("Felicitaciones enviadas a {$personas->count()} cliente(s).");
    }
}
