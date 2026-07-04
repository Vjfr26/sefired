<?php

namespace App\Exports\Concerns;

/**
 * Permite que una exportación Excel elija qué columnas incluir (todo o
 * personalizado), igual que el reporte externo. La clase que lo usa debe
 * definir:
 *   - columnDefs(): array  → ['clave' => 'Encabezado', ...] en orden canónico
 *   - mapAssoc($row): array → ['clave' => valor, ...] para una fila
 *
 * El trait resuelve headings()/map() filtrando por las columnas elegidas.
 * NULL o todas seleccionadas = todas (no se fija formato).
 */
trait HasSelectableColumns
{
    /** Claves seleccionadas en orden, o null = todas. */
    protected ?array $selectedColumns = null;

    /** @return array<string,string> clave => encabezado, en orden */
    abstract public function columnDefs(): array;

    /** @return array<string,mixed> clave => valor para la fila dada */
    abstract protected function mapAssoc($row): array;

    /**
     * Normaliza la selección: solo claves válidas en el orden canónico; si están
     * todas (o no se pasó nada), queda null.
     */
    protected function initColumns(?array $columns): void
    {
        $todas = array_keys($this->columnDefs());
        if (is_array($columns) && count($columns) > 0) {
            $sel = array_values(array_filter($todas, fn ($k) => in_array($k, $columns, true)));
            $this->selectedColumns = (count($sel) === count($todas) || count($sel) === 0) ? null : $sel;
        } else {
            $this->selectedColumns = null;
        }
    }

    /** Claves a exportar, en orden (todas si no se personalizó). */
    protected function columnKeys(): array
    {
        return $this->selectedColumns ?? array_keys($this->columnDefs());
    }

    public function headings(): array
    {
        $defs = $this->columnDefs();
        return array_map(fn ($k) => $defs[$k], $this->columnKeys());
    }

    public function map($row): array
    {
        $vals = $this->mapAssoc($row);
        return array_map(fn ($k) => $vals[$k] ?? '', $this->columnKeys());
    }
}
