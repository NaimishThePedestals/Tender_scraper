// import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
// import { supabase, TABLE } from './supabase'

// const PAGE_SIZE = 50
// const KW_STORE = 'tender-keywords'

// function loadKeywords() {
//   try {
//     const raw = localStorage.getItem(KW_STORE)
//     if (raw) return JSON.parse(raw)
//   } catch (e) { /* ignore */ }
//   return []   // start with no keywords
// }

// function escapeRe(s) {
//   return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// }

// function Highlight({ text, terms }) {
//   if (!text) return null
//   if (!terms.length) return <>{text}</>
//   const re = new RegExp('(' + terms.map(escapeRe).join('|') + ')', 'gi')
//   const parts = String(text).split(re)
//   return (
//     <>
//       {parts.map((p, i) =>
//         terms.some(t => t.toLowerCase() === p.toLowerCase())
//           ? <mark key={i}>{p}</mark>
//           : <span key={i}>{p}</span>
//       )}
//     </>
//   )
// }

// export default function App() {
//   const [rows, setRows] = useState([])
//   const [total, setTotal] = useState(0)
//   const [page, setPage] = useState(0)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   const [query, setQuery] = useState('')
//   const [debounced, setDebounced] = useState('')
//   const [portal, setPortal] = useState('')
//   const [last7, setLast7] = useState(false)
//   const [watchOnly, setWatchOnly] = useState(false)
//   const [activeKw, setActiveKw] = useState(null)

//   const [keywords, setKeywords] = useState(loadKeywords)
//   const [kwInput, setKwInput] = useState('')
//   const [kwCounts, setKwCounts] = useState({})

//   const [portals, setPortals] = useState([])
//   const [orgCount, setOrgCount] = useState(0)
//   const [lastSync, setLastSync] = useState(null)
//   const [liveBump, setLiveBump] = useState(0)

//   const [email, setEmail] = useState(() => localStorage.getItem('tender-email') || '')
//   const [activeEmail, setActiveEmail] = useState('')
//   const [syncMsg, setSyncMsg] = useState('')

//   // ownerRef holds the email that the CURRENT keywords belong to.
//   // The auto-save only writes when ownerRef matches activeEmail — this stops
//   // one account's keywords ever being written into another account's row.
//   const ownerRef = useRef(null)
//   // suppressSaveRef skips exactly one auto-save (the one caused by a load).
//   const suppressSaveRef = useRef(false)

//   const listTop = useRef(null)

//   const openTender = (e, url) => {
//     e.preventDefault()
//     const w = window.open(url, '_blank')
//     if (!w) return
//     setTimeout(() => {
//       try { w.location.href = url } catch (err) { /* tab closed or blocked */ }
//     }, 1200)
//   }

//   useEffect(() => {
//     localStorage.setItem(KW_STORE, JSON.stringify(keywords))
//   }, [keywords])

//   useEffect(() => {
//     const t = setTimeout(() => { setDebounced(query); setPage(0) }, 300)
//     return () => clearTimeout(t)
//   }, [query])

//   const buildQuery = useCallback((select, opts) => {
//     let q = supabase.from(TABLE).select(select, opts)

//     if (portal) q = q.eq('portal', portal)

//     if (last7) {
//       const cutoff = new Date()
//       cutoff.setDate(cutoff.getDate() - 7)
//       q = q.gte('published_at', cutoff.toISOString())
//     }

//     if (debounced.trim()) {
//       const s = debounced.trim().replace(/[,()]/g, ' ')
//       q = q.or(
//         `title.ilike.%${s}%,organisation_name.ilike.%${s}%,tender_id.ilike.%${s}%,reference_no.ilike.%${s}%`
//       )
//     }

//     const terms = activeKw ? [activeKw] : (watchOnly ? keywords : [])
//     if (terms.length) {
//       const ors = terms
//         .flatMap(k => [`title.ilike.%${k}%`, `organisation_name.ilike.%${k}%`])
//         .join(',')
//       q = q.or(ors)
//     }

//     return q
//   }, [portal, last7, debounced, activeKw, watchOnly, keywords])

//   useEffect(() => {
//     let cancelled = false
//     setLoading(true)
//     setError(null)

//     const from = page * PAGE_SIZE
//     const to = from + PAGE_SIZE - 1

//     buildQuery('*', { count: 'exact' })
//       .order('published_at', { ascending: false, nullsFirst: false })
//       .range(from, to)
//       .then(({ data, count, error }) => {
//         if (cancelled) return
//         if (error) { setError(error.message); setLoading(false); return }
//         setRows(data || [])
//         setTotal(count || 0)
//         setLoading(false)
//         if (data && data.length && !lastSync) setLastSync(data[0].updated_at)
//       })

//     return () => { cancelled = true }
//   }, [buildQuery, page, liveBump])

//   useEffect(() => {
//     supabase.from('portal_counts').select('*').then(({ data, error }) => {
//       if (error || !data) return
//       setPortals(data.map(r => [r.portal, r.n]))
//     })
//   }, [liveBump])

//   useEffect(() => {
//     supabase.from('org_count').select('n').single().then(({ data }) => {
//       if (data) setOrgCount(data.n)
//     })
//   }, [liveBump])

//   useEffect(() => {
//     let cancelled = false
//     if (keywords.length === 0) { setKwCounts({}); return }
//     Promise.all(
//       keywords.map(k =>
//         supabase
//           .from(TABLE)
//           .select('id', { count: 'exact', head: true })
//           .or(`title.ilike.%${k}%,organisation_name.ilike.%${k}%`)
//           .then(({ count }) => [k, count || 0])
//       )
//     ).then(pairs => {
//       if (!cancelled) setKwCounts(Object.fromEntries(pairs))
//     })
//     return () => { cancelled = true }
//   }, [keywords, liveBump])

//   useEffect(() => {
//     const channel = supabase
//       .channel('all-tenders-live')
//       .on('postgres_changes',
//         { event: '*', schema: 'public', table: TABLE },
//         () => {
//           clearTimeout(window.__tenderBump)
//           window.__tenderBump = setTimeout(() => setLiveBump(v => v + 1), 1500)
//         })
//       .subscribe()
//     return () => { supabase.removeChannel(channel) }
//   }, [])

//   // ---- shared loader used by both the mount effect and the Sync button ----
//   const applyLoadedKeywords = (em, kw) => {
//     suppressSaveRef.current = true   // the setKeywords below must NOT trigger a save
//     ownerRef.current = em            // these keywords now belong to em
//     setActiveEmail(em)
//     setKeywords(Array.isArray(kw) ? kw : [])
//   }

//   // auto-load saved keywords if this browser already knows an email
//   useEffect(() => {
//     const em = localStorage.getItem('tender-email')
//     if (!em) return
//     supabase.from('preferences').select('keywords').eq('email', em).maybeSingle()
//       .then(({ data }) => {
//         applyLoadedKeywords(em, data && data.keywords ? data.keywords : [])
//       })
//   }, [])

//   // once an email is active, persist keyword changes to the DB (debounced).
//   // Guard: only save if the current keywords actually belong to activeEmail.
//   useEffect(() => {
//     if (!activeEmail) return
//     if (suppressSaveRef.current) { suppressSaveRef.current = false; return }
//     if (ownerRef.current !== activeEmail) return   // keywords not owned by this email yet — don't write

//     const t = setTimeout(() => {
//       supabase.from('preferences').upsert({
//         email: activeEmail,
//         keywords,
//         updated_at: new Date().toISOString()
//       }).then(({ error }) => {
//         if (error) setSyncMsg('Save failed: ' + error.message)
//         else setSyncMsg('Saved ' + keywords.length + ' keywords')
//       })
//     }, 400)
//     return () => clearTimeout(t)
//   }, [keywords, activeEmail])

//   const addKeyword = () => {
//     const v = kwInput.trim().toLowerCase()
//     if (v && !keywords.includes(v)) setKeywords([...keywords, v])
//     setKwInput('')
//   }

//   const removeKeyword = (k) => {
//     setKeywords(keywords.filter(x => x !== k))
//     if (activeKw === k) setActiveKw(null)
//   }

//   const syncPreferences = async () => {
//     const em = email.trim().toLowerCase()
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setSyncMsg('Enter a valid email address'); return }

//     // switching to a DIFFERENT email than the one currently active?
//     const switching = activeEmail && em !== activeEmail

//     setSyncMsg('Syncing…')

//     const { data, error } = await supabase
//       .from('preferences').select('keywords').eq('email', em).maybeSingle()

//     if (error) { setSyncMsg('Error: ' + error.message); return }

//     localStorage.setItem('tender-email', em)

//     if (data && Array.isArray(data.keywords) && data.keywords.length) {
//       // existing record -> load it (atomic switch, guarded against cross-save)
//       applyLoadedKeywords(em, data.keywords)
//       setSyncMsg('Loaded ' + data.keywords.length + ' keywords for ' + em)
//     } else if (switching) {
//       // switching to a NEW email: start that account fresh (empty),
//       // do NOT copy the previous account's keywords into it
//       applyLoadedKeywords(em, [])
//       await supabase.from('preferences').upsert({
//         email: em, keywords: [], updated_at: new Date().toISOString()
//       })
//       setSyncMsg('Switched to ' + em + ' (no saved keywords yet)')
//     } else {
//       // first email of the session, brand-new record:
//       // save whatever the user has already typed on screen
//       ownerRef.current = em
//       setActiveEmail(em)
//       const { error: upErr } = await supabase
//         .from('preferences')
//         .upsert({ email: em, keywords, updated_at: new Date().toISOString() })
//       setSyncMsg(upErr ? 'Error: ' + upErr.message : 'Saved ' + keywords.length + ' keywords')
//     }
//   }

//   const highlightTerms = useMemo(
//     () => (activeKw ? [activeKw] : keywords),
//     [activeKw, keywords]
//   )

//   const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

//   const goPage = (p) => {
//     setPage(p)
//     listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
//   }

//   return (
//     <>
//       <header>
//         <div className="head-in">
//           <div className="brand">
//             <h1>Tender tracker</h1>
//             <span className="sync">
//               {lastSync
//                 ? 'Synced ' + new Date(lastSync).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
//                 : 'Loading…'}
//             </span>
//           </div>
//           {/* <span className="live"><span className="dot" /> Live</span> */}
//         </div>
//       </header>

//       <div className="wrap">
//         <main>
//         <div className="stats">
//             <div className="stat">
//               <div className="k">Portals</div>
//               <div className="v">{portals.length}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Organisations</div>
//               <div className="v">{orgCount.toLocaleString('en-IN')}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Matching</div>
//               <div className="v">{total.toLocaleString('en-IN')}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Page</div>
//               <div className="v">{page + 1}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / {pageCount}</span></div>
//             </div>
//           </div>

//           <div className="bar">
//             <div className="search">
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
//               </svg>
//               <input
//                 type="text"
//                 value={query}
//                 onChange={e => setQuery(e.target.value)}
//                 placeholder="Search title, organisation or tender ID"
//               />
//             </div>
//             <button
//               className={'btn' + (last7 ? ' on' : '')}
//               onClick={() => { setLast7(!last7); setPage(0) }}
//             >Last 7 days</button>
//             <button
//               className={'btn' + (watchOnly ? ' on' : '')}
//               onClick={() => { setWatchOnly(!watchOnly); setActiveKw(null); setPage(0) }}
//             >Watchlist only</button>
//           </div>

//           <div className="listhead" ref={listTop}>
//             <span>
//               {loading ? 'Loading…' : `Showing ${rows.length} of ${total.toLocaleString('en-IN')}`}
//             </span>
//             <span>Newest first</span>
//           </div>

//           {error && <div className="empty">Couldn't load tenders. {error}</div>}

//           {!error && !loading && rows.length === 0 && (
//             <div className="empty">No tenders match these filters. Try clearing the search or watchlist.</div>
//           )}

//           <div id="rows">
//             {rows.map(d => {
//               const blob = ((d.title || '') + ' ' + (d.organisation_name || '')).toLowerCase()
//               const hits = keywords.filter(k => blob.includes(k.toLowerCase()))
//               return (
//                 <article key={d.id} className={'row' + (d.attention === 'new' ? ' isnew' : '')}>
//                   <div>
//                     <div className="tags">
//                       {d.attention === 'new' && <span className="tag new">new</span>}
//                       <span className="tag">{d.portal}</span>
//                       {hits.map(k => <span key={k} className="tag kw">{k}</span>)}
//                     </div>
//                     <p className="title">
//                       <Highlight text={d.title} terms={highlightTerms} />
//                     </p>
//                     <p className="meta">
//                       <b>{d.organisation_name}</b>
//                       {/* {d.tender_id && <> &nbsp;·&nbsp; <span className="mono">{d.tender_id}</span></>} */}
//                     </p>
//                   </div>
//                   <div className="right">
//                     <span className="lbl">Published</span>
//                     <span>{d.epublished_date || '—'}</span>
//                     <span className="lbl" style={{ marginTop: 4 }}>Closes</span>
//                     <span className="close">{d.closing_date || '—'}</span>
//                     {d.detail_link && (
//                       <a
//                         className="open"
//                         href={d.detail_link}
//                         target="_blank"
//                         rel="noreferrer"
//                         onClick={e => openTender(e, d.detail_link)}
//                       >
//                         Open tender →
//                       </a>
//                     )}
//                   </div>
//                 </article>
//               )
//             })}
//           </div>

//           <div className="pager">
//             <span>Page {page + 1} of {pageCount}</span>
//             <span>
//               <button className="btn" disabled={page === 0} onClick={() => goPage(page - 1)}>Previous</button>
//               {' '}
//               <button className="btn" disabled={page + 1 >= pageCount} onClick={() => goPage(page + 1)}>Next</button>
//             </span>
//           </div>
//         </main>

//         <aside>
//           <div className="panel">
//             <h2>Portal</h2>
//             <select
//               value={portal}
//               onChange={e => { setPortal(e.target.value); setPage(0) }}
//               style={{ width: '100%' }}
//             >
//               <option value="">All portals</option>
//               {portals.map(([name, count]) => (
//                 <option key={name} value={name}>{name} ({count.toLocaleString('en-IN')})</option>
//               ))}
//             </select>
//           </div>

//           <div className="panel">
//             <h2>Keyword watchlist <span className="mono">{keywords.length}</span></h2>
//             <div className="kwadd">
//               <input
//                 type="text"
//                 value={kwInput}
//                 onChange={e => setKwInput(e.target.value)}
//                 onKeyDown={e => { if (e.key === 'Enter') addKeyword() }}
//                 placeholder="Add a keyword"
//               />
//               <button onClick={addKeyword} aria-label="Add keyword">+</button>
//             </div>
//             <div className="kwlist">
//               {keywords.length === 0 && (
//                 <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>No keywords yet. Add one above.</p>
//               )}
//               {keywords.map(k => (
//                 <div
//                   key={k}
//                   className={'kw' + (activeKw === k ? ' active' : '')}
//                   onClick={() => { setActiveKw(activeKw === k ? null : k); setWatchOnly(false); setPage(0) }}
//                 >
//                   <span>{k}</span>
//                   <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <span className="n">{kwCounts[k] ?? '·'}</span>
//                     <span
//                       className="x"
//                       onClick={e => { e.stopPropagation(); removeKeyword(k) }}
//                     >×</span>
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="panel">
//             <h2>Load / save preferences</h2>
//             <label style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
//               Enter your email
//             </label>
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               onKeyDown={e => { if (e.key === 'Enter') syncPreferences() }}
//               placeholder="you@example.com"
//               style={{
//                 width: '100%', height: 34, padding: '0 10px', marginBottom: 8,
//                 border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
//                 font: 'inherit', fontSize: 13
//               }}
//             />
//             <button className="btn" style={{ width: '100%' }} onClick={syncPreferences}>
//               Sync preferences
//             </button>
//             {syncMsg && (
//               <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>{syncMsg}</p>
//             )}
//           </div>
//         </aside>
//       </div>
//     </>
//   )
// }












































import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase, TABLE } from './supabase'

const PAGE_SIZE = 50



// Every tender opens straight to its portal homepage. Keyed by the
// detail-link hostname.
const PORTAL_HOME = {
  'uktenders.gov.in':                'https://uktenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'mahatenders.gov.in':              'https://mahatenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'assamtenders.gov.in':             'https://assamtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'tendersodisha.gov.in':            'https://tendersodisha.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'eprocure.goa.gov.in':             'https://eprocure.goa.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'mptenders.gov.in':                'https://mptenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'tenders.ladakh.gov.in':           'https://tenders.ladakh.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'eproc.punjab.gov.in':             'https://eproc.punjab.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'etenders.hry.nic.in':             'https://etenders.hry.nic.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'arunachaltenders.gov.in':         'https://arunachaltenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'hptenders.gov.in':                'https://hptenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'jharkhandtenders.gov.in':         'https://jharkhandtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'etenders.kerala.gov.in':          'https://etenders.kerala.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'manipurtenders.gov.in':           'https://manipurtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'meghalayatenders.gov.in':         'https://meghalayatenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'mizoramtenders.gov.in':           'https://mizoramtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'nagalandtenders.gov.in':          'https://nagalandtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'eproc.rajasthan.gov.in':          'https://eproc.rajasthan.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'sikkimtender.gov.in':             'https://sikkimtender.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'tntenders.gov.in':                'https://tntenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'tripuratenders.gov.in':           'https://tripuratenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'etender.up.nic.in':               'https://etender.up.nic.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'wbtenders.gov.in':                'https://wbtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'eprocure.andamannicobar.gov.in':  'https://eprocure.andamannicobar.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'etenders.chd.nic.in':             'https://etenders.chd.nic.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'dnhtenders.gov.in':               'https://dnhtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'ddtenders.gov.in':                'https://ddtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'govtprocurement.delhi.gov.in':    'https://govtprocurement.delhi.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'jktenders.gov.in':                'https://jktenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'tendersutl.gov.in':               'https://tendersutl.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'pudutenders.gov.in':              'https://pudutenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'eprocure.gov.in':                 'https://eprocure.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'etenders.gov.in':                 'https://etenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
  'eprocurebhel.co.in':              'https://eprocurebhel.co.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page'
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function Highlight({ text, terms }) {
  if (!text) return null
  if (!terms.length) return <>{text}</>
  const re = new RegExp('(' + terms.map(escapeRe).join('|') + ')', 'gi')
  const parts = String(text).split(re)
  return (
    <>
      {parts.map((p, i) =>
        terms.some(t => t.toLowerCase() === p.toLowerCase())
          ? <mark key={i}>{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}


// function Logo() {
//   return (
//     <svg viewBox="0 0 624 624" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-label="Tender tracker logo">
//       <path fill="#374151" d="M350.856873,61.751625 C358.602020,61.507965 364.427094,64.176849 369.496277,69.519218 C391.628754,92.844437 413.979950,115.961967 436.199493,139.204819 C442.116730,145.394547 444.930817,152.705826 444.466949,161.457275 C444.047607,169.368423 444.378387,177.319336 444.378387,186.302185 C436.100616,182.272339 429.256897,184.715042 422.617950,188.104446 C419.938354,184.406616 421.677643,180.859787 421.667664,177.508270 C421.645203,169.943069 421.764740,169.906631 414.373413,169.890594 C401.714447,169.863159 389.055206,169.931808 376.396393,169.877319 C354.860382,169.784622 341.952087,156.675751 341.983215,135.071991 C342.004578,120.240044 341.837921,105.406441 342.026215,90.577011 C342.079498,86.377541 340.583649,85.109009 336.515930,85.113823 C262.355591,85.201553 188.195084,85.156898 114.034698,85.222305 C103.242783,85.231827 96.201530,92.886971 96.191902,104.387100 C96.147110,157.882568 96.157097,211.378098 96.157448,264.873596 C96.157997,349.366516 96.168221,433.859436 96.169983,518.352356 C96.170288,532.595825 103.035774,539.583374 117.214455,539.593994 C156.544388,539.623413 195.874359,539.609741 235.204315,539.619385 C244.699280,539.621765 249.978043,543.498718 250.142395,550.556824 C250.314484,557.946411 244.943451,562.168396 235.249115,562.171204 C195.419113,562.182922 155.589127,562.186768 115.759125,562.167908 C90.672600,562.156067 72.977493,544.475647 72.971474,519.287292 C72.946594,415.129486 72.968369,310.971680 72.972061,206.813858 C72.973259,173.150055 72.916672,139.486115 72.991455,105.822479 C73.037704,85.001808 84.455635,69.073151 103.075417,63.402187 C107.435585,62.074223 111.868759,61.728584 116.398201,61.730286 C194.391403,61.759594 272.384613,61.751450 350.856873,61.751625 M365.167023,115.510056 C365.167236,122.174103 365.107910,128.838821 365.183624,135.502014 C365.267853,142.912460 368.765717,146.530243 376.256866,146.656067 C385.417358,146.809952 394.582672,146.739517 403.745056,146.665604 C405.469818,146.651703 407.391815,147.275848 409.332489,145.482681 C394.958618,130.572311 380.657684,115.737579 366.356720,100.902840 C365.960724,101.137192 365.564697,101.371544 365.168701,101.605896 C365.168701,105.909355 365.168701,110.212822 365.167023,115.510056 z"/>
//       <path fill="#92400E" d="M454.583282,369.338043 C459.899200,372.511932 464.972992,375.383179 469.893280,378.497009 C474.948517,381.696259 476.742676,386.773773 475.098267,392.338196 C473.737793,396.941803 469.923065,399.411896 463.783173,399.413116 C403.327606,399.425415 342.872040,399.420441 282.416473,399.384125 C275.749390,399.380127 272.103546,396.836426 270.627136,391.514893 C269.199127,386.367798 271.461914,381.153748 276.755615,378.085144 C303.243622,362.730652 330.173492,348.085419 356.096283,331.832336 C368.109070,324.300537 377.462677,324.298615 389.361816,331.789093 C410.471832,345.077728 432.582031,356.777435 454.583282,369.338043 z"/>
//       <path fill="#C4C9CF" d="M379.686218,259.999939 C379.688324,246.019791 379.643250,232.539429 379.716064,219.059692 C379.745331,213.643951 381.108185,212.637436 386.027008,214.759537 C399.922791,220.754471 413.726593,226.962418 427.581146,233.053421 C430.841583,234.486847 432.300354,236.769852 432.286041,240.445358 C432.172058,269.735199 432.207703,299.025604 432.137634,328.315704 C432.121246,335.159546 430.832550,335.880219 424.925385,332.551727 C411.187256,324.810791 397.509705,316.961365 383.722076,309.310059 C380.423462,307.479492 379.671204,304.817383 379.681427,301.439819 C379.722687,287.793335 379.691071,274.146576 379.686218,259.999939 z"/>
//       <path fill="#2E3645" d="M454.917480,333.653259 C454.837463,337.099213 454.893097,340.097290 454.658813,343.072479 C454.403046,346.320099 452.624573,347.627991 449.554413,346.084686 C446.137390,344.367126 442.849792,342.393860 439.482025,340.576019 C436.282776,338.849091 436.165863,335.757263 436.137878,332.767853 C436.030457,321.281128 436.030090,309.793335 436.015747,298.305878 C435.992706,279.825836 436.131317,261.343964 435.888794,242.866974 C435.820587,237.667007 437.563354,234.633560 442.379181,232.452042 C457.231903,225.724045 471.905334,218.600128 486.647461,211.628067 C491.756317,209.211899 493.315460,210.091309 493.338196,215.737671 C493.415955,235.049652 493.401520,254.361984 493.426117,273.674194 C493.428040,275.172241 493.269531,276.701813 493.512299,278.162476 C494.337830,283.129883 492.208252,285.644318 487.549988,287.468597 C478.728485,290.923248 470.259552,295.269073 461.490021,298.869232 C456.381104,300.966644 454.485626,304.517914 454.606903,309.734619 C454.788666,317.553070 454.826385,325.374878 454.917480,333.653259 z"/>
//       <path fill="#9CA3AF" d="M178.034515,253.339874 C167.731155,253.123642 157.936844,254.674484 148.105530,253.351318 C141.613129,252.477539 137.682312,248.742432 137.703751,242.826752 C137.725662,236.787659 142.058182,232.299652 148.363022,231.808197 C149.191528,231.743607 150.027527,231.763504 150.860046,231.763824 C200.489731,231.782867 250.119400,231.814423 299.749084,231.811722 C305.985016,231.811386 312.018433,232.559814 317.698761,235.375183 C320.592163,236.809250 322.516235,238.931915 323.151947,242.080948 C323.816589,245.373367 324.452698,248.637650 327.742310,250.528412 C325.809906,254.015076 322.875793,253.218445 320.422485,253.226486 C291.610901,253.320999 262.799042,253.336166 233.987259,253.353302 C215.501022,253.364288 197.014755,253.343826 178.034515,253.339874 z"/>
//       <path fill="#374151" d="M281.999969,568.406677 C275.834473,568.409180 270.168671,568.447754 264.503479,568.404358 C257.911194,568.353882 254.401520,565.375305 254.466003,559.985168 C254.528473,554.764954 258.263428,551.632996 264.707458,551.628052 C305.699310,551.596436 346.691162,551.592285 387.683014,551.599792 C419.010101,551.605469 450.337189,551.646729 481.664276,551.656128 C484.683502,551.657043 487.754517,551.502075 490.173523,553.724976 C492.541870,555.901367 493.602600,558.650391 492.831940,561.850647 C492.019623,565.223755 489.848053,567.448181 486.435150,568.125977 C484.662201,568.478027 482.788818,568.389526 480.960815,568.389893 C414.807190,568.403503 348.653564,568.404175 281.999969,568.406677 z"/>
//       <path fill="#9CA3AF" d="M222.999420,321.187714 C202.727570,320.397003 182.879074,321.792114 163.175491,319.116364 C161.203964,318.848633 159.182663,318.561279 157.329956,317.884613 C153.386734,316.444366 149.938004,314.252411 150.365326,309.351685 C150.773468,304.670837 155.429413,300.322662 160.075012,300.113373 C164.733398,299.903503 169.407318,300.058441 174.068939,299.896179 C218.028336,298.366180 262.003113,298.575165 305.976746,298.714661 C317.832397,298.752289 323.262360,307.063873 318.710510,317.991425 C317.431213,321.062500 314.695099,321.163635 311.986816,321.173218 C300.821899,321.212677 289.656860,321.223969 278.491852,321.222870 C260.161041,321.221069 241.830246,321.201630 222.999420,321.187714 z"/>
//       <path fill="#374151" d="M367.000000,426.189819 C339.173004,426.190308 311.845978,426.189850 284.518982,426.188263 C283.352631,426.188202 282.184113,426.221100 281.020264,426.164398 C274.859009,425.864227 270.888306,422.270721 271.095673,417.211884 C271.311737,411.940125 275.061707,408.803406 281.425110,408.801331 C342.244354,408.781647 403.063629,408.789185 463.882874,408.798431 C465.873444,408.798737 467.921600,408.617188 469.750519,409.649628 C473.125244,411.554688 474.812042,414.463409 474.368134,418.340027 C473.954895,421.948608 472.132660,424.472290 468.411163,425.515411 C465.942261,426.207428 463.470123,426.165436 460.978516,426.166565 C429.819000,426.180603 398.659515,426.183197 367.000000,426.189819 z"/>
//       <path fill="#C4C9CF" d="M525.294800,386.323029 C522.438904,387.760468 519.960083,389.135132 517.372864,390.260529 C513.693359,391.861084 511.466309,390.490570 511.247345,386.536255 C511.008545,382.223572 511.029572,377.890686 511.086060,373.568542 C511.266418,359.771454 510.594360,345.967407 511.532227,332.173248 C511.731140,329.247650 512.463013,326.983978 515.323303,325.796906 C528.535156,320.313660 540.323975,312.005768 553.589172,306.597534 C559.635193,304.132568 561.075684,304.763123 561.093872,311.264862 C561.141357,328.229065 561.032837,345.193878 561.113770,362.157806 C561.134399,366.492981 559.443237,369.290955 555.495728,371.202118 C545.474976,376.053619 535.572998,381.150391 525.294800,386.323029 z"/>
//       <path fill="#92400E" d="M145.170197,164.604645 C147.461166,163.657913 149.469818,163.745270 151.465103,163.745758 C189.903992,163.755112 228.342880,163.773941 266.781769,163.764832 C269.984650,163.764069 273.078033,164.000778 275.899139,165.752075 C279.822479,168.187637 281.709351,171.673843 281.165619,176.249619 C280.624817,180.800507 278.029999,183.941071 273.667267,185.291687 C271.643768,185.918121 269.417908,186.120895 267.283203,186.123901 C228.677979,186.178528 190.072662,186.194382 151.467392,186.165085 C142.482544,186.158264 137.477142,181.885635 137.712143,174.658890 C137.870132,169.800400 140.388885,166.593338 145.170197,164.604645 z"/>
//       <path fill="#2E3645" d="M542.997559,292.056702 C540.670654,291.152740 538.924744,290.066956 538.887939,287.732941 C538.809265,282.746185 538.780457,277.751953 538.977661,272.770508 C539.072449,270.376892 540.902466,269.032227 542.969910,268.072296 C555.944824,262.047943 568.890686,255.960434 581.900574,250.012589 C585.965576,248.154129 587.472717,249.085373 587.506958,253.649582 C587.697998,279.093323 587.762878,304.538025 587.858276,329.982483 C587.872131,333.678528 586.294189,336.250153 582.740845,337.729950 C578.754028,339.390320 574.946228,341.478516 570.968140,343.162292 C566.411377,345.090881 564.912231,344.111847 564.858276,339.040161 C564.750244,328.890808 564.654358,318.735046 564.908508,308.590851 C565.034302,303.568665 563.291504,300.439911 558.504150,298.657715 C553.368469,296.745911 548.404907,294.371948 542.997559,292.056702 z"/>
//       <path fill="#374151" d="M445.000061,527.678467 C452.161743,527.688538 458.825775,527.594299 465.484375,527.743713 C470.419647,527.854431 473.647095,530.799194 474.026245,535.121399 C474.374634,539.093567 472.080536,541.874146 468.118225,542.206116 C466.959839,542.303162 465.787964,542.247192 464.622253,542.247314 C403.333984,542.255737 342.045715,542.264038 280.757446,542.267822 C273.752625,542.268311 271.126404,540.492310 271.154358,535.819580 C271.183746,530.908936 274.993317,527.705750 281.120117,527.702515 C335.580109,527.674072 390.040070,527.681763 445.000061,527.678467 z"/>
//       <path fill="#374151" d="M325.272461,510.546570 C327.509308,511.592041 328.628326,512.921814 327.748016,515.062683 C327.009827,516.857849 325.363770,517.240112 323.610107,517.238586 C313.119781,517.229614 302.629395,517.222656 292.139130,517.186096 C290.250305,517.179504 288.342499,516.918274 287.676147,514.769043 C286.987732,512.548706 288.294525,511.396759 290.208923,510.622925 C292.524536,509.686920 292.559692,507.549805 292.551147,505.558594 C292.495331,492.573883 292.343475,479.589569 292.299286,466.604858 C292.280609,461.117096 292.544922,455.627747 292.489655,450.141022 C292.460114,447.208679 292.651917,444.070801 288.892578,442.728668 C287.628632,442.277405 287.047882,440.771393 287.390076,439.333313 C287.787384,437.663879 289.096436,436.808136 290.706451,436.799896 C302.027588,436.741913 313.349152,436.740448 324.670441,436.772552 C326.304718,436.777191 327.595306,437.613953 327.992065,439.280426 C328.390259,440.952850 327.591370,442.391266 326.141693,443.000275 C323.239227,444.219604 323.024994,446.532837 323.028198,449.149750 C323.050903,467.799591 323.019806,486.449463 323.058960,505.099243 C323.062988,507.018494 322.629639,509.213257 325.272461,510.546570 z"/>
//       <path fill="#374151" d="M386.934387,488.999451 C386.940308,496.139923 386.940308,502.780670 386.940308,509.298798 C387.457428,510.297119 388.355042,510.275116 389.142975,510.477875 C391.006989,510.957581 392.093567,512.166626 391.832733,514.079712 C391.578217,515.946411 390.155975,517.098816 388.365143,517.111145 C377.389435,517.187134 366.412506,517.172668 355.436829,517.085999 C353.832397,517.073364 352.626709,515.932983 352.206360,514.368103 C351.739563,512.630249 352.779755,511.372589 354.242401,510.805328 C357.379913,509.588501 357.642273,507.070618 357.638397,504.286652 C357.612793,485.984985 357.582336,467.683228 357.620605,449.381683 C357.626709,446.463745 356.944214,444.234467 353.976746,442.990540 C352.539734,442.388184 351.694305,440.963562 352.198669,439.278931 C352.676819,437.682007 353.956421,436.789368 355.577881,436.781799 C366.556488,436.730499 377.535400,436.730255 388.514130,436.759705 C390.156036,436.764099 391.411957,437.612762 391.868744,439.244995 C392.338531,440.923523 391.572510,442.393097 390.125549,442.985077 C386.698151,444.387329 386.892029,447.197968 386.897827,450.066162 C386.923645,462.877289 386.920929,475.688477 386.934387,488.999451 z"/>
//       <path fill="#374151" d="M421.565002,505.345459 C421.585083,486.419312 421.590454,467.927582 421.582062,449.435822 C421.580811,446.648804 422.096252,443.689270 418.034149,442.906738 C416.505798,442.612366 415.686707,440.988525 416.161713,439.306885 C416.687073,437.447083 418.220947,436.762299 420.019226,436.740570 C425.182983,436.678253 430.347412,436.655396 435.511627,436.649872 C440.675934,436.644348 445.840271,436.684509 451.004608,436.692505 C453.154999,436.695831 455.137848,437.119171 455.566437,439.599091 C455.942719,441.776611 454.693329,443.090607 452.610260,443.481842 C450.373566,443.901886 450.276245,445.504944 450.276672,447.250244 C450.281555,466.908203 450.303680,486.566193 450.253265,506.224030 C450.247284,508.560333 451.098694,509.946655 453.328094,510.704498 C454.909271,511.241943 455.675079,512.590515 455.442474,514.267700 C455.166199,516.259705 453.666779,517.117310 451.889801,517.130310 C441.229706,517.208496 430.568848,517.211548 419.908386,517.179993 C418.064026,517.174561 416.681244,516.163940 416.258881,514.335449 C415.857208,512.596313 416.880768,511.332245 418.426208,510.876495 C421.120758,510.081818 421.309174,507.964508 421.565002,505.345459 z"/>
//       <path fill="#C4C9CF" d="M489.403137,368.657776 C480.770752,363.892181 472.508362,359.214569 464.118408,354.778107 C460.296417,352.757019 458.610962,350.051056 458.713074,345.617401 C458.966156,334.629150 458.778748,323.631439 458.855316,312.638153 C458.900269,306.184906 460.391602,305.500458 466.435791,307.935364 C479.114166,313.042877 490.654968,320.444672 503.180511,325.835999 C506.154968,327.116302 507.340973,329.313843 507.320709,332.529114 C507.240875,345.188080 507.337769,357.848114 507.256042,370.507080 C507.221710,375.823181 505.477905,376.888184 500.804474,374.599640 C497.066833,372.769318 493.412384,370.769043 489.403137,368.657776 z"/>
//       <path fill="#DCE1E7" d="M390.612976,205.556900 C404.289948,199.777924 417.550568,193.990143 431.137756,188.987885 C433.959198,187.949142 436.566162,187.722366 439.355896,188.809494 C445.088348,191.043411 450.871277,193.149429 456.583344,195.433365 C460.004761,196.801407 461.443604,198.514877 459.287262,202.664368 C456.869110,207.317627 458.010132,213.109955 455.948120,218.073563 C455.511322,219.125000 455.534424,220.772705 454.788116,221.224304 C450.104828,224.058121 445.140137,226.434021 440.506439,229.340683 C434.788330,232.927612 430.056976,229.968384 425.056183,227.710358 C413.541260,222.510986 401.968964,217.438736 390.438446,212.273575 C388.692719,211.491547 386.496948,211.170792 385.983978,208.763382 C386.627441,206.604141 388.748291,206.575928 390.612976,205.556900 z"/>
//       <path fill="#9CA3AF" d="M236.915466,389.180359 C222.114624,389.133087 207.800278,389.141937 193.487213,389.011658 C186.862076,388.951385 183.403580,386.556030 181.534698,381.186310 C179.132980,374.285645 184.335556,367.263794 192.527649,367.040436 C203.504913,366.741150 214.495560,366.923004 225.480469,366.920044 C230.640045,366.918671 235.802399,366.871063 240.958572,367.017365 C248.797394,367.239746 253.844193,371.669342 253.770035,378.072662 C253.696167,384.453339 248.452744,388.971161 240.897583,389.153961 C239.733032,389.182159 238.567535,389.171997 236.915466,389.180359 z"/>
//       <path fill="#DCE1E7" d="M488.582275,292.540192 C493.839661,289.638397 498.600677,286.609222 503.806152,284.310883 C507.596283,282.637482 511.139038,282.297058 514.853271,283.987335 C519.093628,285.917023 523.299316,287.923553 527.508057,289.921997 C528.588989,290.435272 529.546997,291.101044 529.442322,292.524048 C522.276428,297.215851 522.283142,297.212616 526.472351,305.847473 C527.198242,307.343719 527.946289,308.843506 528.494080,310.408203 C529.182495,312.374542 528.762512,314.386383 526.685730,314.941925 C523.311462,315.844666 520.861633,318.034485 518.312805,320.089386 C511.630524,325.476654 504.994446,323.468445 498.957489,319.420105 C494.611053,316.505463 489.989960,314.396393 485.283875,312.364990 C479.361694,309.808624 474.182281,306.036682 467.674408,302.068115 C473.227203,299.645355 477.125000,295.315796 482.925598,294.828857 C485.093353,294.646881 486.747284,294.081909 488.582275,292.540192 z"/>
//       <path fill="#DCE1E7" d="M510.646790,259.291901 C517.087097,262.094696 523.111450,264.926392 529.313049,267.294250 C533.712585,268.974091 535.318115,271.773895 535.305908,276.395752 C535.273499,288.686462 534.871216,289.037323 523.652100,283.862396 C521.842041,283.027496 519.981140,282.289856 518.222961,281.357788 C513.265381,278.729523 508.332245,277.869171 503.071259,280.668488 C499.293457,282.678619 497.530090,281.275909 497.615204,277.013000 C497.737946,270.866852 497.675507,264.716675 497.661652,258.568268 C497.654419,255.351120 499.068542,254.307083 502.065796,255.580978 C504.817413,256.750458 507.560059,257.941132 510.646790,259.291901 z"/>
//     </svg>
//   );
// }

export default function App() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [selectedPortals, setSelectedPortals] = useState([])
  const [portalMenuOpen, setPortalMenuOpen] = useState(false)
  const [last7, setLast7] = useState(false)
  const [closing7, setClosing7] = useState(false)
  const [watchOnly, setWatchOnly] = useState(false)
  const [activeKw, setActiveKw] = useState(null)

  const [keywords, setKeywords] = useState([])   // always start blank
  const [kwInput, setKwInput] = useState('')
  const [kwCounts, setKwCounts] = useState({})

  const [portals, setPortals] = useState([])
  const [orgCount, setOrgCount] = useState(0)
  const [lastSync, setLastSync] = useState(null)
  const [liveBump, setLiveBump] = useState(0)

  const [email, setEmail] = useState('')
  const [activeEmail, setActiveEmail] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [downloading, setDownloading] = useState(false) 
  const [pendingEmail, setPendingEmail] = useState(null)   // email awaiting create-confirmation
  const [manualOpen, setManualOpen] = useState(false)

  // ownerRef holds the email that the CURRENT keywords belong to.
  // Auto-save only writes when ownerRef === activeEmail — stops one account's
  // keywords ever being written into another account's row.
  const ownerRef = useRef(null)
  const suppressSaveRef = useRef(false)   // skip exactly one auto-save (a load)

  const listTop = useRef(null)
  const portalBoxRef = useRef(null)

  // One click -> open the portal homepage directly (no session priming).
  const openTender = (e, url) => {
    e.preventDefault()
    if (!url) return
    let target = url
    try {
      const host = new URL(url).hostname
      if (PORTAL_HOME[host]) target = PORTAL_HOME[host]   // known portal -> its home
      else target = new URL(url).origin                   // unknown -> at least the origin
    } catch (err) {
      target = url
    }
    window.open(target, '_blank')
  }

  const togglePortal = (name) => {
    setSelectedPortals(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    )
    setPage(0)
  }

  useEffect(() => {
    if (!portalMenuOpen) return
    const onClick = (e) => {
      if (portalBoxRef.current && !portalBoxRef.current.contains(e.target)) {
        setPortalMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [portalMenuOpen])

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(query); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [query])

  const buildQuery = useCallback((select, opts) => {
    let q = supabase.from(TABLE).select(select, opts)

    if (selectedPortals.length) q = q.in('portal', selectedPortals)

    if (last7) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      q = q.gte('published_at', cutoff.toISOString())
    }

    if (closing7) {
      const now = new Date()
      const in7 = new Date()
      in7.setDate(in7.getDate() + 7)
      q = q.gte('closing_at', now.toISOString())
           .lte('closing_at', in7.toISOString())
    }

    if (debounced.trim()) {
      const s = debounced.trim().replace(/[,()]/g, ' ')
      q = q.or(
        `title.ilike.%${s}%,organisation_name.ilike.%${s}%,tender_id.ilike.%${s}%,reference_no.ilike.%${s}%`
      )
    }

    const terms = activeKw ? [activeKw] : (watchOnly ? keywords : [])
    if (terms.length) {
      const ors = terms
        .flatMap(k => [`title.ilike.%${k}%`])
        .join(',')
      q = q.or(ors)
    }

    return q
  }, [selectedPortals, last7, debounced, activeKw, watchOnly, keywords,closing7])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    buildQuery('*', { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(from, to)
      .then(({ data, count, error }) => {
        if (cancelled) return
        if (error) { setError(error.message); setLoading(false); return }
        setRows(data || [])
        setTotal(count || 0)
        setLoading(false)
        if (data && data.length && !lastSync) setLastSync(data[0].updated_at)
      })

    return () => { cancelled = true }
  }, [buildQuery, page, liveBump])

  // useEffect(() => {
  //   supabase.from('portal_counts').select('*').then(({ data, error }) => {
  //     if (error || !data) return
  //     setPortals(data.map(r => [r.portal, r.n]))
  //   })
  // }, [liveBump])


  useEffect(() => {
    supabase.from('portal_counts').select('*').then(({ data, error }) => {
      if (error || !data) return
      const priority = ['Central1', 'Central2']
      const sorted = data
        .map(r => [r.portal, r.n])
        .sort((a, b) => {
          const aPri = priority.indexOf(a[0])
          const bPri = priority.indexOf(b[0])
          if (aPri !== -1 || bPri !== -1) {
            if (aPri === -1) return 1
            if (bPri === -1) return -1
            return aPri - bPri
          }
          return a[0].localeCompare(b[0])
        })
      setPortals(sorted)
    })
  }, [liveBump])

  useEffect(() => {
    supabase.from('org_count').select('n').single().then(({ data }) => {
      if (data) setOrgCount(data.n)
    })
  }, [liveBump])

  useEffect(() => {
    let cancelled = false
    if (keywords.length === 0) { setKwCounts({}); return }
    Promise.all(
      keywords.map(k =>
        supabase
          .from(TABLE)
          .select('id', { count: 'exact', head: true })
          .or(`title.ilike.%${k}%`)
          .then(({ count }) => [k, count || 0])
      )
    ).then(pairs => {
      if (!cancelled) setKwCounts(Object.fromEntries(pairs))
    })
    return () => { cancelled = true }
  }, [keywords, liveBump])

  useEffect(() => {
    const channel = supabase
      .channel('all-tenders-live')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        () => {
          clearTimeout(window.__tenderBump)
          window.__tenderBump = setTimeout(() => setLiveBump(v => v + 1), 1500)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const applyLoadedKeywords = (em, kw) => {
    suppressSaveRef.current = true
    ownerRef.current = em
    setActiveEmail(em)
    setKeywords(Array.isArray(kw) ? kw : [])
  }

  // auto-save keyword changes to the DB (debounced), only for the owning email
  useEffect(() => {
    if (!activeEmail) return
    if (suppressSaveRef.current) { suppressSaveRef.current = false; return }
    if (ownerRef.current !== activeEmail) return

    const t = setTimeout(() => {
      supabase.from('preferences').upsert({
        email: activeEmail,
        keywords,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) setSyncMsg('Save failed: ' + error.message)
        else setSyncMsg('Saved ' + keywords.length + ' keywords')
      })
    }, 400)
    return () => clearTimeout(t)
  }, [keywords, activeEmail])

  const addKeyword = () => {
    const v = kwInput.trim().toLowerCase()
    if (v && !keywords.includes(v)) setKeywords([...keywords, v])
    setKwInput('')
  }

  const removeKeyword = (k) => {
    setKeywords(keywords.filter(x => x !== k))
    if (activeKw === k) setActiveKw(null)
  }

  // Step 1: user clicks Sync. Look up the email.
  // If it exists -> load immediately. If not -> ask for confirmation.
  const syncPreferences = async () => {
    const em = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setSyncMsg('Enter a valid email address'); return }

    setPendingEmail(null)
    setSyncMsg('Checking…')

    const { data, error } = await supabase
      .from('preferences').select('keywords').eq('email', em).maybeSingle()

    if (error) { setSyncMsg('Error: ' + error.message); return }

    if (data && Array.isArray(data.keywords)) {
      applyLoadedKeywords(em, data.keywords)
      setSyncMsg('Loaded ' + data.keywords.length + ' keywords for ' + em)
    } else {
      setPendingEmail(em)
      setSyncMsg('')
    }
  }

  // Step 2a: user confirms creating a new preferences record.
  const confirmCreate = async () => {
    const em = pendingEmail
    if (!em) return
    setSyncMsg('Creating…')
    const { error } = await supabase
      .from('preferences')
      .upsert({ email: em, keywords, updated_at: new Date().toISOString() })
    if (error) { setSyncMsg('Error: ' + error.message); return }
    ownerRef.current = em
    setActiveEmail(em)
    setPendingEmail(null)
    setSyncMsg('Created preferences for ' + em + ' (' + keywords.length + ' keywords)')
  }

  // Step 2b: user cancels.
  const cancelCreate = () => {
    setPendingEmail(null)
    setSyncMsg('Cancelled')
  }

  const highlightTerms = useMemo(
    () => (activeKw ? [activeKw] : keywords),
    [activeKw, keywords]
  )

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const goPage = (p) => {
    setPage(p)
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const downloadCsv = async () => {
    setDownloading(true)
    try {
      const pageSize = 1000
      let from = 0
      let all = []
      while (true) {
        const { data, error } = await buildQuery('*', {})
          .order('published_at', { ascending: false, nullsFirst: false })
          .range(from, from + pageSize - 1)
        if (error) { setSyncMsg('Download failed: ' + error.message); break }
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < pageSize) break
        from += pageSize
      }
      if (!all.length) { setSyncMsg('Nothing to download for these filters'); setDownloading(false); return }

      const cols = [
        ['portal', 'Portal'],
        ['organisation_name', 'Organisation'],
        ['title', 'Title'],
        ['reference_no', 'Reference No'],
        ['tender_id', 'Tender ID'],
        ['epublished_date', 'Published'],
        ['closing_date', 'Closing'],
        ['opening_date', 'Opening'],
        ['organisation_chain', 'Organisation Chain'],
        ['detail_link', 'Detail Link'],
      ]

      const esc = (v) => {
        const s = (v ?? '').toString().replace(/"/g, '""')
        return `"${s}"`
      }
      const header = cols.map(c => esc(c[1])).join(',')
      const lines = all.map(row => cols.map(c => esc(row[c[0]])).join(','))
      const csv = '\uFEFF' + [header, ...lines].join('\r\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `tenders_${stamp}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSyncMsg('Downloaded ' + all.length + ' tenders')
    } catch (e) {
      setSyncMsg('Download failed: ' + e.message)
    }
    setDownloading(false)
  }

  return (
    <>
     <header>
  <div className="head-in">
    <div className="brand">
      <h1>Tender tracker</h1>
      <span className="sync">
        {lastSync
          ? 'Tenders last updated on ' + new Date(lastSync).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Loading…'}
      </span>
    </div>
    <button className="manual" onClick={() => setManualOpen(true)}>
  {/* <Logo size={40} /> */}
  <p>Instructions</p>
</button>
  </div>
</header>

      <div className="wrap">
        <main>
        <div className="stats">
            <div className="stat">
              <div className="k">Portals</div>
              <div className="v">{portals.length}</div>
            </div>
            <div className="stat">
              <div className="k">Organisations</div>
              <div className="v">{orgCount.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat">
              <div className="k">Matching</div>
              <div className="v">{total.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat">
              <div className="k">Page</div>
              <div className="v">{page + 1}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / {pageCount}</span></div>
            </div>
          </div>

          <div className="bar">
            <div className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search title, organisation or tender ID"
              />
            </div>
            <button
              className={'btn' + (last7 ? ' on' : '')}
              onClick={() => { setLast7(!last7); setPage(0) }}
            >Published in last 7 days</button>

<button
              className={'btn' + (closing7 ? ' on' : '')}
              onClick={() => { setClosing7(!closing7); setPage(0) }}
            >Closing in 7 days</button>

            
            <button
              className={'btn' + (watchOnly ? ' on' : '')}
              onClick={() => { setWatchOnly(!watchOnly); setActiveKw(null); setPage(0) }}
            >Watchlist only</button>
            <button
              className="btn"
              onClick={downloadCsv}
              disabled={downloading}
            >
              {downloading ? 'Preparing…' : 'Download'}
            </button>
          </div>

          <div className="listhead" ref={listTop}>
            <span>
              {loading ? 'Loading…' : `Showing ${rows.length} of ${total.toLocaleString('en-IN')}`}
            </span>
            <span>Newest first</span>
          </div>

          {error && <div className="empty">Couldn't load tenders. {error}</div>}

          {!error && !loading && rows.length === 0 && (
            <div className="empty">No tenders match these filters. Try clearing the search or watchlist.</div>
          )}

          <div id="rows">
            {rows.map(d => {
              const blob = ((d.title || '') + ' ' + (d.organisation_name || '')).toLowerCase()
              const hits = keywords.filter(k => blob.includes(k.toLowerCase()))
              return (
                <article key={d.id} className={'row' + (d.attention === 'new' ? ' isnew' : '')}>
                  <div>
                    <div className="tags">
                      {d.attention === 'new' && <span className="tag new">new</span>}
                      <span className="tag">{d.portal}</span>
                      {hits.map(k => <span key={k} className="tag kw">{k}</span>)}
                    </div>
                    <p className="title">
                      <Highlight text={d.title} terms={highlightTerms} />
                    </p>
                    <p className="meta">
                      <b>{d.organisation_name}</b>
                      {/* {d.tender_id && <> &nbsp;·&nbsp; <span className="mono">{d.tender_id}</span></>} */}
                    </p>
                  </div>
                  <div className="right">
                    <span className="lbl">Published</span>
                    <span>{d.epublished_date || '—'}</span>
                    <span className="lbl" style={{ marginTop: 4 }}>Closes</span>
                    <span className="close">{d.closing_date || '—'}</span>
                    {d.detail_link && (
                      <a
                        className="open"
                        href={d.detail_link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => openTender(e, d.detail_link)}
                      >
                        Open tender →
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="pager">
            <span>Page {page + 1} of {pageCount}</span>
            <span>
              <button className="btn" disabled={page === 0} onClick={() => goPage(page - 1)}>Previous</button>
              {' '}
              <button className="btn" disabled={page + 1 >= pageCount} onClick={() => goPage(page + 1)}>Next</button>
            </span>
          </div>
        </main>

        <aside>
        <div className="panel">
            <h2 style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Portals</span>
              {selectedPortals.length > 0 && (
                <span
                  style={{ cursor: 'pointer', color: 'var(--ink-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}
                  onClick={() => { setSelectedPortals([]); setPage(0) }}
                >
                  clear
                </span>
              )}
            </h2>

            <div style={{ position: 'relative' }} ref={portalBoxRef}>
              <button
                type="button"
                onClick={() => setPortalMenuOpen(o => !o)}
                style={{
                  width: '100%', height: 38, padding: '0 12px', textAlign: 'left',
                  border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
                  background: '#fff', font: 'inherit', color: 'var(--ink)',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedPortals.length === 0
                    ? 'All portals'
                    : selectedPortals.length + ' selected'}
                </span>
                {/* <span style={{ color: 'var(--ink-3)', marginLeft: 8 }}>
                  {portalMenuOpen ? '▲' : '▼'}
                </span> */}
                <svg
  width="14" height="14" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  style={{
    marginLeft: 8,
    color: 'var(--ink-3)',
    flexShrink: 0,
    transform: portalMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform .15s ease'
  }}
>
  <path d="M6 9l6 6 6-6" />
</svg>
              </button>

              {portalMenuOpen && (
                <div style={{
                  position: 'absolute', top: 42, left: 0, right: 0, zIndex: 20,
                  background: '#fff', border: '1px solid var(--line-2)',
                  borderRadius: 'var(--radius)', boxShadow: '0 6px 20px rgba(0,0,0,.12)',
                  maxHeight: 280, overflowY: 'auto', padding: 4
                }}>
                  {portals.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--ink-3)', padding: '8px' }}>No portals yet.</p>
                  )}
                  {portals.map(([name, count]) => (
                    <label
                      key={name}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 8px', borderRadius: 'var(--radius)',
                        cursor: 'pointer', fontSize: 13
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--page)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPortals.includes(name)}
                        onChange={() => togglePortal(name)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1 }}>{name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {count.toLocaleString('en-IN')}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedPortals.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {selectedPortals.map(name => (
                  <span
                    key={name}
                    onClick={() => togglePortal(name)}
                    style={{
                      fontSize: 11, background: 'var(--match-bg)', color: 'var(--match)',
                      padding: '3px 8px', borderRadius: 100, cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    {name} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h2>Keyword watchlist <span className="mono">{keywords.length}</span></h2>
            <div className="kwadd">
              <input
                type="text"
                value={kwInput}
                onChange={e => setKwInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addKeyword() }}
                placeholder="Add a keyword"
              />
              <button onClick={addKeyword} aria-label="Add keyword">+</button>
            </div>
            <div className="kwlist" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {keywords.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>No keywords yet. Add one above.</p>
              )}
              {keywords.map(k => (
                <div
                  key={k}
                  className={'kw' + (activeKw === k ? ' active' : '')}
                  onClick={() => { setActiveKw(activeKw === k ? null : k); setWatchOnly(false); setPage(0) }}
                >
                  <span>{k}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="n">{kwCounts[k] ?? '·'}</span>
                    <span
                      className="x"
                      onClick={e => { e.stopPropagation(); removeKeyword(k) }}
                    >×</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Load / save preferences</h2>
            {activeEmail && (
              <p style={{ fontSize: 12, color: 'var(--match)', marginBottom: 8 }}>
                Active: {activeEmail}
              </p>
            )}
            <label style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
              Enter your email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') syncPreferences() }}
              placeholder="you@example.com"
              disabled={!!pendingEmail}
              style={{
                width: '100%', height: 34, padding: '0 10px', marginBottom: 8,
                border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
                font: 'inherit', fontSize: 13,
                background: pendingEmail ? 'var(--page)' : '#fff'
              }}
            />

            {!pendingEmail && (
              <button className="btn" style={{ width: '100%' }} onClick={syncPreferences}>
                Sync preferences
              </button>
            )}

            {pendingEmail && (
              <div style={{
                border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
                padding: 10, background: 'var(--page)'
              }}>
                <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>
                  No preferences found for:
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 10, wordBreak: 'break-all' }}>
                  {pendingEmail}
                </p>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
                  Create a new watchlist for this email?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn on" style={{ flex: 1 }} onClick={confirmCreate}>
                    Confirm
                  </button>
                  <button className="btn" style={{ flex: 1 }} onClick={cancelCreate}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {syncMsg && (
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>{syncMsg}</p>
            )}
          </div>
        </aside>
      </div>
      {manualOpen && (
  <div className="modal-overlay" onClick={() => setManualOpen(false)}>
    <div className="modal-card" onClick={e => e.stopPropagation()}>
      <div className="modal-topbar" />
      <button className="modal-close" onClick={() => setManualOpen(false)} aria-label="Close">×</button>
      <div className="modal-head">
        {/* <Logo size={36} /> */}
        <h4>Instructions</h4>
      </div>
      <div className="modal-body">
        <p>This web provides access to current tender listings from 2 Central portals, 22 States and 9 Union Territories across India.</p>
        <p>Currently, tenders are NOT available for the following states:</p>
        <ul>
          <li>Andhra Pradesh</li>
          <li>Bihar</li>
          <li>Chhattisgarh</li>
          <li>Gujarat</li>
          <li>Karnataka</li>
          <li>Telangana</li>
        </ul>
        <p>You can add your keywords to search for tenders in specific categories. If you wish to save the keywords when you revisit, follow these steps:</p>
        <ol>
          <li>Enter your email address and save your keywords.</li>
          <li>The next time you visit the website, simply enter the same email address.</li>
          <li>Your previously saved keywords will be loaded automatically.</li>
        </ol>
        <div className= "modal-body" style={{ marginTop: '2rem', fontWeight: 'bold' }}>
        <i>For any questions or concerns, write to deep.thepedestals@gmail.com</i>
        </div>
      </div>
    </div>
  </div>
)}
    </>
  )
}