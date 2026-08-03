<?php

namespace App\Support;

class NombreSplitter
{
    /**
     * Partículas que no son un nombre ni un apellido por sí solas: se pegan a
     * la palabra que sigue. Sin esto "MARIA DEL CARMEN PEREZ GOMEZ" repartía
     * "DEL" como segundo nombre y "CARMEN" como primer apellido.
     * Encadenan entre sí ("DE LA ROSA" es una sola pieza).
     */
    private const PARTICULAS = [
        'de', 'del', 'la', 'las', 'los', 'el',
        'san', 'santa', 'santo', 'vda',
        // Apellidos de origen portugués, italiano, holandés y escocés que
        // también se registran en Venezuela.
        'da', 'das', 'do', 'dos', 'di', 'van', 'von', 'mac', 'mc', 'st', 'saint',
    ];

    /**
     * Separa un nombre completo venezolano en sus cuatro campos, asumiendo la
     * convención de 2 nombres + 2 apellidos cuando hay 4+ piezas, con reglas
     * de respaldo para 1-3.
     *
     * Con 3 piezas la convención no alcanza: "JOSE DE LA ROSA PEREZ" puede ser
     * un nombre con dos apellidos o dos nombres con uno solo. Se mantiene el
     * criterio de 1 nombre + 2 apellidos, que es lo habitual en cédulas
     * venezolanas. La única forma de resolverlo siempre es capturar los cuatro
     * campos por separado al registrar al cliente.
     *
     * @return array{primer_nombre: string, segundo_nombre: string, primer_apellido: string, segundo_apellido: string}
     */
    public static function desglose(?string $nombreCompleto): array
    {
        $piezas = self::piezas($nombreCompleto);
        $count  = count($piezas);

        $primerNombre = $segundoNombre = $primerApellido = $segundoApellido = '';

        if ($count === 1) {
            $primerNombre = $piezas[0];
        } elseif ($count === 2) {
            $primerNombre = $piezas[0];
            $primerApellido = $piezas[1];
        } elseif ($count === 3) {
            $primerNombre = $piezas[0];
            $primerApellido = $piezas[1];
            $segundoApellido = $piezas[2];
        } elseif ($count >= 4) {
            $primerNombre = $piezas[0];
            $segundoNombre = $piezas[1];
            $primerApellido = $piezas[2];
            $segundoApellido = implode(' ', array_slice($piezas, 3));
        }

        return [
            'primer_nombre'   => $primerNombre,
            'segundo_nombre'  => $segundoNombre,
            'primer_apellido' => $primerApellido,
            'segundo_apellido'=> $segundoApellido,
        ];
    }

    /**
     * Nombres y apellidos ya unidos, para los documentos que los muestran en
     * dos líneas (carnet del PDF de la póliza).
     */
    public static function partes(?string $nombreCompleto): array
    {
        $d = self::desglose($nombreCompleto);

        return [
            'nombres'   => trim("{$d['primer_nombre']} {$d['segundo_nombre']}"),
            'apellidos' => trim("{$d['primer_apellido']} {$d['segundo_apellido']}"),
        ];
    }

    /**
     * Palabras del nombre con las partículas ya pegadas a la que les sigue.
     * Una partícula al final (nombre truncado) se pega a la anterior para no
     * dejarla suelta como si fuera un apellido.
     *
     * @return array<int, string>
     */
    private static function piezas(?string $nombreCompleto): array
    {
        $palabras = array_values(array_filter(
            explode(' ', trim(preg_replace('/\s+/', ' ', $nombreCompleto ?? ''))),
            fn ($p) => $p !== ''
        ));

        $piezas = [];
        $pendiente = '';   // partículas acumuladas esperando su palabra

        foreach ($palabras as $palabra) {
            if (self::esParticula($palabra)) {
                $pendiente = $pendiente === '' ? $palabra : "{$pendiente} {$palabra}";
                continue;
            }
            $piezas[]  = $pendiente === '' ? $palabra : "{$pendiente} {$palabra}";
            $pendiente = '';
        }

        if ($pendiente !== '') {
            if ($piezas === []) {
                $piezas[] = $pendiente;
            } else {
                $piezas[count($piezas) - 1] .= " {$pendiente}";
            }
        }

        return $piezas;
    }

    /** Compara sin importar mayúsculas ni el punto de las abreviaturas ("Vda."). */
    private static function esParticula(string $palabra): bool
    {
        return in_array(rtrim(mb_strtolower($palabra), '.'), self::PARTICULAS, true);
    }
}
