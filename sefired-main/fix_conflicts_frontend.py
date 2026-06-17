import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    state = 'NORMAL'
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
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

files = [
    'FrontEnd_Interno/index.html',
    'FrontEnd_Interno/style.css',
    'FrontEnd_Interno/package-lock.json',
    'FrontEnd_Interno/main.js',
    'FrontEnd_Interno/vite.config.js',
    'FrontEnd_Interno/package.json'
]

for f in files:
    if os.path.exists(f):
        fix_file(f)
        print(f"Fixed {f}")
