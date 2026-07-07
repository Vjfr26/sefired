<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

/**
 * Máquina de estados formal para solicitudes y pólizas.
 *
 * Define qué transiciones son válidas y lanza una excepción HTTP
 * cuando se intenta una transición no permitida.
 *
 * Solicitud:
 *   en_revision → aprobado | rechazado
 *   aprobado    → emitida  | rechazado
 *   rechazado   → (terminal)
 *   emitida     → (terminal — solo se puede cambiar por emitir())
 *
 * Póliza:
 *   ACTIVA    → VENCIDA | ANULADA | SUSPENDIDA | RENOVADA
 *   SUSPENDIDA→ ACTIVA  | ANULADA
 *   VENCIDA   → RENOVADA
 *   ANULADA   → (terminal)
 *   RENOVADA  → (terminal)
 */
class WorkflowService
{
    private const SOLICITUD_TRANSITIONS = [
        // 'pendiente' es el estado inicial: la evaluación de underwriting la mueve
        // a en_revision (con observación), aprobado (sin observación) o rechazado.
        'pendiente'   => ['en_revision', 'aprobado', 'rechazado'],
        'en_revision' => ['aprobado', 'rechazado'],
        'aprobado'    => ['emitida', 'rechazado', 'en_revision'],
        'rechazado'   => [],
        'emitida'     => ['vencida'],
        // Estado histórico de la migración: póliza emitida cuya fecha de
        // vencimiento ya pasó. Terminal (no admite transiciones desde la app).
        'vencida'     => [],
    ];

    private const POLIZA_TRANSITIONS = [
        'ACTIVA'     => ['VENCIDA', 'ANULADA', 'SUSPENDIDA', 'RENOVADA'],
        'SUSPENDIDA' => ['ACTIVA',  'ANULADA'],
        'VENCIDA'    => ['RENOVADA'],
        'ANULADA'    => [],
        'RENOVADA'   => [],
    ];

    public static function canTransitionSolicitud(string $from, string $to): bool
    {
        return in_array($to, self::SOLICITUD_TRANSITIONS[$from] ?? [], true);
    }

    public static function canTransitionPoliza(string $from, string $to): bool
    {
        return in_array($to, self::POLIZA_TRANSITIONS[$from] ?? [], true);
    }

    /**
     * Lanza ValidationException si la transición de solicitud no es válida.
     * Se usa ValidationException para que Laravel devuelva 422 con el mismo
     * formato que los errores de validación de Request::validate().
     */
    public static function assertSolicitud(string $from, string $to): void
    {
        if (!static::canTransitionSolicitud($from, $to)) {
            $allowed = implode(', ', self::SOLICITUD_TRANSITIONS[$from] ?? []);
            $msg     = "La cotización no puede pasar de '{$from}' a '{$to}'.";
            $msg    .= $allowed ? " Transiciones válidas: {$allowed}." : " El estado '{$from}' es terminal.";
            throw ValidationException::withMessages(['status' => $msg]);
        }
    }

    /**
     * Lanza ValidationException si la transición de póliza no es válida.
     */
    public static function assertPoliza(string $from, string $to): void
    {
        if (!static::canTransitionPoliza($from, $to)) {
            $allowed = implode(', ', self::POLIZA_TRANSITIONS[$from] ?? []);
            $msg     = "La póliza no puede pasar de '{$from}' a '{$to}'.";
            $msg    .= $allowed ? " Transiciones válidas: {$allowed}." : " El estado '{$from}' es terminal.";
            throw ValidationException::withMessages(['status' => $msg]);
        }
    }

    /** Devuelve los estados destino posibles para una solicitud en el estado dado. */
    public static function solicitudNext(string $from): array
    {
        return self::SOLICITUD_TRANSITIONS[$from] ?? [];
    }

    /** Devuelve los estados destino posibles para una póliza en el estado dado. */
    public static function polizaNext(string $from): array
    {
        return self::POLIZA_TRANSITIONS[$from] ?? [];
    }
}
