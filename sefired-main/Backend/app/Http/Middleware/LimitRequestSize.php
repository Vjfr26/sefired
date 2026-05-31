<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LimitRequestSize
{
    // Límite global: 25 MB. Cubre el peor caso legítimo (subida de archivos grandes).
    // Rechazamos en middleware antes de que PHP parsee el body completo.
    private const MAX_BYTES = 25 * 1024 * 1024;

    public function handle(Request $request, Closure $next): Response
    {
        $contentLength = $request->header('Content-Length');

        if ($contentLength !== null && (int) $contentLength > self::MAX_BYTES) {
            return response()->json([
                'message' => 'El cuerpo de la solicitud supera el límite permitido.',
            ], 413);
        }

        return $next($request);
    }
}
