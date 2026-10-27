import { useState, useEffect, useMemo, useRef, useId } from 'react'

// ---------- Data contoh (fiktif) ----------
const MB = 1048576
const seed = [
  { id: 1, name: 'Tugas IMK', type: 'Folder', size: null, mod: '20 Okt 2026', ts: 9, star: false, trash: false, share: 'private' },
  { id: 2, name: 'Foto Kegiatan', type: 'Folder', size: null, mod: '12 Okt 2026', ts: 6, star: true, trash: false, share: 'private' },
  { id: 3, name: 'Laporan Audit IMK.docx', type: 'Dokumen', size: 1.2 * MB, mod: '25 Okt 2026', ts: 10, star: true, trash: false, share: 'private' },
  { id: 4, name: 'Jadwal Kuliah.pdf', type: 'PDF', size: 0.4 * MB, mod: '18 Okt 2026', ts: 8, star: false, trash: false, share: 'private' },
  { id: 5, name: 'Sketsa Antarmuka.png', type: 'Gambar', size: 2.8 * MB, mod: '15 Okt 2026', ts: 7, star: false, trash: false, share: 'private' },
  { id: 6, name: 'Data Survei.xlsx', type: 'Spreadsheet', size: 0.9 * MB, mod: '2 Okt 2026', ts: 4, star: false, trash: false, share: 'private' },
  { id: 7, name: 'Draf Lama.docx', type: 'Dokumen', size: 0.3 * MB, mod: '1 Sep 2026', ts: 2, star: false, trash: true, share: 'private' },
]
const NAV = [['home', 'Beranda', 'home'], ['files', 'File Saya', 'folder'], ['recent', 'Terbaru', 'clock'], ['star', 'Berbintang', 'star'], ['trash', 'Sampah', 'trash']]
const TOTAL = 15 * 1024 * MB, BASE_USED = 2.1 * 1024 * MB, LIMIT = 50 * MB

const fmt = b => b == null ? '—' : b < 1024 ? b + ' B' : b < MB ? (b / 1024).toFixed(1) + ' KB' : b < 1024 * MB ? (b / MB).toFixed(1) + ' MB' : (b / MB / 1024).toFixed(1) + ' GB'
const typeOf = n => {
  const e = (n.split('.').pop() || '').toLowerCase()
  return { pdf: 'PDF', png: 'Gambar', jpg: 'Gambar', jpeg: 'Gambar', docx: 'Dokumen', doc: 'Dokumen', xlsx: 'Spreadsheet', csv: 'Spreadsheet' }[e] || (e ? e.toUpperCase() : 'File')
}
const STATUS = {
  ready: ['Siap diunggah', 'clock', 'text-sub'], uploading: ['Sedang mengunggah', 'upload', 'text-ink'],
  success: ['Upload berhasil', 'check', 'text-ok'], failed: ['Upload gagal', 'xcircle', 'text-bad'], cancelled: ['Dibatalkan', 'ban', 'text-sub'],
}
const B = 'min-h-11 px-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-colors '
const PRIMARY = B + 'justify-center bg-brand text-onbrand shadow-sm hover:bg-brand-hover'
const SECOND = B + 'justify-center border border-edge bg-card text-ink hover:bg-sel'

// Ikon SVG outline bergaya sama (24x24, garis 1.75) – tanpa library tambahan
const P = {
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

function Modal({ title, onClose, children }) {
  const id = useId()
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    addEventListener('keydown', h)
    return () => removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-3">
      <div role="dialog" aria-modal="true" aria-labelledby={id} className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl bg-card p-5 shadow-xl">
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
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('driveease-theme') === 'dark' ? 'dark' : 'pink' } catch { return 'pink' } })
  const [drawer, setDrawer] = useState(false)
  const [fname, setFname] = useState('')
  const [ferr, setFerr] = useState('')
  const [drag, setDrag] = useState(false)
  const added = useRef(new Set())
  const nextId = useRef(100)
  const input = useRef()

  useEffect(() => { document.documentElement.style.fontSize = big ? '19px' : '16px' }, [big])
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
      if (u.mode === 'fail' && p >= 60) return { ...u, progress: 60, status: 'failed', reason: 'Koneksi internet terputus pada 60% (simulasi). Periksa sambungan Anda, lalu tekan "Coba lagi".' }
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
        setFiles(fs => [{ id: fid, name: u.name, type: typeOf(u.name), size: u.size, mod: 'Baru saja', ts: Date.now(), star: false, trash: false, share: 'private' }, ...fs])
        setUps(us => us.map(x => x.id === u.id ? { ...x, fileId: fid } : x))
        setToast(`Upload berhasil: ${u.name}`)
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

  const list = useMemo(() => {
    let l = files.filter(f => nav === 'trash' ? f.trash : !f.trash)
    if (nav === 'star') l = l.filter(f => f.star)
    if (q) l = l.filter(f => f.name.toLowerCase().includes(q.toLowerCase()))
    if (nav === 'recent' || nav === 'home') l = [...l].sort((a, b) => b.ts - a.ts)
    return nav === 'home' ? l.slice(0, 6) : l
  }, [files, nav, q])

  const used = BASE_USED + files.filter(f => !f.trash).reduce((s, f) => s + (f.size || 0), 0)
  const pct = Math.round(used / TOTAL * 100)
  const selFile = files.find(f => f.id === sel)
  const patch = (id, p) => setFiles(fs => fs.map(f => f.id === id ? { ...f, ...p } : f))
  const upd = (id, p) => setUps(us => us.map(u => u.id === id ? { ...u, ...p } : u))
  const starBtn = (f, cls = '') => (
    <button aria-pressed={f.star} aria-label={`${f.star ? 'Hapus bintang dari' : 'Beri bintang'} ${f.name}`} onClick={() => patch(f.id, { star: !f.star })} className={`${B} min-w-11 justify-center px-0! hover:bg-sel ${cls}`}>
      <Icon n="star" fill={f.star} className="text-accent" />
    </button>)
  const iconBox = f => `grid shrink-0 place-items-center ${f.type === 'Folder' ? 'bg-sel text-accent' : 'bg-side text-sub'}`

  const addFiles = fl => {
    const n = [...fl].map(f => {
      const tooBig = f.size > LIMIT
      return { id: nextId.current++, name: f.name, size: f.size, progress: 0, status: tooBig ? 'failed' : 'ready', tooBig,
        reason: tooBig ? 'Ukuran file melebihi batas 50 MB (simulasi). Pilih file yang lebih kecil, atau kompres file ini.' : '' }
    })
    setUps(u => [...n, ...u])
    setToast(`${n.length} file dipilih. Tekan "Mulai upload" untuk melanjutkan.`)
  }
  const start = () => setUps(us => us.map(u => u.status === 'ready' ? { ...u, status: 'uploading', mode } : u))
  const retry = id => upd(id, { status: 'uploading', progress: 0, mode: 'normal', reason: '' })
  const view = u => { setDlg(null); setNav('files'); setQ(''); setSel(u.fileId) }
  const createFolder = e => {
    e.preventDefault()
    const n = fname.trim()
    if (!n) return setFerr('Nama folder belum diisi. Ketik nama, misalnya "Tugas Kuliah".')
    if (files.some(f => !f.trash && f.name.toLowerCase() === n.toLowerCase())) return setFerr('Nama ini sudah dipakai. Gunakan nama lain.')
    setFiles(fs => [{ id: nextId.current++, name: n, type: 'Folder', size: null, mod: 'Baru saja', ts: Date.now(), star: false, trash: false, share: 'private' }, ...fs])
    setDlg(null); setFname(''); setFerr(''); setToast(`Folder "${n}" dibuat.`)
  }
  const setShare = v => v === 'public' ? setConfirmPublic(true) : (patch(sel, { share: 'private' }), setToast('Akses diubah: hanya Anda yang bisa membuka file ini.'))

  const NavBtns = ({ cls }) => NAV.map(([k, l, i]) => (
    <button key={k} onClick={() => { setNav(k); setMenu(null); setDrawer(false) }} aria-current={nav === k ? 'page' : undefined}
      className={`${B} whitespace-nowrap ${cls} ${nav === k ? 'bg-sel text-ink font-bold shadow-[inset_4px_0_0_var(--c-brand-hover)]' : 'text-ink hover:bg-sel/60'}`}>
      <Icon n={i} className={nav === k ? 'text-accent' : ''} />{l}
    </button>))
  const titles = { home: 'Beranda', files: 'File Saya', recent: 'Terbaru', star: 'Berbintang', trash: 'Sampah' }
  const pending = ups.some(u => u.status === 'ready' || u.status === 'uploading')

  return (
    <div className="min-h-screen md:flex">
      <a href="#utama" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3">Lewati ke konten utama</a>
      <aside className="hidden w-56 shrink-0 flex-col gap-2 border-r border-line bg-side p-4 md:sticky md:top-0 md:flex md:h-screen md:self-start md:overflow-y-auto lg:w-64">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold text-ink"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-onbrand"><Icon n="cloud" size={22} /></span>DriveEase</h1>
        <button onClick={() => setMenu(menu === 'new' ? null : 'new')} aria-expanded={menu === 'new'} className={PRIMARY + ' text-lg'}><Icon n="plus" />Baru</button>
        {menu === 'new' && <NewMenu />}
        <nav aria-label="Menu utama" className="mt-2 flex flex-col gap-1"><NavBtns cls="w-full" /></nav>
        <Storage />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-3 border-b border-line bg-card p-3">
          <button onClick={() => setDrawer(true)} aria-label="Buka menu navigasi" aria-expanded={drawer} className={SECOND + ' px-3! md:hidden'}><Icon n="menu" /></button>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-ink md:hidden"><Icon n="cloud" size={22} className="text-accent" /><span className="max-[400px]:sr-only">DriveEase</span></h1>
          <div className="relative order-last w-full md:order-none md:w-auto md:flex-1 md:max-w-xl">
            <Icon n="search" className="pointer-events-none absolute left-3 top-3 text-sub" />
            <label htmlFor="cari" className="sr-only">Cari file berdasarkan nama</label>
            <input id="cari" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari file berdasarkan nama"
              className="min-h-11 w-full rounded-xl border border-edge bg-card pl-10 pr-3 placeholder:text-sub" />
          </div>
          <button onClick={() => setMenu(menu === 'new' ? null : 'new')} aria-expanded={menu === 'new'} className={PRIMARY + ' md:hidden ml-auto'}><Icon n="plus" />Baru</button>
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
                  {[['pink', 'Baby Pink', 'sun'], ['dark', 'Mode Gelap', 'moon']].map(([v, l, i]) => (
                    <label key={v} className={`mt-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 ${theme === v ? 'border-edge bg-sel font-semibold' : 'border-line hover:bg-side'}`}>
                      <input type="radio" name="tema" className="h-5 w-5" checked={theme === v} onChange={() => setTheme(v)} /><Icon n={i} />{l}
                    </label>))}
                </fieldset>
              </div>)}
          </div>
          {menu === 'new' && <div className="w-full md:hidden"><NewMenu /></div>}
        </header>

        <main id="utama" className="p-3 md:p-4 lg:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-bold">{titles[nav]}</h2>
            <div role="group" aria-label="Pilih tampilan file" className="inline-flex gap-1 rounded-xl border border-edge bg-card p-1">
              {[[false, 'Daftar', 'list'], [true, 'Kotak', 'grid']].map(([v, l, i]) => (
                <button key={l} aria-pressed={grid === v} onClick={() => setGrid(v)} className={`${B} justify-center ${grid === v ? 'bg-sel font-bold shadow-[inset_0_-3px_0_var(--c-accent)]' : 'hover:bg-side'}`}><Icon n={i} />{l}</button>))}
            </div>
          </div>
          {nav === 'home' && <p className="mb-3 text-sub">Selamat datang! Tekan <strong>+ Baru</strong> untuk mengunggah file atau membuat folder. Berikut file yang baru Anda ubah.</p>}
          {nav === 'trash' && <p className="mb-3 text-sub">File di Sampah masih bisa dikembalikan.</p>}
          {list.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-edge bg-card p-8 text-center">
              <p className="font-semibold">{q ? `Tidak ada file dengan nama "${q}".` : 'Belum ada file di sini.'}</p>
              <p className="text-sub">{q ? 'Periksa ejaan atau hapus kata pencarian.' : 'Tekan "+ Baru" untuk mulai.'}</p>
            </div>
          ) : (
            grid ? (
            <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {list.map(f => (
                <li key={f.id} className="relative rounded-2xl border border-line bg-card">
                  {starBtn(f, 'absolute right-1 top-1')}
                  <button onClick={() => setSel(f.id)} aria-label={`Lihat detail ${f.name}`} title={f.name} className="flex min-h-36 w-full min-w-0 flex-col items-center gap-2 rounded-2xl p-3 pt-9 text-center hover:bg-side">
                    <span className={`${iconBox(f)} h-16 w-16 rounded-2xl`}><Icon n={f.type === 'Folder' ? 'folder' : 'file'} size={32} /></span>
                    <span className="line-clamp-2 w-full break-words font-semibold">{f.name}</span>
                    <span className="w-full truncate text-sm text-sub">{f.type === 'Folder' ? 'Folder' : `${f.type} · ${fmt(f.size)}`}</span>
                  </button>
                </li>))}
            </ul>
          ) : (
            <ul className="overflow-hidden rounded-xl border border-line bg-card">
              <li aria-hidden="true" className="hidden grid-cols-[1fr_7rem_6rem_8rem] gap-3 border-b border-line py-2 pl-[4.25rem] pr-4 text-sm font-semibold text-sub sm:grid"><span>Nama</span><span>Tipe</span><span>Ukuran</span><span>Diubah</span></li>
              {list.map(f => (
                <li key={f.id} className="flex items-center gap-1 border-b border-line px-2 py-1 last:border-b-0">
                  {starBtn(f)}
                  <button onClick={() => setSel(f.id)} aria-label={`Lihat detail ${f.name}`} title={f.name} className="min-h-11 min-w-0 flex-1 rounded-xl px-2 py-1 text-left hover:bg-side sm:grid sm:grid-cols-[1fr_7rem_6rem_8rem] sm:items-center sm:gap-3">
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
                </li>))}
            </ul>))}
        </main>
      </div>

      <div role="status" aria-live="polite" className="sr-only">{refreshing ? 'Memperbarui daftar file' : ''}</div>
      {(pull > 0 || refreshing) && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center md:hidden">
          <div style={{ transform: `translateY(${refreshing ? 8 : pull - 48}px)`, opacity: refreshing ? 1 : Math.min(1, pull / 40), transition: pulling ? 'none' : 'transform .2s, opacity .2s' }} className="flex items-center gap-2 rounded-full border border-edge bg-card px-4 py-2 text-sm font-semibold text-ink shadow-lg">
            <Icon n="refresh" className={`text-accent ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memperbarui daftar…' : pull >= 64 ? 'Lepaskan untuk memperbarui' : 'Tarik ke bawah untuk memperbarui'}
          </div>
        </div>)}
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
          <p className="mb-3 text-sub">Pilih file dari perangkat atau seret ke kotak di bawah. <strong>Ini simulasi:</strong> file tidak dikirim ke server mana pun.</p>
          <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            className={`rounded-xl border-2 border-dashed p-6 text-center ${drag ? 'border-brand-hover bg-sel/50' : 'border-edge'}`}>
            <Icon n="upload" size={28} className="mx-auto mb-2 text-accent" />
            <p className="mb-3 font-semibold">Seret file ke sini</p>
            <input ref={input} type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = '' }} aria-label="Pilih file dari perangkat" />
            <button onClick={() => input.current.click()} className={PRIMARY}>Pilih file dari perangkat</button>
            <p className="mt-2 text-sm text-sub">Ukuran maksimal 50 MB per file.</p>
          </div>
          <div className="mt-3"><label htmlFor="net" className="font-semibold">Simulasi kondisi jaringan</label>
            <select id="net" value={mode} onChange={e => setMode(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-edge px-2">
              <option value="normal">Normal</option><option value="slow">Koneksi lambat</option><option value="fail">Koneksi terputus (upload gagal)</option>
            </select></div>
          <ul className="mt-4 flex flex-col gap-3">
            {ups.map(u => { const [label, icon, color] = STATUS[u.status]; return (
              <li key={u.id} className="rounded-xl border border-line p-3">
                <p className="break-words font-semibold">{u.name} <span className="font-normal text-sub">({fmt(u.size)})</span></p>
                <p className={`font-bold ${color}`}><Icon n={icon} size={18} className="mr-1 inline" />Status: {label}{u.status === 'uploading' && ` – ${u.progress}%`}{u.status === 'uploading' && u.mode === 'slow' && ' (koneksi lambat, mohon tunggu)'}</p>
                {(u.status === 'uploading' || u.status === 'success') && <div role="progressbar" aria-label={`Progres upload ${u.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.progress} className="my-2 h-4 overflow-hidden rounded bg-line"><div style={{ width: u.progress + '%' }} className="h-full bg-brand-hover transition-all" /></div>}
                {u.status === 'failed' && <p role="alert" className="font-semibold text-bad">Penyebab: {u.reason}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {u.status === 'uploading' && <button onClick={() => upd(u.id, { status: 'cancelled' })} className={SECOND}>Batalkan upload</button>}
                  {u.status === 'ready' && <button onClick={() => upd(u.id, { status: 'cancelled' })} className={SECOND}>Hapus dari daftar</button>}
                  {u.status === 'failed' && !u.tooBig && <button onClick={() => retry(u.id)} className={PRIMARY}>Coba lagi</button>}
                  {u.status === 'failed' && u.tooBig && <button onClick={() => input.current.click()} className={PRIMARY}>Pilih file lain</button>}
                  {u.status === 'cancelled' && <button onClick={() => upd(u.id, { status: 'ready' })} className={SECOND}>Siapkan lagi</button>}
                  {u.status === 'success' && u.fileId && <button onClick={() => view(u)} className={PRIMARY}>Lihat file</button>}
                </div>
              </li>) })}
          </ul>
          {ups.some(u => u.status === 'ready') && <button onClick={start} className={PRIMARY + ' mt-4 w-full'}>Mulai upload</button>}
        </Modal>)}

      {selFile && (
        <Modal title={confirmPublic ? 'Bagikan ke siapa saja?' : 'Detail file'} onClose={() => { setSel(null); setConfirmPublic(false) }}>
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
              </dl>
              <fieldset className="rounded-xl border border-edge p-3">
                <legend className="px-1 font-semibold">Siapa yang bisa membuka?</legend>
                {[['private', 'Hanya saya'], ['public', 'Siapa saja yang memiliki tautan']].map(([v, l]) => (
                  <label key={v} className="flex min-h-11 items-center gap-3"><input type="radio" name="share" className="h-5 w-5" checked={selFile.share === v} onChange={() => setShare(v)} />{l}</label>))}
                <p className="text-sm text-sub">Pilihan awal selalu "Hanya saya". (Simulasi: belum ada tautan nyata.)</p>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                {selFile.trash
                  ? <button onClick={() => { patch(sel, { trash: false }); setSel(null); setToast('File dikembalikan.') }} className={PRIMARY}>Kembalikan file</button>
                  : <button onClick={() => { patch(sel, { trash: true }); setSel(null); setToast(`"${selFile.name}" dipindahkan ke Sampah.`) }} className={SECOND}>Pindahkan ke Sampah</button>}
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
  function Storage() {
    return (
      <div className="mt-auto rounded-xl bg-card border border-line p-3">
        <p className="font-semibold">Penyimpanan</p>
        <div role="progressbar" aria-label="Penyimpanan terpakai" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="my-2 h-3 overflow-hidden rounded bg-line"><div style={{ width: pct + '%' }} className="h-full bg-brand-hover" /></div>
        <p className="text-sm">{fmt(used)} dari 15 GB terpakai ({pct}%)</p>
      </div>)
  }
}
