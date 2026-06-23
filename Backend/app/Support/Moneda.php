<?php

namespace App\Support;

class Moneda
{
    /**
     * Colapsa los distintos vocabularios de moneda que conviven en el
     * proyecto (producto.moneda usa 'BS', pagos.*.moneda usa 'Bs.', datos
     * legacy pueden venir en minúscula) a un código canónico único.
     */
    public static function normalizar(?string $moneda): string
    {
        $m = mb_strtoupper(trim((string) $moneda));
        $m = str_replace(['.', ' '], '', $m);

        return match ($m) {
            'BS', 'BOLIVAR', 'BOLIVARES' => 'BS',
            'EUR', 'EURO', 'EUROS'       => 'EUR',
            'USD', 'DOLAR', 'DOLARES'    => 'USD',
            default                      => $m !== '' ? $m : 'USD',
        };
    }

    /** Convierte un monto entre monedas pivoteando por bolívares (Bs.). */
    public static function convertir(float $valor, ?string $desde, ?string $hacia, float $tasaUsd, float $tasaEur): float
    {
        $desde = self::normalizar($desde);
        $hacia = self::normalizar($hacia);
        if ($desde === $hacia) {
            return $valor;
        }

        $enBs = match ($desde) {
            'USD'   => $tasaUsd > 0 ? $valor * $tasaUsd : 0.0,
            'EUR'   => $tasaEur > 0 ? $valor * $tasaEur : 0.0,
            default => $valor,
        };

        return match ($hacia) {
            'USD'   => $tasaUsd > 0 ? $enBs / $tasaUsd : 0.0,
            'EUR'   => $tasaEur > 0 ? $enBs / $tasaEur : 0.0,
            default => $enBs,
        };
    }

    public static function aBs(float $valor, ?string $moneda, float $tasaUsd, float $tasaEur): float
    {
        return self::convertir($valor, $moneda, 'BS', $tasaUsd, $tasaEur);
    }

    public static function aUsd(float $valor, ?string $moneda, float $tasaUsd, float $tasaEur): float
    {
        return self::convertir($valor, $moneda, 'USD', $tasaUsd, $tasaEur);
    }

    public static function simbolo(?string $moneda): string
    {
        return match (self::normalizar($moneda)) {
            'BS'    => 'Bs. ',
            'EUR'   => '€',
            default => '$',
        };
    }

    public static function etiqueta(?string $moneda): string
    {
        return match (self::normalizar($moneda)) {
            'BS'    => 'BOLÍVARES',
            'EUR'   => 'EUROS',
            default => 'DÓLARES',
        };
    }
}
