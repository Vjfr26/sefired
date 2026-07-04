import { useState, useEffect, useCallback } from 'react'
import { Users, ShieldCheck, UserCheck, UserX, Pencil, Shield, UserCog, Lock, LockOpen, Trash2, UserPlus, Ban } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { badge, rsbadge, UserAvatar } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { SkeletonStatCards } from '../components/Skeleton.jsx'
import { fetchUsuarios, deleteUsuario, toggleUserStatus } from '../api/usuarios.js'
import { fetchIpsBloqueadas, desbloquearIp } from '../api/reports.js'

const ROLES = ['Admin', 'Oficina', 'Vendedor Sucursal', 'Vendedor Calle']
const ROLE_COLOR = { 'Admin': 'indigo', 'Oficina': 'blue', 'Vendedor Sucursal': 'green', 'Vendedor Calle': 'amber' }

const fmtId = id => 'USR-' + String(id).padStart(4, '0')

// Varias celdas son JSX (avatar, badges) y no se pueden ordenar directo; `s`
// apunta al campo crudo por el que ordena el DataTable al clic en el encabezado.
const COLS_BASE = [
  { k: 'displayId', l: 'ID',              m: true, bold: true, hide: 'xl' },
  { k: 'usr',       l: 'Usuario', primary: true, s: 'usr_sort' },
  { k: 'rolb',      l: 'Rol',             hide: 'sm', s: 'rolb_sort' },
  { k: 'oficina',   l: 'Oficina',         hide: 'lg', tr: true },
  { k: 'conexion',  l: 'Última Conexión', hide: 'lg', nw: true, s: 'conexion_sort' },
  { k: 'motivo',    l: 'Motivo Bloqueo',  hide: 'xl', nw: true, s: 'motivo_sort' },
  { k: 'estb',      l: 'Estado',          nw: true, s: 'estb_sort' },
  { k: 'acc',       l: '',                acc: true },
]

function UserActions({ u, onReload, mostrarScopeIp = true }) {
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
      className={`p-2.5 rounded-lg ${BTN_COLOR[color] ?? BTN_COLOR.blue} transition inline-flex items-center justify-center`}
    >
      <Icon className="w-[18px] h-[18px]" />
    </button>
  )

  return (
    <div className="flex gap-1.5 justify-center flex-wrap items-center">
      {canEdit       && btn('blue',   'Editar',       () => showModal('editUser',   { user: u, onSave: onReload }), Pencil)}
      {canPerms      && btn('indigo', 'Permisos',     () => showModal('userPerms',  { user: u, onSave: onReload }), Shield)}
      {canChangeRole && btn('amber',  'Cambiar rol',  () => showModal('changeRole', { user: u, onSave: onReload }), UserCog)}
      {canBlock && (
        <button
          title={estado === 'Activo' ? 'Bloquear' : 'Desbloquear'}
          onClick={() => estado === 'Activo'
            ? showModal('blockUser', {
                nom: u.nombre,
                est: estado,
                onConfirm: async (motivo) => { await toggleUserStatus(u.id, { motivo }); onReload() },
              })
            : showModal('desbloquearUsuario', {
                nom: u.nombre,
                mostrarScopeIp,
                onConfirm: async (scope) => { await toggleUserStatus(u.id, { scope }); onReload() },
              })}
          className="p-2.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition inline-flex items-center justify-center"
        >
          {estado === 'Activo'
            ? <Lock   className="w-[18px] h-[18px]" />
            : <LockOpen className="w-[18px] h-[18px]" />}
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
  const canViewCards  = canAct('usuarios', 'view_cards')
  const canViewList   = canAct('usuarios', 'view_list')
  const [chipActive, setChipActive] = useState(0)
  const [cardFilter, setCardFilter] = useState(null) // null | 'admin' | 'vendedores' | 'blocked' — filtro al hacer clic en una tarjeta
  const [search,     setSearch]     = useState('')
  const [usuarios,   setUsuarios]   = useState([])
  const [ipsBloqueadas, setIpsBloqueadas] = useState([])
  const [loading,    setLoading]    = useState(true)

  // Ver IPs bloqueadas requiere config.view_audit; desbloquear, config.manage_security.
  const canViewIps    = canAct('config', 'view_audit')
  const canUnblockIps = canAct('config', 'manage_security')

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

  const loadIps = useCallback(async () => {
    if (!canViewIps) return
    try {
      const res = await fetchIpsBloqueadas()
      setIpsBloqueadas(res.data || [])
    } catch { /* silencioso */ }
  }, [canViewIps])

  useEffect(() => { loadUsuarios(); loadIps() }, [loadUsuarios, loadIps])

  // Refresco en vivo (sin spinner) cada 15s: refleja en tiempo real los cambios
  // que sufre la página sin recargar — usuarios que se conectan/desconectan, se
  // bloquean, cambian de IP, y las IPs que se bloquean/desbloquean.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const [u, ips] = await Promise.all([
          fetchUsuarios(),
          canViewIps ? fetchIpsBloqueadas().catch(() => null) : Promise.resolve(null),
        ])
        setUsuarios(u.data)
        if (ips) setIpsBloqueadas(ips.data || [])
      } catch { /* silencioso: un fallo puntual no debe interrumpir la vista */ }
    }, 15_000)
    return () => clearInterval(id)
  }, [canViewIps])

  // Tras bloquear/desbloquear/editar un usuario se recargan usuarios E IPs, para
  // que el panel de IPs refleje al instante (sin esperar el poll) la IP que se
  // acaba de bloquear/soltar.
  const reloadTablas = useCallback(() => { loadUsuarios(); loadIps() }, [loadUsuarios, loadIps])

  const handleUnblockIp = (ip) => {
    showModal('confirmAction', {
      title: 'Desbloquear IP',
      message: `La IP ${ip.ip} podrá volver a intentar iniciar sesión.`,
      icon: LockOpen,
      color: 'emerald',
      confirmLabel: 'Desbloquear',
      onConfirm: async () => {
        await desbloquearIp(ip.id)
        showToast(`IP ${ip.ip} desbloqueada`, 'success')
        loadIps()
      },
    })
  }

  // ── Estadísticas ──
  const byRole  = ROLES.reduce((a, r) => ({ ...a, [r]: usuarios.filter(u => u.tipo === r).length }), {})
  const blocked = usuarios.filter(u => !u.activo).length

  // ── Filtrado ──
  // El filtro por tarjeta (estado/grupo) y el chip de rol son excluyentes:
  // clic en una tarjeta limpia el chip y viceversa.
  const activeFilter = chipActive === 0 ? null : ROLES[chipActive - 1]
  const matchCard = (u) => {
    if (cardFilter === 'admin')      return u.tipo === 'Admin'
    if (cardFilter === 'vendedores') return u.tipo === 'Vendedor Sucursal' || u.tipo === 'Vendedor Calle'
    if (cardFilter === 'blocked')    return !u.activo
    return !activeFilter || u.tipo === activeFilter
  }
  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.nombre.toLowerCase().includes(q) ||
      u.nick.toLowerCase().includes(q) || u.tipo.toLowerCase().includes(q)
    return matchSearch && matchCard(u)
  })

  const onCardClick = (key) => {
    if (key === null) { setCardFilter(null); setChipActive(0); return }
    setCardFilter(prev => prev === key ? null : key); setChipActive(0)
  }
  const cardActive = (key) => key === null ? (cardFilter === null && chipActive === 0) : cardFilter === key

  // IDs de usuarios que aún tienen una IP bloqueada asociada. Sirve para que el
  // modal de desbloqueo NO ofrezca "soltar IP" cuando la IP ya fue liberada
  // (solo la cuenta sigue bloqueada). Si no hay permiso para ver IPs no podemos
  // saberlo, así que en ese caso se dejan todas las opciones.
  const usuariosConIpBloqueada = new Set(
    ipsBloqueadas.map(ip => ip.usuario?.id).filter(Boolean)
  )

  // ── Filas de la tabla ──
  const dataRows = filtered.map(u => {
    const estado = u.activo ? 'Activo' : 'Bloqueado'
    return {
      // Campos crudos para ordenar las columnas que muestran JSX.
      usr_sort:      u.nombre || '',
      rolb_sort:     u.tipo || '',
      conexion_sort: u.activo_ahora ? '9999' : (u.ultima_conexion || ''),
      motivo_sort:   !u.activo ? (u.motivo_bloqueo || '') : '',
      estb_sort:     estado,
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
            <p className="text-xs sm:text-sm text-slate-400 font-mono truncate">@{u.nick}</p>
            {u.temp && (
              <p className="text-xs sm:text-sm text-amber-600 font-semibold mt-0.5">
                Temporal · vence {u.temp_expira_en?.slice(0, 10).split('-').reverse().join('/')}
              </p>
            )}
          </div>
        </div>
      ),
      rolb:     badge(u.tipo, ROLE_COLOR[u.tipo] || 'slate'),
      oficina:  u.sede || '—',
      conexion: u.ultima_conexion ? (
        <div>
          {u.activo_ahora ? (
            <p className="text-xs sm:text-sm text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Activo ahora
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-700 font-medium">{u.ultima_conexion}</p>
          )}
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">{u.ultimo_ip}</p>
        </div>
      ) : <span className="text-slate-300 text-xs sm:text-sm">—</span>,
      motivo: !u.activo && u.motivo_bloqueo
        ? <span className="text-xs sm:text-sm text-rose-500 max-w-[150px] block truncate" title={u.motivo_bloqueo}>{u.motivo_bloqueo}</span>
        : <span className="text-slate-300 text-xs sm:text-sm">—</span>,
      estb: rsbadge(estado),
      acc:  <UserActions u={u} onReload={reloadTablas} mostrarScopeIp={!canViewIps || usuariosConIpBloqueada.has(u.id)} />,
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
      {canViewCards && (loading ? <SkeletonStatCards count={4} /> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { key: null,         l: 'Total Usuarios',  v: usuarios.length, sub: `${usuarios.length - blocked} activos`,      Icon: Users,      bg: 'bg-slate-100',  ic: 'text-slate-600',  ring: 'ring-slate-300'  },
          { key: 'admin',      l: 'Administradores', v: byRole['Admin'], sub: 'Acceso total',                               Icon: ShieldCheck, bg: 'bg-indigo-100', ic: 'text-indigo-600', ring: 'ring-indigo-400' },
          { key: 'vendedores', l: 'Vendedores',      v: (byRole['Vendedor Sucursal'] || 0) + (byRole['Vendedor Calle'] || 0), sub: 'Sucursal + Calle', Icon: UserCheck, bg: 'bg-emerald-100', ic: 'text-emerald-600', ring: 'ring-emerald-400' },
          { key: 'blocked',    l: 'Bloqueados',      v: blocked,          sub: 'Sin acceso',                                Icon: UserX,      bg: 'bg-rose-100',   ic: 'text-rose-600',   ring: 'ring-rose-400'   },
        ].map(({ key, l, v, sub, Icon, bg, ic, ring }) => (
          <button key={l} type="button" onClick={() => onCardClick(key)} title={key === null ? 'Ver todos los usuarios' : `Filtrar: ${l}`}
            className={`card p-4 flex items-start gap-3 text-left w-full transition hover:shadow-md ${cardActive(key) ? 'ring-2 ' + ring : ''}`}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">{l}</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{v ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          </button>
        ))}
      </div>)}

      {/* ── Filtro por rol ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['Todos', ...ROLES].map((r, i) => (
          <button
            key={r}
            onClick={() => { setChipActive(i); setCardFilter(null) }}
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

      {canViewList ? (
        <DataTable cols={COLS_BASE.filter(c => c.k !== 'motivo' || filtered.some(u => !u.activo))} rows={dataRows} loading={loading} />
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Lock className="w-6 h-6 text-slate-300" />
          <p className="text-xs text-slate-400">No tienes permiso para ver el listado de usuarios.</p>
        </div>
      )}

      {/* ── IPs Bloqueadas (en vivo) ── */}
      {canViewIps && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4 text-rose-500" />
            <h4 className="font-semibold text-slate-700 text-sm">IPs Bloqueadas</h4>
            {ipsBloqueadas.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">{ipsBloqueadas.length}</span>
            )}
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En vivo
            </span>
          </div>
          {ipsBloqueadas.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-10 gap-2 text-center">
              <ShieldCheck className="w-6 h-6 text-slate-300" />
              <p className="text-xs text-slate-400">No hay ninguna IP bloqueada actualmente.</p>
            </div>
          ) : (
            <DataTable
              cols={[
                { k: 'fecha',   l: 'Fecha',    nw: true },
                { k: 'ip',      l: 'IP',       m: true },
                { k: 'usuario', l: 'Usuario',  hide: 'sm' },
                { k: 'motivo',  l: 'Motivo',   tr: true },
                ...(canUnblockIps ? [{ k: 'accion', l: '', acc: true }] : []),
              ]}
              rows={ipsBloqueadas.map(ip => ({
                fecha:   ip.created_at ? new Date(ip.created_at).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—',
                ip:      ip.ip,
                usuario: ip.usuario?.nombre || '—',
                motivo:  ip.motivo || '—',
                accion:  canUnblockIps ? (
                  <button onClick={() => handleUnblockIp(ip)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition" title="Desbloquear IP">
                    <LockOpen className="w-3.5 h-3.5" /> Desbloquear
                  </button>
                ) : null,
              }))}
            />
          )}
        </div>
      )}
    </div>
  )
}
