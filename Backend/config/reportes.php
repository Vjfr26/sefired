<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tope de pólizas por archivo del reporte externo
    |--------------------------------------------------------------------------
    |
    | PhpSpreadsheet arma la hoja COMPLETA en memoria antes de escribirla:
    | medido, cuesta unos 43 MB por cada 1.000 pólizas con las 48 columnas
    | (26 MB de celdas y 16 MB de modelos). Con el límite de 1 GB que fija el
    | controlador, el techo real ronda las 23.000 pólizas; pasado eso la
    | petición moría con un 500 sin explicación y el usuario solo veía
    | "Error al exportar reporte".
    |
    | Con el tope, el reporte responde qué pasó y cuánto acotar. Subirlo exige
    | subir también la memoria disponible del proceso.
    |
    */

    'max_polizas_export' => (int) env('REPORTE_EXTERNO_MAX_POLIZAS', 20000),

];
