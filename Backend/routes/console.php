<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Correos programados ────────────────────────────────────────────────────
Schedule::command('correos:renovacion')  ->dailyAt('09:00')->timezone('America/Caracas');
Schedule::command('correos:cumpleanios') ->dailyAt('08:00')->timezone('America/Caracas');
Schedule::command('correos:reporte-interno')->weeklyOn(1, '08:00')->timezone('America/Caracas');
Schedule::command('reportes:enviar-programados')->everyFifteenMinutes()->timezone('America/Caracas')->withoutOverlapping();
Schedule::command('queue:work --stop-when-empty')->everyMinute()->withoutOverlapping();
