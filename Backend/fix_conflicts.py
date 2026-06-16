import os
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    state = 'NORMAL' # NORMAL, HEAD, THEIRS
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            state = 'HEAD'
            continue
        elif line.startswith('======='):
            state = 'THEIRS'
            continue
        elif line.startswith('>>>>>>>'):
            state = 'NORMAL'
            continue
            
        if state == 'NORMAL' or state == 'HEAD':
            new_lines.append(line)
            
    with open(filepath, 'w') as f:
        f.writelines(new_lines)

files = [
    'app/Models/SolicitudApov.php',
    'app/Models/Poliza.php',
    'app/Models/PolizaRcv.php',
    'app/Models/PolizaApov.php',
    'app/Models/Usuario.php',
    'app/Models/IndicadorEconomico.php',
    'app/Models/Solicitud.php',
    'app/Models/Vehiculo.php',
    'app/Models/Cliente.php',
    'app/Http/Controllers/AuthController.php',
    'routes/api.php'
]

for f in files:
    if os.path.exists(f):
        fix_file(f)
        print(f"Fixed {f}")
