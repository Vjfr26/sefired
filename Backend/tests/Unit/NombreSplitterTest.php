<?php

namespace Tests\Unit;

use App\Support\NombreSplitter;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class NombreSplitterTest extends TestCase
{
    /**
     * @return array<string, array{0: string, 1: array<int, string>}>
     */
    public static function nombres(): array
    {
        // [nombre completo, [primer nombre, segundo nombre, primer apellido, segundo apellido]]
        return [
            // El caso reportado: la partícula se queda con su nombre.
            'partícula en el segundo nombre' => [
                'MAYBELINES DEL CARMEN BASTARDO RODRIGUEZ',
                ['MAYBELINES', 'DEL CARMEN', 'BASTARDO', 'RODRIGUEZ'],
            ],
            'partícula encadenada en el nombre' => [
                'JOSE DE LA CRUZ MARTINEZ SUAREZ',
                ['JOSE', 'DE LA CRUZ', 'MARTINEZ', 'SUAREZ'],
            ],
            'partícula en el primer apellido' => [
                'ANA MARIA DE LA ROSA PEREZ',
                ['ANA', 'MARIA', 'DE LA ROSA', 'PEREZ'],
            ],
            'partícula en el segundo apellido' => [
                'CARLOS ALBERTO PEREZ DEL VALLE',
                ['CARLOS', 'ALBERTO', 'PEREZ', 'DEL VALLE'],
            ],
            'apellido árabe con El' => [
                'SAMIR JOSE EL SAYEGH NAZAR',
                ['SAMIR', 'JOSE', 'EL SAYEGH', 'NAZAR'],
            ],
            'partícula italiana' => [
                'LUIS ENRIQUE DI STEFANO ROJAS',
                ['LUIS', 'ENRIQUE', 'DI STEFANO', 'ROJAS'],
            ],
            'minúsculas y acentos' => [
                'María del Carmen Bastardo Rodríguez',
                ['María', 'del Carmen', 'Bastardo', 'Rodríguez'],
            ],
            'abreviatura con punto' => [
                'ROSA MARIA VDA. DE PEREZ GOMEZ',
                ['ROSA', 'MARIA', 'VDA. DE PEREZ', 'GOMEZ'],
            ],
            // Sin partículas: el reparto de siempre, intacto.
            'cuatro palabras' => [
                'PEDRO LUIS GONZALEZ SILVA',
                ['PEDRO', 'LUIS', 'GONZALEZ', 'SILVA'],
            ],
            'tres palabras' => [
                'PEDRO GONZALEZ SILVA',
                ['PEDRO', '', 'GONZALEZ', 'SILVA'],
            ],
            'dos palabras' => [
                'PEDRO GONZALEZ',
                ['PEDRO', '', 'GONZALEZ', ''],
            ],
            'una palabra' => [
                'PEDRO',
                ['PEDRO', '', '', ''],
            ],
            'más de cuatro: el resto va al segundo apellido' => [
                'PEDRO LUIS GONZALEZ SILVA MARQUEZ',
                ['PEDRO', 'LUIS', 'GONZALEZ', 'SILVA MARQUEZ'],
            ],
            'espacios de sobra' => [
                '  PEDRO   LUIS  GONZALEZ SILVA ',
                ['PEDRO', 'LUIS', 'GONZALEZ', 'SILVA'],
            ],
            'vacío' => ['', ['', '', '', '']],
            // Nombre truncado: la partícula suelta no debe pasar por apellido.
            'termina en partícula' => [
                'PEDRO LUIS GONZALEZ DE',
                ['PEDRO', '', 'LUIS', 'GONZALEZ DE'],
            ],
            'solo una partícula' => ['DE LA', ['DE LA', '', '', '']],
        ];
    }

    /** @param array<int, string> $esperado */
    #[DataProvider('nombres')]
    public function test_desglosa_nombres_venezolanos(string $completo, array $esperado): void
    {
        $this->assertSame([
            'primer_nombre'    => $esperado[0],
            'segundo_nombre'   => $esperado[1],
            'primer_apellido'  => $esperado[2],
            'segundo_apellido' => $esperado[3],
        ], NombreSplitter::desglose($completo));
    }

    public function test_partes_une_nombres_y_apellidos(): void
    {
        $this->assertSame(
            ['nombres' => 'MAYBELINES DEL CARMEN', 'apellidos' => 'BASTARDO RODRIGUEZ'],
            NombreSplitter::partes('MAYBELINES DEL CARMEN BASTARDO RODRIGUEZ')
        );
    }

    public function test_acepta_null(): void
    {
        $this->assertSame(
            ['primer_nombre' => '', 'segundo_nombre' => '', 'primer_apellido' => '', 'segundo_apellido' => ''],
            NombreSplitter::desglose(null)
        );
    }
}
