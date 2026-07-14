<?php

namespace App\Models;

use App\Support\CodigoPoliza;
use Illuminate\Database\Eloquent\Model;

/**
 * Oficina/sede de la empresa. `codigo` es el dígito (1-9) que ocupa la
 * primera posición del código de póliza — ver CodigoPoliza. `nombre` es el
 * texto que se guarda en usuarios.sede y poliza.sede_poliza.
 */
class Oficina extends Model
{
    protected $table = 'oficina';

    protected $fillable = [
        'nombre',
        'codigo',
    ];

    protected function casts(): array
    {
        return [
            'codigo' => 'integer',
        ];
    }

    /**
     * Borra la oficina si quedó huérfana: sin ningún usuario asignado y sin
     * pólizas emitidas con esa sede. Las pólizas (incluso soft-borradas)
     * protegen a la oficina: su dígito sigue haciendo falta para renovaciones
     * y para que el catálogo explique los códigos ya emitidos. Se llama
     * cuando un usuario deja la sede (edición o eliminación).
     *
     * @return bool true si la oficina se eliminó del catálogo.
     */
    public static function eliminarSiHuerfana(?string $sede): bool
    {
        if (!$sede) {
            return false;
        }

        $clave = CodigoPoliza::normalizar($sede);
        $oficina = self::all()->first(
            fn ($o) => CodigoPoliza::normalizar($o->nombre) === $clave
        );
        if (!$oficina) {
            return false;
        }

        $igualSede = fn ($s) => CodigoPoliza::normalizar($s) === $clave;
        $enUso = Usuario::query()->pluck('sede')->contains($igualSede)
            || Poliza::withTrashed()->distinct()->pluck('sede_poliza')->contains($igualSede);
        if ($enUso) {
            return false;
        }

        $oficina->delete();

        return true;
    }
}
