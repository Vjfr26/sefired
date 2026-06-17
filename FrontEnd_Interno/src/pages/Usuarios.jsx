import { useState, useEffect, useCallback } from 'react'
import { Users, ShieldCheck, UserCheck, UserX, Pencil, Shield, UserCog, Lock, LockOpen, Trash2, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { badge, rsbadge, UserAvatar } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { SkeletonStatCards } from '../components/Skeleton.jsx'
import { fetchUsuarios, deleteUsuario, toggleUserStatus } from '../api/usuarios.js'

const ROLES = ['Admin', 'Oficina', 'Vendedor Sucursal', 'Vendedor Calle']
const ROLE_COLOR = { 'Admin': 'indigo', 'Oficina': 'blue', 'Vendedor Sucursal': 'green', 'Vendedor Calle': 'amber' }

const fmtId = id => 'USR-' + String(id).padStart(4, '0')

const COLS_BASE = [
  { k: 'displayId', l: 'ID',              m: true, bold: true, hide: 'xl' },
  { k: 'usr',       l: 'Usuario' },
  { k: 'rolb',      l: 'Rol',             hide: 'sm' },
  { k: 'oficina',   l: 'Oficina',         hide: 'lg', tr: true },
  { k: 'conexion',  l: 'Última Conexión', hide: 'lg', nw: true },
  { k: 'motivo',    l: 'Motivo Bloqueo',  hide: 'xl', nw: true },
  { k: 'estb',      l: 'Estado',          nw: true },
  { k: 'acc',       l: '',                acc: true },
]

function UserActions({ u, onReload }) {
  const { showModal, canAct } = useApp()
  const estado = u.activo ? 'Activo' : 'Bloqueado'

  const loggedInUser = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const isMe = loggedInUser?.id === u.id

  const canEdit       = canAct('usuarios', 'edit')
  const canPerms      = canAct('usuarios', 'perms')
  const canChangeRole = canAct('usuarios', 'change_role')
  const canBlock      = canAct('usuarios', 'block')
  const canDelete     = canAct('usuarios', 'delete')

  const BTN_COLOR = {
    blue:   'bg-blue-50 text-blue-600 hover:bg-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    amber:  'bg-amber-50 text-amber-600 hover:bg-amber-100',
    rose:   'bg-rose-50 text-rose-600 hover:bg-rose-100',
  }
  const btn = (color, title, onClick, Icon) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 sm:p-2 rounded-lg ${BTN_COLOR[color] ?? BTN_COLOR.blue} transition inline-flex items-center justify-center`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
  )

  return (
    <div className="flex flex-wrap gap-1 items-center justify-center">
      {canEdit       && btn('blue',   'Editar',       () => showModal('editUser',   { user: u, onSave: onReload }), Pencil)}
      {canPerms      && btn('indigo', 'Permisos',     () => showModal('userPerms',  { user: u, onSave: onReload }), Shield)}
      {canChangeRole && btn('amber',  'Cambiar rol',  () => showModal('changeRole', { user: u, onSave: onReload }), UserCog)}
      {canBlock && (
        <button
          title={estado === 'Activo' ? 'Bloquear' : 'Desbloquear'}
          onClick={() => showModal('blockUser', {
            nom: u.nombre,
            est: estado,
            onConfirm: async (motivo) => { await toggleUserStatus(u.id, { motivo }); onReload() },
          })}
          className="p-1.5 sm:p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition inline-flex items-center justify-center"
        >
          {estado === 'Activo'
            ? <Lock   className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            : <LockOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      )}
      {canDelete && !isMe && btn('rose', 'Eliminar', () => showModal('confirmDelete', {
        name: u.nombre,
        onConfirm: async () => { await deleteUsuario(u.id); onReload() },
      }), Trash2)}
    </div>
  )
}

export default function Usuarios() {
  const { showModal, showToast, refreshUser, canAct } = useApp()
  const canCreateUser = canAct('usuarios', 'create')
  const [chipActive, setChipActive] = useState(0)
  const [search,     setSearch]     = useState('')
  const [usuarios,   setUsuarios]   = useState([])
  const [loading,    setLoading]    = useState(true)

  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchUsuarios()
      setUsuarios(res.data)
      refreshUser()
    } catch (err) {
      showToast(err.message || 'Error al cargar usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, refreshUser])

  useEffect(() => { loadUsuarios() }, [loadUsuarios])

  // ── Estadísticas ──
  const byRole  = ROLES.reduce((a, r) => ({ ...a, [r]: usuarios.filter(u => u.tipo === r).length }), {})
  const blocked = usuarios.filter(u => !u.activo).length

  // ── Filtrado ──
  const activeFilter = chipActive === 0 ? null : ROLES[chipActive - 1]
  const filtered = usuarios.filter(u => {
    const matchRole   = !activeFilter || u.tipo === activeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || u.nombre.toLowerCase().includes(q) ||
      u.nick.toLowerCase().includes(q) || u.tipo.toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  // ── Filas de la tabla ──
  const dataRows = filtered.map(u => {
    const estado = u.activo ? 'Activo' : 'Bloqueado'
    return {
      displayId: fmtId(u.id),
      usr: (
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <UserAvatar
            rol={u.tipo}
            genero={u.genero || 'M'}
            blocked={!u.activo}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl shrink-0"
          />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{u.nombre}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">@{u.nick}</p>
          </div>
        </div>
      ),
      rolb:     badge(u.tipo, ROLE_COLOR[u.tipo] || 'slate'),
      oficina:  u.sede || '—',
      conexion: u.ultima_conexion ? (
        <div>
          <p className="text-xs text-slate-700 font-medium">{u.ultima_conexion}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{u.ultimo_ip}</p>
        </div>
      ) : <span className="text-slate-300 text-xs">—</span>,
      motivo: !u.activo && u.motivo_bloqueo
        ? <span className="text-xs text-rose-500 max-w-[150px] block truncate" title={u.motivo_bloqueo}>{u.motivo_bloqueo}</span>
        : <span className="text-slate-300 text-xs">—</span>,
      estb: rsbadge(estado),
      acc:  <UserActions u={u} onReload={loadUsuarios} />,
    }
  })

  if (!canAct('usuarios', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Users className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Cards ── */}
      {loading ? <SkeletonStatCards count={4} /> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: 'Total Usuarios',    v: usuarios.length, sub: `${usuarios.length - blocked} activos`,      Icon: Users,      bg: 'bg-slate-100',  ic: 'text-slate-600'  },
          { l: 'Administradores',   v: byRole['Admin'], sub: 'Acceso total',                               Icon: ShieldCheck, bg: 'bg-indigo-100', ic: 'text-indigo-600' },
          { l: 'Vendedores',        v: (byRole['Vendedor Sucursal'] || 0) + (byRole['Vendedor Calle'] || 0), sub: 'Sucursal + Calle', Icon: UserCheck, bg: 'bg-emerald-100', ic: 'text-emerald-600' },
          { l: 'Bloqueados',        v: blocked,          sub: 'Sin acceso',                                Icon: UserX,      bg: 'bg-rose-100',   ic: 'text-rose-600'   },
        ].map(({ l, v, sub, Icon, bg, ic }) => (
          <div key={l} className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">{l}</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{v ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>}

      {/* ── Filtro por rol ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['Todos', ...ROLES].map((r, i) => (
          <button
            key={r}
            onClick={() => setChipActive(i)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              i === chipActive
                ? 'bg-jm-blue text-white border-jm-blue'
                : 'bg-white text-slate-600 border-slate-200 hover:border-jm-blue hover:text-jm-blue'
            }`}
          >
            {r}{i > 0 ? ` · ${byRole[r] ?? 0}` : ''}
          </button>
        ))}
      </div>

      <SearchBar
        placeholder="Buscar por nombre, nick o rol…"
        onSearch={setSearch}
        extra={
          canCreateUser && (
            <button
              onClick={() => showModal('newUser', { onSave: loadUsuarios })}
              className="btn-primary ml-auto"
            >
              <UserPlus className="w-4 h-4" />Nuevo Usuario
            </button>
          )
        }
      />

      <DataTable cols={COLS_BASE.filter(c => c.k !== 'motivo' || filtered.some(u => !u.activo))} rows={dataRows} loading={loading} />
    </div>
  )
}
