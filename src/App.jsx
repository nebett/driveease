import { useState, useEffect, useLayoutEffect, useMemo, useRef, useId } from 'react'

// ---------- Data contoh (fiktif) ----------
const MB = 1048576
const seed = [
  { id: 1, parent: null, name: 'Tugas IMK', type: 'Folder', size: null, mod: '20 Okt 2026', ts: 9, star: false, trash: false, share: 'private' },
  { id: 2, parent: null, name: 'Foto Kegiatan', type: 'Folder', size: null, mod: '12 Okt 2026', ts: 6, star: true, trash: false, share: 'private' },
  { id: 3, parent: 8, name: 'Laporan Audit IMK.docx', type: 'Dokumen', size: 1.2 * MB, mod: '25 Okt 2026', ts: 10, star: true, trash: false, share: 'private' },
  { id: 4, parent: null, name: 'Jadwal Kuliah.pdf', type: 'PDF', size: 0.4 * MB, mod: '18 Okt 2026', ts: 8, star: false, trash: false, share: 'private' },
  { id: 5, parent: 1, name: 'Sketsa Antarmuka.png', type: 'Gambar', size: 2.8 * MB, mod: '15 Okt 2026', ts: 7, star: false, trash: false, share: 'private' },
  { id: 6, parent: null, name: 'Data Survei.xlsx', type: 'Spreadsheet', size: 0.9 * MB, mod: '2 Okt 2026', ts: 4, star: false, trash: false, share: 'private' },
  { id: 7, parent: null, name: 'Draf Lama.docx', type: 'Dokumen', size: 0.3 * MB, mod: '1 Sep 2026', ts: 2, star: false, trash: true, share: 'private' },
  { id: 8, parent: 1, name: 'Laporan', type: 'Folder', size: null, mod: '22 Okt 2026', ts: 5, star: false, trash: false, share: 'private' },
]
const NAV = [['home', 'Beranda', 'home'], ['files', 'File Saya', 'folder'], ['recent', 'Terbaru', 'clock'], ['star', 'Berbintang', 'star'], ['trash', 'Sampah', 'trash']]
const TOTAL = 1024 * MB, LIMIT = 50 * MB // penyimpanan SIMULASI 1 GB
// Hanya untuk pengembang (npm run dev): buka /?storage=69, 85, 97, atau 100 untuk menguji tiap kondisi. Diabaikan di build produksi.
const DEV_P = import.meta.env.DEV ? new URLSearchParams(location.search).get('storage') : null
const DEV_PCT = DEV_P !== null && DEV_P !== '' ? Number(DEV_P) : NaN
const SEED_USED = seed.filter(f => !f.trash).reduce((a, f) => a + (f.size || 0), 0)
const BASE_USED = DEV_PCT >= 0 && DEV_PCT <= 100 ? Math.max(0, DEV_PCT / 100 * TOTAL - SEED_USED) : 700 * MB
const LEVELS = {
  warn: { icon: 'alert', border: 'border-warn', text: 'text-warn', bar: 'bg-warn', label: 'Hampir penuh', title: 'Penyimpanan hampir penuh', detail: 'Lihat penggunaan', desc: 'Sebagian besar kapasitas penyimpanan simulasi sudah digunakan. Periksa file yang tidak lagi diperlukan.' },
  critical: { icon: 'alert', border: 'border-bad', text: 'text-bad', bar: 'bg-bad', label: 'Hampir habis', title: 'Penyimpanan hampir habis', detail: 'Lihat rincian', desc: 'Kapasitas yang tersisa sangat sedikit. Pengunggahan file berikutnya mungkin tidak dapat dilakukan jika ukurannya melebihi ruang yang tersedia.' },
  full: { icon: 'xcircle', border: 'border-bad', text: 'text-bad', bar: 'bg-bad', label: 'Penuh', title: 'Penyimpanan penuh', detail: 'Lihat rincian', desc: 'Tidak ada ruang tersisa, sehingga file baru ditolak saat diunggah dan tidak ditambahkan ke daftar. Kosongkan ruang dengan mengelola file yang ada.' },
}

const num = v => v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const fmt = b => b == null ? '—' : b < 1024 ? b + ' B' : b < MB ? num(b / 1024) + ' KB' : b < 1024 * MB ? num(b / MB) + ' MB' : num(b / MB / 1024) + ' GB'
const typeOf = n => {
  const e = (n.split('.').pop() || '').toLowerCase()
  return { pdf: 'PDF', png: 'Gambar', jpg: 'Gambar', jpeg: 'Gambar', docx: 'Dokumen', doc: 'Dokumen', xlsx: 'Spreadsheet', csv: 'Spreadsheet' }[e] || (e ? e.toUpperCase() : 'File')
}
const STATUS = {
  ready: ['File dipilih (siap diunggah)', 'clock', 'text-sub'], uploading: ['Sedang mengunggah file...', 'upload', 'text-ink'],
  success: ['Simulasi pengunggahan berhasil', 'check', 'text-ok'], failed: ['Pengunggahan gagal', 'xcircle', 'text-bad'], cancelled: ['Pengunggahan dibatalkan', 'ban', 'text-sub'],
}
const B = 'min-h-11 px-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-colors '
const PRIMARY = B + 'justify-center bg-brand text-onbrand shadow-sm hover:bg-brand-hover'
const SECOND = B + 'justify-center border border-edge bg-card text-ink hover:bg-sel'
const DANGER = B + 'justify-center bg-bad text-card hover:opacity-90'

// Ikon SVG outline bergaya sama (24x24, garis 1.75) – tanpa library tambahan
const P = {
  more: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  folderup: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6"/><path d="m9 13 3-3 3 3"/>',
  folderplus: '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  sliders: '<line x1="4" x2="20" y1="8" y2="8"/><line x1="4" x2="20" y1="16" y2="16"/><circle cx="9" cy="8" r="2.5"/><circle cx="15" cy="16" r="2.5"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  xcircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
}
function Icon({ n, size = 20, fill, className = '' }) {
  return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" style={{ fill: fill ? 'var(--c-brand)' : 'none' }} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={'shrink-0 ' + className} dangerouslySetInnerHTML={{ __html: P[n] }} />
}

// Menu konteks (klik kanan di desktop) dan menu tiga titik (semua perangkat). Posisi dijaga tetap di dalam layar.
function Menu({ x, y, items, onClose }) {
  const ref = useRef()
  const [pos, setPos] = useState(null)
  useLayoutEffect(() => {
    const r = ref.current.getBoundingClientRect()
    setPos({ left: Math.max(8, Math.min(x, innerWidth - r.width - 8)), top: Math.max(8, Math.min(y, innerHeight - r.height - 8)) })
  }, [x, y])
  useEffect(() => {
    const prev = document.activeElement
    const btns = () => [...ref.current.querySelectorAll('[role="menuitem"]')]
    btns()[0]?.focus()
    const key = e => {
      if (e.key === 'Escape' || e.key === 'Tab') return onClose()
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
      e.preventDefault()
      const b = btns(), i = b.indexOf(document.activeElement)
      b[e.key === 'Home' ? 0 : e.key === 'End' ? b.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + b.length) % b.length].focus()
    }
    const away = e => { if (!ref.current.contains(e.target)) onClose() }
    addEventListener('keydown', key); addEventListener('pointerdown', away, true); addEventListener('resize', onClose); addEventListener('scroll', onClose, true)
    return () => { removeEventListener('keydown', key); removeEventListener('pointerdown', away, true); removeEventListener('resize', onClose); removeEventListener('scroll', onClose, true); if (prev && prev.isConnected) prev.focus() }
  }, [])
  return (
    <div ref={ref} role="menu" aria-label="Menu tindakan" onContextMenu={e => e.preventDefault()} style={{ left: pos ? pos.left : x, top: pos ? pos.top : y, visibility: pos ? 'visible' : 'hidden' }} className="fixed z-[60] w-60 rounded-xl border border-line bg-card py-1 shadow-xl">
      {items.map(it => (
        <div key={it.label} role="none">
          {it.sep && <div role="separator" className="my-1 border-t border-line" />}
          <button role="menuitem" onClick={() => { onClose(); it.run() }} className={`flex min-h-11 w-full items-center gap-3 px-4 text-left hover:bg-sel ${it.danger ? 'font-semibold text-bad' : ''}`}><Icon n={it.icon} />{it.label}</button>
        </div>))}
    </div>)
}

function Modal({ title, onClose, children }) {
  const id = useId()
  const ref = useRef()
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const prev = document.activeElement
    const items = () => [...ref.current.querySelectorAll('button,[href],input,select,textarea')].filter(e => !e.disabled)
    if (!ref.current.contains(document.activeElement)) (items()[0] || ref.current).focus()
    const h = e => {
      if (e.key === 'Escape') return closeRef.current()
      if (e.key !== 'Tab') return
      const f = items(); if (!f.length) return
      const a = f[0], z = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    addEventListener('keydown', h)
    return () => { removeEventListener('keydown', h); if (prev && prev.isConnected) prev.focus() }
  }, [])
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-3">
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id={id} className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className={SECOND}>Tutup</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [files, setFiles] = useState(seed)
  const [nav, setNav] = useState('files')
  const [q, setQ] = useState('')
  const [grid, setGrid] = useState(() => { try { return localStorage.getItem('driveease-view') === 'grid' } catch { return false } })
  const [pull, setPull] = useState(0)
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [menu, setMenu] = useState(null)
  const [dlg, setDlg] = useState(null)
  const [sel, setSel] = useState(null)
  const [ups, setUps] = useState([])
  const [mode, setMode] = useState('normal')
  const [toast, setToast] = useState('')
  const [confirmPublic, setConfirmPublic] = useState(false)
  const [big, setBig] = useState(false)
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('driveease-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' } })
  const [drawer, setDrawer] = useState(false)
  const [warnOff, setWarnOff] = useState('')
  const [del, setDel] = useState(null)
  const [cwd, setCwd] = useState(null) // id folder yang sedang dibuka (null = Drive Saya)
  const [ctx, setCtx] = useState(null) // menu konteks / tiga titik: { x, y, id }
  const [renameId, setRenameId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [renameErr, setRenameErr] = useState('')
  const [itemId, setItemId] = useState(null) // dialog Atur / Kelola
  const [moveTo, setMoveTo] = useState('')
  const [moveErr, setMoveErr] = useState('')
  const [trashAsk, setTrashAsk] = useState(null)
  const [selMode, setSelMode] = useState('info')
  const [simExtra, setSimExtra] = useState(0) // Simulasi Audit: tambahan pemakaian fiktif (0 = normal), tidak disimpan di localStorage
  const [live, setLive] = useState('')
  const prevSt = useRef({})
  const [fname, setFname] = useState('')
  const [ferr, setFerr] = useState('')
  const [drag, setDrag] = useState(false)
  const added = useRef(new Set())
  const nextId = useRef(100)
  const input = useRef()
  const dirInput = useRef()

  useEffect(() => { document.documentElement.style.fontSize = big ? '19px' : '16px' }, [big])
  useEffect(() => { if (sel !== null && selMode === 'share') document.querySelector('input[name="share"]:checked')?.focus() }, [sel, selMode]) // fokus ke pilihan akses saat "Bagikan"
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('driveease-theme', theme) } catch { /* abaikan */ } }, [theme])
  useEffect(() => {
    if (!drawer) return
    const h = e => e.key === 'Escape' && setDrawer(false)
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  }, [drawer])

  // Simulasi progres upload (tidak ada server nyata)
  useEffect(() => {
    if (!ups.some(u => u.status === 'uploading')) return
    const t = setInterval(() => setUps(us => us.map(u => {
      if (u.status !== 'uploading') return u
      const p = Math.min(100, u.progress + (u.mode === 'slow' ? 4 : 12))
      if (u.mode === 'fail' && p >= 60) return { ...u, progress: 60, status: 'failed', reason: 'Pengunggahan terhenti pada 60% (kegagalan simulasi). Penyebabnya bisa berupa koneksi terputus; periksa sambungan Anda, lalu tekan "Coba lagi".' }
      return p >= 100 ? { ...u, progress: 100, status: 'success' } : { ...u, progress: p }
    })), 400)
    return () => clearInterval(t)
  }, [ups])

  // Tambahkan file ke daftar setelah upload (simulasi) berhasil
  useEffect(() => {
    ups.forEach(u => {
      if (u.status === 'success' && !added.current.has(u.id)) {
        added.current.add(u.id)
        const fid = nextId.current++
        setFiles(fs => [{ id: fid, name: u.name, type: typeOf(u.name), parent: u.parent ?? null, blob: u.file, size: u.size, mod: 'Baru saja', ts: Date.now(), star: false, trash: false, share: 'private' }, ...fs])
        setUps(us => us.map(x => x.id === u.id ? { ...x, fileId: fid } : x))
        setToast(`Simulasi pengunggahan berhasil: ${u.name}`)
      }
    })
  }, [ups])

  useEffect(() => { try { localStorage.setItem('driveease-view', grid ? 'grid' : 'list') } catch { /* abaikan */ } }, [grid])

  // Pull-to-refresh (hanya HP): aktif jika halaman di paling atas dan tidak ada dialog/upload/drag yang aktif
  const blockRef = useRef(false), pullRef = useRef(0), busyRef = useRef(false)
  blockRef.current = !!(dlg || sel || drawer || menu || drag || ups.some(u => u.status === 'uploading'))
  useEffect(() => {
    const THRESH = 64, MAXPULL = 96
    const mq = matchMedia('(max-width: 767px)')
    let sy = null, sx = 0, timer
    const atTop = () => (document.scrollingElement?.scrollTop || 0) <= 0
    const reset = () => { pullRef.current = 0; setPull(0); setPulling(false) }
    const ts = e => {
      sy = null
      if (!mq.matches || blockRef.current || busyRef.current || e.touches.length !== 1 || !atTop()) return
      sy = e.touches[0].clientY; sx = e.touches[0].clientX
    }
    const tm = e => {
      if (sy === null) return
      const dy = e.touches[0].clientY - sy
      if (!atTop() || blockRef.current || e.touches.length !== 1) { sy = null; reset(); return }
      if (dy <= 0) { if (pullRef.current) reset(); return }
      if (!pullRef.current && Math.abs(e.touches[0].clientX - sx) > dy) { sy = null; return }
      if (e.cancelable) e.preventDefault()
      const v = Math.min(MAXPULL, dy * 0.5)
      pullRef.current = v; setPull(v); setPulling(true)
    }
    const te = () => {
      const v = pullRef.current
      sy = null
      if (!v) return
      reset()
      if (v >= THRESH && !busyRef.current) {
        busyRef.current = true; setRefreshing(true)
        timer = setTimeout(() => { // simulasi lokal: tidak ada request ke server
          setFiles(fs => [...fs]); busyRef.current = false; setRefreshing(false)
          setToast('Daftar file diperbarui. Data masih lokal (simulasi), tidak ada permintaan ke server.')
        }, 1000)
      }
    }
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: false })
    addEventListener('touchend', te, { passive: true })
    addEventListener('touchcancel', te, { passive: true })
    return () => { removeEventListener('touchstart', ts); removeEventListener('touchmove', tm); removeEventListener('touchend', te); removeEventListener('touchcancel', te); clearTimeout(timer) }
  }, [])

  const byId = Object.fromEntries(files.map(f => [f.id, f]))
  const inTrash = f => { for (let x = f; x; x = byId[x.parent]) if (x.trash) return true; return false } // sampah juga berlaku untuk isi folder
  const cur = cwd !== null && byId[cwd] && !inTrash(byId[cwd]) ? cwd : null
  const curFolder = cur !== null ? byId[cur] : null
  const path = []
  for (let x = curFolder; x; x = byId[x.parent]) path.unshift(x)
  const here = nav === 'files' ? cur : null // folder tujuan untuk folder/upload baru

  const list = useMemo(() => {
    let l = files.filter(f => nav === 'trash' ? f.trash && !inTrash(byId[f.parent]) : !inTrash(f))
    if (nav === 'star') l = l.filter(f => f.star)
    if (nav === 'files' && !q) l = l.filter(f => (f.parent ?? null) === cur)
    if (q) l = l.filter(f => f.name.toLowerCase().includes(q.toLowerCase()))
    if (nav === 'recent' || nav === 'home') l = [...l].sort((a, b) => b.ts - a.ts)
    if (nav === 'files') l = [...l].sort((a, b) => (b.type === 'Folder') - (a.type === 'Folder'))
    return nav === 'home' ? l.slice(0, 6) : l
  }, [files, nav, q, cur])

  const realUsed = BASE_USED + files.filter(f => !inTrash(f)).reduce((s, f) => s + (f.size || 0), 0)
  const used = realUsed + simExtra
  const pct = Math.min(100, Math.floor(used / TOTAL * 100 + 1e-6))
  const left = TOTAL - used < 1 ? 0 : TOTAL - used
  const level = left <= 0 ? 'full' : pct >= 95 ? 'critical' : pct >= 80 ? 'warn' : 'normal'
  const selFile = files.find(f => f.id === sel)
  const patch = (id, p) => setFiles(fs => fs.map(f => f.id === id ? { ...f, ...p } : f))
  const upd = (id, p) => setUps(us => us.map(u => u.id === id ? { ...u, ...p } : u))
  const starBtn = (f, cls = '') => (
    <button aria-pressed={f.star} aria-label={`${f.star ? 'Hapus bintang dari' : 'Beri bintang'} ${f.name}`} onClick={() => patch(f.id, { star: !f.star })} className={`${B} min-w-11 justify-center px-0! hover:bg-sel ${cls}`}>
      <Icon n="star" fill={f.star} className="text-accent" />
    </button>)
  useEffect(() => { if (level === 'normal') setWarnOff('') }, [level])
  // Pengumuman status untuk pembaca layar: hanya saat status berubah (bukan tiap progres)
  useEffect(() => {
    ups.forEach(u => {
      if (prevSt.current[u.id] === u.status) return
      prevSt.current[u.id] = u.status
      const m = { uploading: 'Sedang mengunggah file', failed: 'Pengunggahan gagal', cancelled: 'Pengunggahan dibatalkan' }[u.status]
      if (m) setLive(`${m}: ${u.name}`)
    })
  }, [ups])
  const openFolder = f => { setNav('files'); setQ(''); setCwd(f.id); scrollTo({ top: 0 }) }
  const openItem = f => (f.type === 'Folder' && !f.trash ? openFolder(f) : setSel(f.id))
  const pathStr = f => { const p = []; for (let x = byId[f.parent]; x; x = byId[x.parent]) p.unshift(x.name); return ['Drive Saya', ...p].join(' / ') }
  const sizeOf = f => (f.type === 'Folder' ? files.filter(x => x.parent === f.id && !x.trash).reduce((a, x) => a + sizeOf(x), 0) : f.size || 0)
  const openSel = (id, mode = 'info') => { setSelMode(mode); setSel(id) }
  const download = f => {
    let blob, name, msg
    if (f.type === 'Folder') {
      const lines = []
      const walk = (id, pre) => files.filter(x => x.parent === id && !x.trash).forEach(x => { lines.push(pre + x.name + (x.type === 'Folder' ? '/' : '')); if (x.type === 'Folder') walk(x.id, pre + '  ') })
      walk(f.id, '')
      blob = new Blob([`Daftar isi folder "${f.name}" (simulasi DriveEase)\n\n${lines.join('\n') || '(kosong)'}\n`], { type: 'text/plain' })
      name = f.name + '-daftar-isi.txt'; msg = 'Download folder disimulasikan: yang diunduh daftar isi (.txt), bukan ZIP.'
    } else if (f.blob) { blob = f.blob; name = f.name; msg = `"${f.name}" diunduh.` }
    else { blob = new Blob([`File contoh "${f.name}" (data simulasi DriveEase). Isi asli tidak tersedia.\n`], { type: 'text/plain' }); name = f.name + '.txt'; msg = 'File contoh: yang diunduh berkas placeholder (.txt), bukan isi asli.' }
    const url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast(msg)
  }
  const doRename = e => {
    e.preventDefault()
    const f = byId[renameId], n = renameVal.trim()
    if (!n) return setRenameErr('Nama belum diisi. Ketik nama baru.')
    if (files.some(x => x.id !== f.id && !x.trash && (x.parent ?? null) === (f.parent ?? null) && x.name.toLowerCase() === n.toLowerCase())) return setRenameErr('Nama ini sudah dipakai di folder yang sama. Gunakan nama lain.')
    patch(f.id, f.type === 'Folder' ? { name: n } : { name: n, type: typeOf(n) })
    setRenameId(null); setToast(`Nama diubah menjadi "${n}".`)
  }
  const doMove = f => {
    const dest = moveTo === '' ? null : Number(moveTo)
    if (dest === (f.parent ?? null)) return setMoveErr('Item sudah berada di lokasi ini.')
    if (files.some(x => x.id !== f.id && !x.trash && (x.parent ?? null) === dest && x.name.toLowerCase() === f.name.toLowerCase())) return setMoveErr('Sudah ada item dengan nama yang sama di lokasi tujuan.')
    patch(f.id, { parent: dest }); setItemId(null); setToast(`"${f.name}" dipindahkan ke ${dest === null ? 'Drive Saya' : byId[dest].name}.`)
  }
  const confirmTrash = () => { const f = byId[trashAsk]; patch(f.id, { trash: true }); setTrashAsk(null); setToast(`"${f.name}" dipindahkan ke Sampah. Bisa dikembalikan dari menu Sampah.`) }
  const menuItems = () => {
    const f = ctx && ctx.id !== null ? byId[ctx.id] : null
    if (!ctx) return []
    if (!f) return [
      { label: 'Upload File', icon: 'upload', run: () => setDlg('upload') },
      { label: 'Upload Folder', icon: 'folderup', run: () => dirInput.current.click() },
      { label: 'Buat Folder Baru', icon: 'folderplus', run: () => { setFerr(''); setFname(''); setDlg('folder') } }]
    const kind = f.type === 'Folder' ? 'Folder' : 'File'
    if (inTrash(f)) return [
      { label: `Informasi ${kind}`, icon: 'info', run: () => openSel(f.id) },
      ...(f.trash ? [{ label: 'Pulihkan', icon: 'refresh', run: () => { patch(f.id, { trash: false }); setToast(`"${f.name}" dipulihkan.`) } }] : [])]
    return [
      { label: 'Download', icon: 'download', run: () => download(f) },
      { label: 'Ganti Nama', icon: 'pencil', sep: true, run: () => { setRenameVal(f.name); setRenameErr(''); setRenameId(f.id) } },
      { label: 'Bagikan', icon: 'share', run: () => openSel(f.id, 'share') },
      { label: 'Atur / Kelola', icon: 'sliders', run: () => { setMoveTo(String(f.parent ?? '')); setMoveErr(''); setItemId(f.id) } },
      { label: `Informasi ${kind}`, icon: 'info', sep: true, run: () => openSel(f.id) },
      { label: 'Pindahkan ke Sampah', icon: 'trash', sep: true, danger: true, run: () => setTrashAsk(f.id) }]
  }
  const onCtx = e => {
    if (!matchMedia('(pointer: fine)').matches) return // layar sentuh: pakai tombol tiga titik
    const t = e.target
    if (t.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]')) return
    let x = e.clientX, y = e.clientY
    if (!x && !y) { const r = t.getBoundingClientRect(); x = r.left; y = r.bottom } // dipicu keyboard (tombol Menu / Shift+F10)
    const li = t.closest('[data-item]')
    if (li && byId[li.dataset.item]) { e.preventDefault(); return setCtx({ x, y, id: Number(li.dataset.item) }) }
    if (t.closest('button,a,nav,header,aside') || !['files', 'home', 'recent'].includes(nav)) return
    e.preventDefault(); setCtx({ x, y, id: null })
  }
  const moreBtn = (f, cls = '') => (
    <button aria-label={`Menu tindakan ${f.name}`} aria-haspopup="menu" aria-expanded={ctx?.id === f.id} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setCtx({ x: Math.max(8, r.right - 240), y: r.bottom + 4, id: f.id }) }} className={`${B} min-w-11 justify-center px-0! hover:bg-sel ${cls}`}><Icon n="more" className="text-sub" /></button>)
  const iconBox = f => `grid shrink-0 place-items-center ${f.type === 'Folder' ? 'bg-sel text-accent' : 'bg-bg text-sub'}`

  const addFiles = (fl, parentOf) => {
    const n = [...fl].map(f => {
      const tooBig = f.size > LIMIT
      return { id: nextId.current++, name: f.name, parent: parentOf ? parentOf(f) : here, file: f, size: f.size, progress: 0, status: tooBig ? 'failed' : 'ready', tooBig,
        reason: tooBig ? 'Ukuran file melebihi batas 50 MB (simulasi). Pilih file yang lebih kecil, atau kompres file ini.' : '' }
    })
    setUps(u => [...n, ...u])
    setToast(`${n.length} file dipilih. Tekan "Mulai upload" untuk melanjutkan.`)
  }
  // Upload folder (simulasi): buat struktur folder di data aplikasi, lalu antre file-nya lewat alur upload biasa
  const addFolderUpload = fl => {
    const list = [...fl]
    if (!list.length) return
    const ids = {}, made = []
    const ensure = parts => {
      let par = here, key = ''
      for (const name of parts) {
        key += '/' + name
        if (!(key in ids)) {
          const ex = files.find(x => x.type === 'Folder' && !x.trash && (x.parent ?? null) === par && x.name.toLowerCase() === name.toLowerCase())
          if (ex) ids[key] = ex.id
          else { const id = nextId.current++; ids[key] = id; made.push({ id, parent: par, name, type: 'Folder', size: null, mod: 'Baru saja', ts: Date.now(), star: false, trash: false, share: 'private' }) }
        }
        par = ids[key]
      }
      return par
    }
    addFiles(list, f => ensure((f.webkitRelativePath || f.name).split('/').slice(0, -1)))
    if (made.length) setFiles(fs => [...made, ...fs])
  }
  const quotaMsg = (size, avail) => avail < 1
    ? 'Penyimpanan simulasi penuh, sehingga file ini tidak dapat ditambahkan. File tidak diunggah dan tidak masuk ke daftar. Gunakan "Kelola file" untuk mengosongkan ruang, lalu tekan "Coba lagi".'
    : `Ukuran file (${fmt(size)}) melebihi sisa penyimpanan simulasi (${fmt(avail)}). File tidak diunggah dan tidak ditambahkan ke daftar. Gunakan "Kelola file" untuk mengosongkan ruang, lalu tekan "Coba lagi".`
  const room = () => TOTAL - used - ups.filter(u => u.status === 'uploading').reduce((a, u) => a + u.size, 0)
  const start = () => {
    let avail = room()
    setUps(ups.map(u => {
      if (u.status !== 'ready') return u
      if (u.size > avail) return { ...u, status: 'failed', quota: true, reason: quotaMsg(u.size, avail) }
      avail -= u.size
      return { ...u, status: 'uploading', quota: false, mode, t0: Date.now() }
    }))
  }
  const retry = id => {
    const u = ups.find(x => x.id === id), avail = room()
    if (u.size > avail) { upd(id, { quota: true, reason: quotaMsg(u.size, avail) }); return setToast('Ruang penyimpanan simulasi masih belum cukup.') }
    upd(id, { status: 'uploading', progress: 0, mode: 'normal', reason: '', quota: false, t0: Date.now() })
  }
  const removeFile = f => { setFiles(fs => fs.filter(x => x.id !== f.id)); setDel(null); setToast(`"${f.name}" dihapus permanen dari data simulasi. Ruang bertambah ${fmt(f.size)}.`) }
  const trashFile = f => { patch(f.id, { trash: true }); setToast(`"${f.name}" dipindahkan ke Sampah (bisa dikembalikan). Ruang bertambah ${fmt(f.size)}.`) }
  const simulate = pct => {
    setSimExtra(Math.max(0, pct / 100 * TOTAL - realUsed)); setWarnOff('')
    if (pct >= 100) setDlg('full')
    else { setDlg(null); scrollTo({ top: 0 }); setToast('Simulasi Audit aktif: penyimpanan simulasi ' + pct + '% terpakai (hanya demonstrasi).') }
  }
  const resetSim = () => { setSimExtra(0); setWarnOff(''); setToast('Mode simulasi direset. Kapasitas kembali ke kondisi awal; file Anda tidak dihapus.') }
  const sized = files.filter(f => !inTrash(f) && f.size != null).sort((a, b) => b.size - a.size)
  const view = u => { if (!files.some(f => f.id === u.fileId)) return setToast('File ini sudah tidak ada di daftar.'); setDlg(null); setNav('files'); setQ(''); setCwd(u.parent ?? null); setSel(u.fileId) }
  const createFolder = e => {
    e.preventDefault()
    const n = fname.trim()
    if (!n) return setFerr('Nama folder belum diisi. Ketik nama, misalnya "Tugas Kuliah".')
    if (files.some(f => !f.trash && (f.parent ?? null) === here && f.name.toLowerCase() === n.toLowerCase())) return setFerr('Nama ini sudah dipakai. Gunakan nama lain.')
    setFiles(fs => [{ id: nextId.current++, name: n, type: 'Folder', parent: here, size: null, mod: 'Baru saja', ts: Date.now(), star: false, trash: false, share: 'private' }, ...fs])
    setDlg(null); setFname(''); setFerr(''); setToast(`Folder "${n}" dibuat.`)
  }
  const setShare = v => v === 'public' ? setConfirmPublic(true) : (patch(sel, { share: 'private' }), setToast('Akses diubah: hanya Anda yang bisa membuka file ini.'))

  const NavBtns = ({ cls }) => NAV.map(([k, l, i]) => (
    <button key={k} onClick={() => { setNav(k); setMenu(null); setDrawer(false); if (k === 'files') setCwd(null) }} aria-current={nav === k ? 'page' : undefined}
      className={`${B} whitespace-nowrap ${cls} ${nav === k ? 'bg-sel text-ink font-bold shadow-[inset_4px_0_0_var(--c-brand-hover)]' : 'text-ink hover:bg-sel/60'}`}>
      <Icon n={i} className={nav === k ? 'text-accent' : ''} />{l}
    </button>))
  const titles = { home: 'Beranda', files: 'File Saya', recent: 'Terbaru', star: 'Berbintang', trash: 'Sampah' }
  const pending = ups.some(u => u.status === 'ready' || u.status === 'uploading')

  return (
    <div className="min-h-screen md:flex" onContextMenu={onCtx}>
      <input ref={dirInput} type="file" multiple {...{ webkitdirectory: '', directory: '' }} className="hidden" aria-label="Pilih folder dari perangkat" onChange={e => { addFolderUpload(e.target.files); e.target.value = ''; setDlg('upload') }} />
      <a href="#utama" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3">Lewati ke konten utama</a>
      <aside className="hidden w-56 shrink-0 flex-col gap-2 border-r border-line bg-side p-4 md:sticky md:top-0 md:flex md:h-screen md:self-start md:overflow-y-auto lg:w-64">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold text-ink"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-onbrand"><Icon n="cloud" size={22} /></span>DriveEase</h1>
        <button onClick={() => setMenu(menu === 'new' ? null : 'new')} aria-expanded={menu === 'new'} className={PRIMARY + ' text-lg'}><Icon n="plus" />Baru</button>
        {menu === 'new' && <NewMenu />}
        <nav aria-label="Menu utama" className="mt-2 flex flex-col gap-1"><NavBtns cls="w-full" /></nav>
        <Storage />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b md:gap-3 border-line bg-card p-3">
          <button onClick={() => setDrawer(true)} aria-label="Buka menu navigasi" aria-expanded={drawer} className={SECOND + ' px-3! md:hidden'}><Icon n="menu" /></button>
          <h1 className="flex items-center gap-2 min-w-0 flex-1 text-xl font-extrabold text-ink md:hidden"><Icon n="cloud" size={22} className="text-accent" /><span>DriveEase</span></h1>
          <div className="order-last flex w-full items-center gap-2 md:contents">
          <div className="relative min-w-0 flex-1 md:order-first md:max-w-xl">
            <Icon n="search" className="pointer-events-none absolute left-3 top-3 text-sub" />
            <label htmlFor="cari" className="sr-only">Cari file berdasarkan nama</label>
            <input id="cari" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari file"
              className="min-h-11 w-full rounded-xl border border-edge bg-card pl-10 pr-3 placeholder:text-sub" />
          </div>
          <div className="relative shrink-0 md:hidden">
            <button onClick={() => setMenu(menu === 'new' ? null : 'new')} aria-expanded={menu === 'new'} className={PRIMARY}><Icon n="plus" />Baru</button>
            {menu === 'new' && <div className="absolute right-0 top-full z-30 mt-2 w-56 max-w-[calc(100vw-1.5rem)]"><NewMenu /></div>}
          </div>
          </div>
          <div className="relative md:ml-auto">
            <button onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-expanded={menu === 'profile'} aria-label="Menu profil dan pengaturan" className={SECOND + ' max-sm:px-3!'}><Icon n="user" /><span className="max-sm:sr-only">Profil</span></button>
            {menu === 'profile' && (
              <div className="absolute right-0 z-30 mt-2 max-h-[75vh] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-line bg-card p-4 shadow-lg">
                <p className="font-bold">Pengguna Contoh</p>
                <p className="text-sm text-sub">pengguna@contoh.id (data fiktif)</p>
                <p className="mt-3 flex items-center gap-2 font-semibold"><Icon n="sliders" />Pengaturan</p>
                <label className="mt-1 flex min-h-11 items-center gap-3"><input type="checkbox" className="h-6 w-6" checked={big} onChange={e => setBig(e.target.checked)} />Perbesar ukuran teks</label>
                <fieldset className="mt-3">
                  <legend className="flex items-center gap-2 font-semibold"><Icon n="sun" />Tema tampilan</legend>
                  {[['light', 'Mode Terang', 'sun'], ['dark', 'Mode Gelap', 'moon']].map(([v, l, i]) => (
                    <label key={v} className={`mt-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 ${theme === v ? 'border-edge bg-sel font-semibold' : 'border-line hover:bg-sel'}`}>
                      <input type="radio" name="tema" className="h-5 w-5" checked={theme === v} onChange={() => setTheme(v)} /><Icon n={i} />{l}
                    </label>))}
                </fieldset>
                <p className="mt-3 text-sm text-sub">Versi build: {__BUILD_ID__}</p>
              </div>)}
          </div>
        </header>

        <main id="utama" className="p-3 md:p-4 lg:p-6">
          {level !== 'normal' && warnOff !== level && (
            <div role="status" className={`mb-3 rounded-xl border-2 bg-card p-3 ${LEVELS[level].border}`}>
              <div className="flex items-start gap-3">
                <Icon n={LEVELS[level].icon} className={`mt-0.5 ${LEVELS[level].text}`} />
                <div className="min-w-0 flex-1">
                  <p className={`font-bold ${LEVELS[level].text}`}>{LEVELS[level].title} ({pct}%)</p>
                  <p>{LEVELS[level].desc}</p>
                  <p className="text-sm text-sub">Ini penyimpanan simulasi untuk demonstrasi. Tidak ada file yang dihapus otomatis.{simExtra > 0 && ' Mode Demonstrasi (Simulasi Audit) sedang aktif; reset lewat Kelola penyimpanan.'}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setDlg('manage')} className={PRIMARY}>Kelola file</button>
                <button onClick={() => setDlg('storage')} className={SECOND}>{LEVELS[level].detail}</button>
                <button onClick={() => setWarnOff(level)} className={SECOND}>Tutup</button>
              </div>
            </div>)}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="min-w-0 break-words text-2xl font-bold">{q ? 'Hasil pencarian' : nav === 'files' && curFolder ? curFolder.name : titles[nav]}</h2>
            <div role="group" aria-label="Pilih tampilan file" className="inline-flex gap-1 rounded-xl border border-edge bg-card p-1">
              {[[false, 'Daftar', 'list'], [true, 'Kotak', 'grid']].map(([v, l, i]) => (
                <button key={l} aria-pressed={grid === v} onClick={() => setGrid(v)} className={`${B} justify-center ${grid === v ? 'bg-sel font-bold shadow-[inset_0_-3px_0_var(--c-accent)]' : 'hover:bg-sel'}`}><Icon n={i} />{l}</button>))}
            </div>
          </div>
          {nav === 'files' && !q && (
            <nav aria-label="Lokasi folder" className="mb-3 flex flex-wrap items-center gap-1">
              {cur !== null && <button onClick={() => setCwd(path.length > 1 ? path[path.length - 2].id : null)} aria-label="Kembali ke folder sebelumnya" className={SECOND + ' px-3!'}><Icon n="back" /></button>}
              <ol className="flex min-w-0 flex-wrap items-center gap-1">
                <li><button onClick={() => setCwd(null)} aria-current={cur === null ? 'page' : undefined} className={`${B} px-3 hover:bg-sel ${cur === null ? 'bg-sel font-bold' : ''}`}>Drive Saya</button></li>
                {path.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-1">
                    <Icon n="chevron" size={16} className="text-sub" />
                    <button onClick={() => setCwd(p.id)} aria-current={i === path.length - 1 ? 'page' : undefined} className={`${B} px-3 hover:bg-sel ${i === path.length - 1 ? 'bg-sel font-bold' : ''}`}><span className="max-w-[40vw] truncate sm:max-w-[16rem]">{p.name}</span></button>
                  </li>))}
              </ol>
            </nav>)}
          {nav === 'home' && <p className="mb-3 text-sub">Selamat datang! Tekan <strong>+ Baru</strong> untuk mengunggah file atau membuat folder. Berikut file yang baru Anda ubah.</p>}
          {nav === 'trash' && <p className="mb-3 text-sub">File di Sampah masih bisa dikembalikan.</p>}
          {list.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-edge bg-card p-8 text-center">
              <p className="font-semibold">{q ? `Tidak ada file dengan nama "${q}".` : nav === 'files' && cur !== null ? 'Folder ini kosong.' : 'Belum ada file di sini.'}</p>
              <p className="text-sub">{q ? 'Periksa ejaan atau hapus kata pencarian.' : nav === 'files' && cur !== null ? 'Tekan "+ Baru" untuk mengunggah file atau membuat folder di dalam folder ini.' : 'Tekan "+ Baru" untuk mulai.'}</p>
            </div>
          ) : (
            grid ? (
            <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {list.map(f => (
                <li key={f.id} data-item={f.id} className="relative rounded-2xl border border-line bg-card">
                  {starBtn(f, 'absolute right-1 top-1')}
                  {moreBtn(f, 'absolute left-1 top-1')}
                  <button onClick={() => openItem(f)} aria-label={f.type === 'Folder' && !f.trash ? `Buka folder ${f.name}` : `Lihat detail ${f.name}`} title={f.name} className="flex min-h-36 w-full min-w-0 flex-col items-center gap-2 rounded-2xl p-3 pt-9 text-center hover:bg-sel">
                    <span className={`${iconBox(f)} h-16 w-16 rounded-2xl`}><Icon n={f.type === 'Folder' ? 'folder' : 'file'} size={32} /></span>
                    <span className="line-clamp-2 w-full break-words font-semibold">{f.name}</span>
                    <span className="w-full truncate text-sm text-sub">{f.type === 'Folder' ? 'Folder' : `${f.type} · ${fmt(f.size)}`}</span>
                  </button>
                </li>))}
            </ul>
          ) : (
            <ul className="rounded-xl border border-line bg-card">
              <li aria-hidden="true" className="hidden grid-cols-[1fr_7rem_6rem_8rem] gap-3 border-b border-line py-2 pl-[4.25rem] pr-16 text-sm font-semibold text-sub sm:grid"><span>Nama</span><span>Tipe</span><span>Ukuran</span><span>Diubah</span></li>
              {list.map(f => (
                <li key={f.id} data-item={f.id} className="flex items-center gap-1 border-b border-line px-2 py-1 last:border-b-0">
                  {starBtn(f)}
                  <button onClick={() => openItem(f)} aria-label={f.type === 'Folder' && !f.trash ? `Buka folder ${f.name}` : `Lihat detail ${f.name}`} title={f.name} className="min-h-11 min-w-0 flex-1 rounded-xl px-2 py-1 text-left hover:bg-sel sm:grid sm:grid-cols-[1fr_7rem_6rem_8rem] sm:items-center sm:gap-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={`${iconBox(f)} h-9 w-9 rounded-lg`}><Icon n={f.type === 'Folder' ? 'folder' : 'file'} /></span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{f.name}</span>
                        <span className="block truncate text-sm text-sub sm:hidden">{f.type}{f.size != null && ` · ${fmt(f.size)}`} · {f.mod}</span>
                      </span>
                    </span>
                    <span className="hidden text-sub sm:block">{f.type}</span>
                    <span className="hidden text-sub sm:block">{fmt(f.size)}</span>
                    <span className="hidden text-sub sm:block">{f.mod}</span>
                  </button>
                  {moreBtn(f)}
                </li>))}
            </ul>))}
        </main>
      </div>

      <div role="status" aria-live="polite" className="sr-only">{refreshing ? 'Memperbarui daftar file' : live}</div>
      {(pull > 0 || refreshing) && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center md:hidden">
          <div style={{ transform: `translateY(${refreshing ? 8 : pull - 48}px)`, opacity: refreshing ? 1 : Math.min(1, pull / 40), transition: pulling ? 'none' : 'transform .2s, opacity .2s' }} className="flex items-center gap-2 rounded-full border border-edge bg-card px-4 py-2 text-sm font-semibold text-ink shadow-lg">
            <Icon n="refresh" className={`text-accent ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memperbarui daftar…' : pull >= 64 ? 'Lepaskan untuk memperbarui' : 'Tarik ke bawah untuk memperbarui'}
          </div>
        </div>)}
      {renameId !== null && byId[renameId] && (
        <Modal title={`Ganti nama ${byId[renameId].type === 'Folder' ? 'folder' : 'file'}`} onClose={() => setRenameId(null)}>
          <form onSubmit={doRename} noValidate className="flex flex-col gap-3">
            <label htmlFor="rn" className="font-semibold">Nama baru</label>
            <input id="rn" autoFocus onFocus={e => e.target.select()} value={renameVal} onChange={e => { setRenameVal(e.target.value); setRenameErr('') }} aria-invalid={!!renameErr} aria-describedby={renameErr ? 'rn-err' : undefined} className="min-h-11 rounded-xl border border-edge bg-card px-3" />
            {renameErr && <p id="rn-err" role="alert" className="font-semibold text-bad"><Icon n="alert" size={18} className="mr-1 inline" />{renameErr}</p>}
            <div className="flex flex-wrap gap-2"><button type="submit" className={PRIMARY}>Simpan</button><button type="button" onClick={() => setRenameId(null)} className={SECOND}>Batal</button></div>
          </form>
        </Modal>)}
      {itemId !== null && byId[itemId] && (() => {
        const f = byId[itemId], bad = new Set([f.id])
        const desc = id => files.filter(x => x.parent === id).forEach(x => { bad.add(x.id); desc(x.id) })
        desc(f.id)
        const opts = files.filter(x => x.type === 'Folder' && !inTrash(x) && !bad.has(x.id))
        return (
          <Modal title={`Atur / Kelola`} onClose={() => setItemId(null)}>
            <p className="break-words font-semibold">{f.name}</p>
            <p className="break-words text-sm text-sub">Lokasi: {pathStr(f)}</p>
            <button aria-pressed={f.star} onClick={() => { patch(f.id, { star: !f.star }); setToast(f.star ? 'Dihapus dari Berbintang.' : 'Ditambahkan ke Berbintang.') }} className={SECOND + ' mt-3'}><Icon n="star" fill={f.star} className="text-accent" />{f.star ? 'Hapus dari Berbintang' : 'Tambahkan ke Berbintang'}</button>
            <label htmlFor="mv" className="mt-4 block font-semibold">Pindahkan ke</label>
            <select id="mv" value={moveTo} onChange={e => { setMoveTo(e.target.value); setMoveErr('') }} className="mt-1 block min-h-11 w-full rounded-xl border border-edge bg-card px-2">
              <option value="">Drive Saya</option>
              {opts.map(o => <option key={o.id} value={o.id}>{pathStr(o)} / {o.name}</option>)}
            </select>
            {moveErr && <p role="alert" className="mt-2 font-semibold text-bad"><Icon n="alert" size={18} className="mr-1 inline" />{moveErr}</p>}
            <button onClick={() => doMove(f)} className={PRIMARY + ' mt-3'}>Pindahkan</button>
          </Modal>)
      })()}
      {trashAsk !== null && byId[trashAsk] && (
        <Modal title="Pindahkan ke Sampah?" onClose={() => setTrashAsk(null)}>
          <p>"{byId[trashAsk].name}" akan dipindahkan ke Sampah. {byId[trashAsk].type === 'Folder' ? 'Isi folder ikut disembunyikan dan tidak dihitung di penyimpanan. ' : ''}Anda masih bisa mengembalikannya dari menu Sampah.</p>
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={confirmTrash} className={DANGER}><Icon n="trash" />Pindahkan ke Sampah</button><button autoFocus onClick={() => setTrashAsk(null)} className={SECOND}>Batal</button></div>
        </Modal>)}
      {ctx && <Menu key={`${ctx.x}-${ctx.y}-${ctx.id}`} x={ctx.x} y={ctx.y} items={menuItems()} onClose={() => setCtx(null)} />}
      {dlg === 'full' && (
        <Modal title="Penyimpanan Simulasi Penuh" onClose={() => setDlg(null)}>
          <div className="flex items-start gap-3"><Icon n="alert" size={28} className="mt-0.5 text-bad" /><p>Kapasitas penyimpanan simulasi telah mencapai batas maksimum. File baru yang ukurannya melebihi ruang tersedia tidak dapat ditambahkan dalam skenario ini.</p></div>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border border-line p-3">
            <dt className="text-sub">Kapasitas</dt><dd className="font-semibold">1 GB</dd>
            <dt className="text-sub">Terpakai</dt><dd className="font-semibold">{left === 0 ? '1 GB' : fmt(used)} ({pct}%)</dd>
            <dt className="text-sub">Tersedia</dt><dd className="font-semibold">{left === 0 ? '0 MB' : fmt(left)}</dd>
          </dl>
          <p className="mt-3 text-sm text-sub">Ini merupakan simulasi untuk demonstrasi prototype DriveEase. Data ini bukan kapasitas Google Drive atau server sungguhan.</p>
          <button onClick={() => setDlg('manage')} className={PRIMARY + ' mt-4'}>Kelola File</button>
        </Modal>)}
      {dlg === 'storage' && (
        <Modal title="Rincian penyimpanan simulasi" onClose={() => setDlg(null)}>
          <Storage bare />
          <h3 className="mt-4 font-semibold">File terbesar</h3>
          {sized.length === 0 ? <p className="mt-1 text-sub">Belum ada file bertanda ukuran.</p> : (
            <ul className="mt-1 flex flex-col gap-1">{sized.slice(0, 5).map(f => <li key={f.id} className="flex justify-between gap-3"><span className="min-w-0 truncate">{f.name}</span><span className="shrink-0 text-sub">{fmt(f.size)}</span></li>)}</ul>)}
          <p className="mt-2 text-sm text-sub">Sisa pemakaian ({fmt(BASE_USED + simExtra)}) adalah data simulasi fiktif yang tidak ditampilkan sebagai file.</p>
          <button onClick={() => setDlg('manage')} className={PRIMARY + ' mt-4 w-full'}>Kelola file</button>
          <section aria-labelledby="demo-h" className="mt-5 rounded-xl border border-dashed border-edge p-3">
            <h3 id="demo-h" className="font-semibold">Mode Demonstrasi (Simulasi Audit)</h3>
            <p className="mt-1 text-sm text-sub">Hanya untuk demonstrasi prototype DriveEase. Tidak mengubah kapasitas Google Drive atau server sungguhan dan tidak menghapus file. Status: {simExtra > 0 ? 'aktif' : 'tidak aktif'}.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button onClick={() => simulate(95)} className={SECOND}>Simulasikan Penyimpanan Hampir Penuh</button>
              <button onClick={() => simulate(100)} className={SECOND}>Simulasikan Penyimpanan Penuh</button>
              <button onClick={resetSim} className={SECOND}>Reset ke Kondisi Normal</button>
            </div>
          </section>
        </Modal>)}
      {dlg === 'manage' && (
        <Modal title="Kelola file" onClose={() => { setDlg(null); setDel(null) }}>
          <p className="text-sub">Periksa file simulasi dan ukurannya. Tidak ada file yang dihapus otomatis. Tersisa {fmt(left)} dari 1 GB.</p>
          {sized.length === 0 ? <p className="mt-3 font-semibold">Tidak ada file yang dapat dikelola.</p> : (
            <ul className="mt-3 flex flex-col gap-2">
              {sized.map(f => (
                <li key={f.id} className="rounded-xl border border-line p-3">
                  <p className="break-words font-semibold">{f.name}</p>
                  <p className="text-sm text-sub">{f.type} · {fmt(f.size)}</p>
                  {del === f.id ? (
                    <div className="mt-2">
                      <p className="flex items-center gap-2 font-semibold text-bad"><Icon n="alert" size={18} />Hapus permanen?</p>
                      <p className="text-sm">"{f.name}" ({fmt(f.size)}) akan dihapus dari data simulasi aplikasi ini dan tidak bisa dikembalikan. Ruang tersisa bertambah {fmt(f.size)}.</p>
                      <div className="mt-2 flex flex-wrap gap-2"><button onClick={() => removeFile(f)} className={DANGER}>Ya, hapus permanen</button><button autoFocus onClick={() => setDel(null)} className={SECOND}>Batal</button></div>
                    </div>) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => trashFile(f)} className={SECOND}>Pindahkan ke Sampah</button>
                      <button onClick={() => setDel(f.id)} className={SECOND}>Hapus permanen</button>
                    </div>)}
                </li>))}
            </ul>)}
        </Modal>)}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Menu navigasi" className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-2 overflow-y-auto bg-side p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xl font-extrabold text-ink"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-onbrand"><Icon n="cloud" size={22} /></span>DriveEase</span>
              <button autoFocus onClick={() => setDrawer(false)} aria-label="Tutup menu navigasi" className={SECOND + ' px-3!'}><Icon n="x" /></button>
            </div>
            <nav aria-label="Menu utama" className="flex flex-col gap-1"><NavBtns cls="w-full" /></nav>
            <Storage />
          </div>
        </div>)}
      {pending && !dlg && <button onClick={() => setDlg('upload')} className={PRIMARY + ' fixed bottom-24 left-4 z-30 shadow-lg sm:bottom-4'}>Upload sedang berjalan – buka status</button>}
      <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:max-w-sm">
        {toast && <div className="flex items-start gap-3 rounded-xl border border-edge bg-card p-3 text-ink shadow-lg"><Icon n="bell" className="mt-2" /><p className="flex-1 pt-1.5">{toast}</p><button onClick={() => setToast('')} className={B + 'border border-edge hover:bg-sel'}>Tutup notifikasi</button></div>}
      </div>

      {dlg === 'folder' && (
        <Modal title="Folder baru" onClose={() => setDlg(null)}>
          <form onSubmit={createFolder} className="flex flex-col gap-3" noValidate>
            <label htmlFor="nf" className="font-semibold">Nama folder</label>
            <input id="nf" autoFocus value={fname} onChange={e => { setFname(e.target.value); setFerr('') }} aria-invalid={!!ferr} aria-describedby={ferr ? 'nf-err' : undefined} className="min-h-11 rounded-xl border border-edge px-3" />
            {ferr && <p id="nf-err" role="alert" className="font-semibold text-bad"><Icon n="alert" size={18} className="mr-1 inline" />{ferr}</p>}
            <button type="submit" className={PRIMARY}>Buat folder</button>
          </form>
        </Modal>)}

      {dlg === 'upload' && (
        <Modal title="Upload file" onClose={() => setDlg(null)}>
          {level === 'full' && <p role="alert" className="mb-3 flex items-start gap-2 font-semibold text-bad"><Icon n="xcircle" className="mt-0.5" />Penyimpanan simulasi penuh: file baru tidak dapat ditambahkan. Pilih "Kelola file" untuk mengosongkan ruang.</p>}
          <p className="mb-3 text-sub">Pilih file dari perangkat atau seret ke kotak di bawah. <strong>Ini simulasi:</strong> file tidak dikirim ke server mana pun.</p>
          <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            className={`rounded-xl border-2 border-dashed p-6 text-center ${drag ? 'border-brand-hover bg-sel/50' : 'border-edge'}`}>
            <Icon n="upload" size={28} className="mx-auto mb-2 text-accent" />
            <p className="mb-3 font-semibold">Seret file ke sini</p>
            <input ref={input} type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = '' }} aria-label="Pilih file dari perangkat" />
            <div className="flex flex-wrap justify-center gap-2"><button onClick={() => input.current.click()} className={PRIMARY}>Pilih file dari perangkat</button><button onClick={() => dirInput.current.click()} className={SECOND + ' max-md:hidden'}><Icon n="folderup" />Pilih folder</button></div>
            <p className="mt-2 text-sm text-sub">Ukuran maksimal 50 MB per file.</p>
          </div>
          <div className="mt-3"><label htmlFor="net" className="font-semibold">Simulasi kondisi jaringan</label>
            <select id="net" value={mode} onChange={e => setMode(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-edge px-2">
              <option value="normal">Normal</option><option value="slow">Koneksi lambat</option><option value="fail">Gagal di tengah proses (simulasi)</option>
            </select><p className="mt-1 text-sm text-sub">Pilihan ini hanya mensimulasikan kondisi jaringan; tidak ada koneksi atau server sungguhan.</p></div>
          <ul className="mt-4 flex flex-col gap-3">
            {ups.map(u => { const [label, icon, color] = STATUS[u.status]; return (
              <li key={u.id} className="rounded-xl border border-line p-3">
                <p className="break-words font-semibold">{u.name} <span className="font-normal text-sub">({fmt(u.size)})</span></p>
                <p className={`font-bold ${color}`}><Icon n={icon} size={18} className="mr-1 inline" />Status: {label}{u.status === 'uploading' && ` – ${u.progress}%`}{u.status === 'uploading'}</p>
                {u.status === 'uploading' && Date.now() - u.t0 > 5000 && <p className="mt-1 flex items-start gap-2 text-sm text-warn"><Icon n="alert" size={18} className="mt-0.5" /><span>Pengunggahan membutuhkan waktu lebih lama. Periksa koneksi internet Anda. <span className="text-sub">(Simulasi prototype: koneksi Anda tidak benar-benar diukur, dan proses masih berjalan.)</span></span></p>}
                {(u.status === 'uploading' || u.status === 'success') && <div role="progressbar" aria-label={`Progres upload ${u.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.progress} className="my-2 h-4 overflow-hidden rounded bg-line"><div style={{ width: u.progress + '%' }} className="h-full bg-brand-hover transition-all" /></div>}
                {u.status === 'failed' && <p role="alert" className="font-semibold text-bad">Penyebab: {u.reason}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {u.status === 'uploading' && <button onClick={() => upd(u.id, { status: 'cancelled' })} className={SECOND}>Batalkan upload</button>}
                  {u.status === 'ready' && <button onClick={() => upd(u.id, { status: 'cancelled' })} className={SECOND}>Hapus dari daftar</button>}
                  {u.status === 'failed' && !u.tooBig && <button onClick={() => retry(u.id)} className={PRIMARY}>Coba lagi</button>}
                  {u.status === 'failed' && u.quota && <button onClick={() => setDlg('manage')} className={SECOND}>Kelola file</button>}
                  {u.status === 'failed' && u.tooBig && <button onClick={() => input.current.click()} className={PRIMARY}>Pilih file lain</button>}
                  {u.status === 'cancelled' && <button onClick={() => upd(u.id, { status: 'ready' })} className={SECOND}>Siapkan lagi</button>}
                  {u.status === 'success' && u.fileId && <button onClick={() => view(u)} className={PRIMARY}>Lihat file</button>}
                </div>
              </li>) })}
          </ul>
          {ups.some(u => u.status === 'ready') && <button onClick={start} className={PRIMARY + ' mt-4 w-full'}>Mulai upload</button>}
        </Modal>)}

      {selFile && (
        <Modal title={confirmPublic ? 'Bagikan ke siapa saja?' : selMode === 'share' ? 'Bagikan' : selFile.type === 'Folder' ? 'Informasi Folder' : 'Informasi File'} onClose={() => { setSel(null); setConfirmPublic(false); setSelMode('info') }}>
          {confirmPublic ? (
            <div className="flex flex-col gap-3">
              <p>Siapa saja yang memiliki tautan dapat membuka <strong>{selFile.name}</strong>, termasuk orang yang tidak Anda kenal jika tautan disebarkan. Jangan bagikan file yang berisi data pribadi.</p>
              <button onClick={() => { patch(sel, { share: 'public' }); setConfirmPublic(false); setToast('Akses diubah: siapa saja yang memiliki tautan dapat membuka file ini.') }} className={PRIMARY}>Ya, bagikan ke siapa saja</button>
              <button autoFocus onClick={() => setConfirmPublic(false)} className={SECOND}>Tidak, tetap pribadi</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <dl className="grid grid-cols-[7rem_1fr] gap-y-1">
                <dt className="font-semibold">Nama</dt><dd className="break-words">{selFile.name}</dd>
                <dt className="font-semibold">Tipe</dt><dd>{selFile.type}</dd>
                <dt className="font-semibold">Ukuran</dt><dd>{fmt(selFile.size)}</dd>
                <dt className="font-semibold">Diubah</dt><dd>{selFile.mod}</dd>
                <dt className="font-semibold">Lokasi</dt><dd className="break-words">{pathStr(selFile)}</dd>
                {selFile.type === 'Folder' && <><dt className="font-semibold">Isi</dt><dd>{files.filter(x => x.parent === selFile.id && !x.trash).length} item ({fmt(sizeOf(selFile))})</dd></>}
                <dt className="font-semibold">Berbintang</dt><dd>{selFile.star ? 'Ya' : 'Tidak'}</dd>
              </dl>
              <fieldset className="rounded-xl border border-edge p-3">
                <legend className="px-1 font-semibold">Siapa yang bisa membuka?</legend>
                {[['private', 'Hanya saya'], ['public', 'Siapa saja yang memiliki tautan']].map(([v, l]) => (
                  <label key={v} className="flex min-h-11 items-center gap-3"><input type="radio" name="share" className="h-5 w-5" checked={selFile.share === v} autoFocus={selMode === 'share' && selFile.share === v} onChange={() => setShare(v)} />{l}</label>))}
                <p className="text-sm text-sub">Pilihan awal selalu "Hanya saya". (Simulasi: belum ada tautan nyata.)</p>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                {selFile.type === 'Folder' && !selFile.trash && <button onClick={() => { openFolder(selFile); setSel(null) }} className={PRIMARY}>Buka folder</button>}
                {selFile.trash
                  ? <button onClick={() => { patch(sel, { trash: false }); setSel(null); setToast('File dikembalikan.') }} className={PRIMARY}>Kembalikan file</button>
                  : <button onClick={() => { setTrashAsk(selFile.id); setSel(null) }} className={SECOND}>Pindahkan ke Sampah</button>}
              </div>
            </div>)}
        </Modal>)}
    </div>
  )

  function NewMenu() {
    return (
      <div className="z-20 flex flex-col gap-1 rounded-xl border border-line bg-card p-2 shadow-lg" role="group" aria-label="Menu Baru">
        <button className={SECOND} onClick={() => { setMenu(null); setFerr(''); setDlg('folder') }}><Icon n="folder" />Folder baru</button>
        <button className={SECOND} onClick={() => { setMenu(null); setNav('files'); setDlg('upload') }}><Icon n="upload" />Upload file</button>
      </div>)
  }
  function Storage({ bare }) {
    const c = LEVELS[level]
    return (
      <div className="mt-auto rounded-xl border border-line bg-card p-3">
        <p className="font-semibold">Penyimpanan simulasi</p>
        <div role="progressbar" aria-label="Penyimpanan simulasi terpakai" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct}% digunakan`} className="my-2 h-3 overflow-hidden rounded bg-line"><div style={{ width: pct + '%' }} className={`h-full ${c ? c.bar : 'bg-brand-hover'}`} /></div>
        <p className="text-sm font-semibold">{fmt(used)} dari 1 GB terpakai</p>
        <p className="text-sm text-sub">{fmt(left)} tersisa · {pct}% digunakan</p>
        {simExtra > 0 && <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Icon n="sliders" size={16} />Mode demonstrasi aktif</p>}
        {c && <p className={`mt-1 flex items-center gap-1 text-sm font-semibold ${c.text}`}><Icon n={c.icon} size={16} />{c.label}</p>}
        <p className="mt-1 text-sm text-sub">Angka demonstrasi, bukan kapasitas Google Drive atau server sungguhan.</p>
        {!bare && <button onClick={() => { setDrawer(false); setDlg('storage') }} className={SECOND + ' mt-2 w-full'}>Kelola penyimpanan</button>}
      </div>)
  }
}
