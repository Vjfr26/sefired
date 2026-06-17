#!/usr/bin/env python3
"""
Extrae y adapta los INSERT del dump de XAMPP para la estructura actual de Docker.
- Omite tablas que no existen en el esquema actual
- Filtra columnas que ya no existen
- Adapta solicitud: cliente_id→persona_id, elimina placa, agrega fuente/bien_asegurado_id
"""
import re
import subprocess

SRC = "/home/victor/Downloads/sefired (3).sql"
DST = "/home/victor/Documents/Proyectos/jym/BD/data_import.sql"

SKIP_TABLES = {"cliente", "vehiculo", "modelo_vehiculo", "migrations"}

CLIENTE_PERSONA = {1: 1, 2: 2, 3: 3}


def get_current_columns(table: str) -> list:
    """Obtiene las columnas actuales de la tabla en Docker."""
    result = subprocess.run(
        ["docker", "exec", "sefired-db", "mysql", "-u", "root", "-psecret",
         "sefired", "-e", f"SHOW COLUMNS FROM `{table}`;", "--skip-column-names"],
        capture_output=True, text=True, errors='replace'
    )
    if result.returncode != 0:
        return []
    cols = []
    for line in result.stdout.strip().split('\n'):
        if line:
            cols.append(line.split('\t')[0])
    return cols


def parse_insert_rows(insert_sql: str) -> tuple:
    """Parsea un INSERT y devuelve (columnas, filas_como_listas_de_strings)."""
    col_match = re.search(r'INSERT\s+(?:IGNORE\s+)?INTO\s+`\w+`\s*\(([^)]+)\)', insert_sql)
    if not col_match:
        return [], []
    orig_cols = [c.strip().strip('`') for c in col_match.group(1).split(',')]

    values_match = re.search(r'VALUES\s*(.*)', insert_sql, re.DOTALL)
    if not values_match:
        return orig_cols, []

    values_str = values_match.group(1).strip().rstrip(';').strip()

    rows = []
    depth = 0
    current = []
    in_string = False
    escape_next = False
    string_char = None
    buf = ""

    for ch in values_str:
        if escape_next:
            buf += ch
            escape_next = False
            continue
        if ch == '\\' and in_string:
            buf += ch
            escape_next = True
            continue
        if in_string:
            buf += ch
            if ch == string_char:
                in_string = False
            continue
        if ch in ("'", '"'):
            in_string = True
            string_char = ch
            buf += ch
            continue
        if ch == '(':
            if depth == 0:
                buf = ""
            else:
                buf += ch
            depth += 1
            continue
        if ch == ')':
            depth -= 1
            if depth == 0:
                current.append(buf.strip())
                rows.append(current)
                current = []
                buf = ""
            else:
                buf += ch
            continue
        if ch == ',' and depth == 1:
            current.append(buf.strip())
            buf = ""
            continue
        buf += ch

    return orig_cols, rows


def adapt_insert(table: str, insert_sql: str, current_cols: list) -> str:
    """Filtra columnas y adapta el INSERT al esquema actual."""
    orig_cols, rows = parse_insert_rows(insert_sql)
    if not rows:
        return ""

    # Para solicitud, transformación especial
    if table == 'solicitud':
        return adapt_solicitud(orig_cols, rows, current_cols)

    # Columnas comunes entre dump y esquema actual
    common = [c for c in orig_cols if c in current_cols]
    common_idx = [orig_cols.index(c) for c in common]

    if not common:
        return ""

    new_rows = []
    for row in rows:
        if len(row) != len(orig_cols):
            continue
        vals = [row[i] for i in common_idx]
        new_rows.append(f"({', '.join(vals)})")

    if not new_rows:
        return ""

    cols_str = ', '.join(f'`{c}`' for c in common)
    return f"INSERT IGNORE INTO `{table}` ({cols_str}) VALUES\n" + ",\n".join(new_rows) + ";\n"


def adapt_solicitud(orig_cols: list, rows: list, current_cols: list) -> str:
    """Adapta solicitud: cliente_id→persona_id, elimina placa, agrega fuente."""
    new_cols = [c for c in current_cols if c != 'id']
    new_cols = ['id'] + new_cols  # id primero

    new_rows = []
    for row in rows:
        if len(row) != len(orig_cols):
            continue
        orig = dict(zip(orig_cols, row))

        # Mapear cliente_id → persona_id
        cliente_raw = orig.get('cliente_id', 'NULL')
        if cliente_raw == 'NULL':
            persona_id = 'NULL'
        else:
            try:
                cid = int(cliente_raw)
                persona_id = str(CLIENTE_PERSONA.get(cid, cid))
            except ValueError:
                persona_id = cliente_raw

        new_row_vals = []
        for col in new_cols:
            if col == 'persona_id':
                new_row_vals.append(persona_id)
            elif col == 'bien_asegurado_id':
                new_row_vals.append('NULL')
            elif col == 'fuente':
                new_row_vals.append("'interno'")
            elif col in orig:
                new_row_vals.append(orig[col])
            else:
                new_row_vals.append('NULL')

        new_rows.append(f"({', '.join(new_row_vals)})")

    if not new_rows:
        return ""

    cols_str = ', '.join(f'`{c}`' for c in new_cols)
    return f"INSERT IGNORE INTO `solicitud` ({cols_str}) VALUES\n" + ",\n".join(new_rows) + ";\n"


def extract_inserts(src: str) -> dict:
    with open(src, 'r', encoding='utf-8') as f:
        content = f.read()

    result = {}
    pattern = re.compile(r'INSERT INTO `(\w+)`.*?;\n', re.DOTALL)
    for m in pattern.finditer(content):
        table = m.group(1)
        if table not in result:
            result[table] = []
        result[table].append(m.group(0))
    return result


def main():
    inserts = extract_inserts(SRC)

    # Obtener tablas existentes en Docker
    existing = subprocess.run(
        ["docker", "exec", "sefired-db", "mysql", "-u", "root", "-psecret",
         "sefired", "-e", "SHOW TABLES;", "--skip-column-names"],
        capture_output=True, text=True
    )
    existing_tables = set(existing.stdout.strip().split('\n'))

    with open(DST, 'w', encoding='utf-8') as out:
        out.write("SET FOREIGN_KEY_CHECKS=0;\n\n")

        for table, blocks in inserts.items():
            if table in SKIP_TABLES:
                print(f"  OMITIDA:     {table}")
                continue

            if table not in existing_tables:
                print(f"  NO EXISTE:   {table} (omitida)")
                continue

            current_cols = get_current_columns(table)
            if not current_cols:
                print(f"  SIN COLS:    {table} (omitida)")
                continue

            label = "ADAPTADA" if table == 'solicitud' else "IMPORTANDO"
            print(f"  {label}:  {table}")

            for block in blocks:
                adapted = adapt_insert(table, block, current_cols)
                if adapted:
                    out.write(adapted + "\n")

        out.write("SET FOREIGN_KEY_CHECKS=1;\n")

    print(f"\nArchivo generado: {DST}")


if __name__ == '__main__':
    main()
