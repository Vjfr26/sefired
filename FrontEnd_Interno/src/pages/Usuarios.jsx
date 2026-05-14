import { useState } from 'react'
import { Users, ShieldCheck, UserCheck, UserX, Pencil, Shield, UserCog, Lock, LockOpen, Trash2, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { badge, rsbadge } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'

const ROLES = ['Admin', 'Oficina', 'Vendedor Sucursal', 'Vendedor Calle']
const ROLE_COLOR = { 'Admin': 'indigo', 'Oficina': 'blue', 'Vendedor Sucursal': 'green', 'Vendedor Calle': 'amber' }

const USERS = [
  { init: 'CR', nom: 'Carlos Ruiz',      email: 'c.ruiz@sefired.com',     rol: 'Admin',             oficina: 'Caracas Principal', est: 'Activo',    ultimo: '07/05/2026 08:12' },
  { init: 'PS', nom: 'Pedro Salazar',    email: 'p.salazar@sefired.com',   rol: 'Oficina',           oficina: 'Caracas Principal', est: 'Activo',    ultimo: '07/05/2026 07:55' },
  { init: 'AS', nom: 'Ana Suárez',       email: 'a.suarez@sefired.com',    rol: 'Vendedor Sucursal', oficina: 'Valencia',          est: 'Activo',    ultimo: '06/05/2026 16:30' },
  { init: 'LR', nom: 'Luis Romero',      email: 'l.romero@sefired.com',    rol: 'Vendedor Calle',    oficina: 'Caracas Principal', est: 'Activo',    ultimo: '06/05/2026 14:15' },
  { init: 'VM', nom: 'Valentina Mora',   email: 'v.mora@sefired.com',      rol: 'Vendedor Sucursal', oficina: 'Maracaibo',         est: 'Bloqueado', ultimo: '02/05/2026 11:00' },
  { init: 'JG', nom: 'José González',    email: 'j.gonzalez@sefired.com',  rol: 'Vendedor Calle',    oficina: 'Valencia',          est: 'Activo',    ultimo: '05/05/2026 09:45' },
  { init: 'MT', nom: 'María Torres',     email: 'm.torres@sefired.com',    rol: 'Oficina',           oficina: 'Maracaibo',         est: 'Activo',    ultimo: '07/05/2026 08:00' },
  { init: 'RD', nom: 'Ricardo Díaz',     email: 'r.diaz@sefired.com',      rol: 'Vendedor Calle',    oficina: 'Caracas Principal', est: 'Bloqueado', ultimo: '28/04/2026 17:22' },
  { init: 'GF', nom: 'Gabriela Flores',  email: 'g.flores@sefired.com',    rol: 'Vendedor Sucursal', oficina: 'Caracas Principal', est: 'Activo',    ultimo: '07/05/2026 09:30' },
  { init: 'EM', nom: 'Eduardo Medina',   email: 'e.medina@sefired.com',    rol: 'Oficina',           oficina: 'Valencia',          est: 'Activo',    ultimo: '06/05/2026 15:50' },
]

const COLS = [
  { k: 'usr',    l: 'Usuario' },
  { k: 'rolb',   l: 'Rol',           hide: 'sm' },
  { k: 'oficina',l: 'Oficina',       hide: 'md', tr: true },
  { k: 'ultimo', l: 'Último acceso', hide: 'lg', nw: true },
  { k: 'estb',   l: 'Estado' },
  { k: 'acc',    l: '',              acc: true },
]

function UserActions({ u }) {
  const { showModal } = useApp()
  return (
    <div className="grid grid-cols-3 sm:flex sm:flex-nowrap gap-1.5 sm:gap-1 items-center justify-center">
      <button
        onClick={() => showModal('editUser', { nom: u.nom, email: u.email, rol: u.rol, oficina: u.oficina })}
        className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center" title="Editar">
        <Pencil className="w-5 h-5" />
      </button>
      <button
        onClick={() => showModal('userPerms', { nom: u.nom, rol: u.rol })}
        className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition inline-flex items-center justify-center" title="Permisos">
        <Shield className="w-5 h-5" />
      </button>
      <button
        onClick={() => showModal('changeRole', { nom: u.nom, currentRol: u.rol })}
        className="p-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center" title="Cambiar rol">
        <UserCog className="w-5 h-5" />
      </button>
      <button
        onClick={() => showModal('blockUser', { nom: u.nom, est: u.est })}
        className="p-1.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition inline-flex items-center justify-center"
        title={u.est === 'Activo' ? 'Bloquear' : 'Desbloquear'}>
        {u.est === 'Activo' ? <Lock className="w-5 h-5" /> : <LockOpen className="w-5 h-5" />}
      </button>
      <button
        onClick={() => showModal('confirmDelete', { name: u.nom })}
        className="p-1.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center" title="Eliminar">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

export default function Usuarios() {
  const { showModal } = useApp()
  const [chipActive, setChipActive] = useState(0)
  const [search, setSearch] = useState('')

  const byRole = ROLES.reduce((a, r) => ({ ...a, [r]: USERS.filter(u => u.rol === r).length }), {})
  const blocked = USERS.filter(u => u.est === 'Bloqueado').length

  const activeFilter = chipActive === 0 ? null : ROLES[chipActive - 1]
  const filtered = USERS.filter(u => {
    const matchRole = !activeFilter || u.rol === activeFilter
    const matchSearch = !search || u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) || u.rol.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const dataRows = filtered.map(u => ({
    usr: (
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${u.est === 'Bloqueado' ? 'bg-slate-300' : 'bg-sefired-blue'} flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shrink-0`}>
          {u.init}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-xs sm:text-sm break-words">{u.nom}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate">{u.email}</p>
        </div>
      </div>
    ),
    rolb: badge(u.rol, ROLE_COLOR[u.rol] || 'slate'),
    oficina: u.oficina,
    ultimo: u.ultimo,
    estb: rsbadge(u.est),
    acc: <UserActions u={u} />,
  }))

  return (
    <div className="animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Total Usuarios</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{USERS.length}</p>
            <p className="text-xs text-slate-400 mt-1">{USERS.length - blocked} activos</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Administradores</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{byRole['Admin']}</p>
            <p className="text-xs text-slate-400 mt-1">Acceso total</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Vendedores</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{byRole['Vendedor Sucursal'] + byRole['Vendedor Calle']}</p>
            <p className="text-xs text-slate-400 mt-1">Sucursal + Calle</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Bloqueados</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{blocked}</p>
            <p className="text-xs text-slate-400 mt-1">Sin acceso</p>
          </div>
        </div>
      </div>

      {/* Role filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['Todos', ...ROLES].map((r, i) => (
          <button key={r} onClick={() => setChipActive(i)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${i === chipActive
              ? 'bg-sefired-blue text-white border-sefired-blue'
              : 'bg-white text-slate-600 border-slate-200 hover:border-sefired-blue hover:text-sefired-blue'}`}>
            {r}{i > 0 ? ` · ${byRole[r]}` : ''}
          </button>
        ))}
      </div>

      <SearchBar
        placeholder="Buscar por nombre, email o rol…"
        onSearch={setSearch}
        extra={
          <button onClick={() => showModal('newUser', {})} className="btn-primary">
            <UserPlus className="w-4 h-4" />Nuevo Usuario
          </button>
        }
      />

      <DataTable cols={COLS} rows={dataRows} />
    </div>
  )
}
