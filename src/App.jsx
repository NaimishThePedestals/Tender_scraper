// import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
// import { supabase, TABLE } from './supabase'

// const PAGE_SIZE = 50
// const KW_STORE = 'tender-keywords'

// function loadKeywords() {
//   try {
//     const raw = localStorage.getItem(KW_STORE)
//     if (raw) return JSON.parse(raw)
//   } catch (e) { /* ignore */ }
//   return ['security', 'manpower', 'survey', 'consultancy']
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

//   const addKeyword = () => {
//     const v = kwInput.trim().toLowerCase()
//     if (v && !keywords.includes(v)) setKeywords([...keywords, v])
//     setKwInput('')
//   }

//   const removeKeyword = (k) => {
//     setKeywords(keywords.filter(x => x !== k))
//     if (activeKw === k) setActiveKw(null)
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
//         </aside>
//       </div>
//     </>
//   )
// }




























































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
  'uktenders.gov.in':                'https://uktenders.gov.in',
  'mahatenders.gov.in':              'https://mahatenders.gov.in',
  'assamtenders.gov.in':             'https://assamtenders.gov.in',
  'tendersodisha.gov.in':            'https://tendersodisha.gov.in',
  'eprocure.goa.gov.in':             'https://eprocure.goa.gov.in',
  'mptenders.gov.in':                'https://mptenders.gov.in',
  'tenders.ladakh.gov.in':           'https://tenders.ladakh.gov.in',
  'eproc.punjab.gov.in':             'https://eproc.punjab.gov.in',
  'etenders.hry.nic.in':             'https://etenders.hry.nic.in',
  'arunachaltenders.gov.in':         'https://arunachaltenders.gov.in',
  'hptenders.gov.in':                'https://hptenders.gov.in',
  'jharkhandtenders.gov.in':         'https://jharkhandtenders.gov.in',
  'etenders.kerala.gov.in':          'https://etenders.kerala.gov.in',
  'manipurtenders.gov.in':           'https://manipurtenders.gov.in',
  'meghalayatenders.gov.in':         'https://meghalayatenders.gov.in',
  'mizoramtenders.gov.in':           'https://mizoramtenders.gov.in',
  'nagalandtenders.gov.in':          'https://nagalandtenders.gov.in',
  'eproc.rajasthan.gov.in':          'https://eproc.rajasthan.gov.in',
  'sikkimtender.gov.in':             'https://sikkimtender.gov.in',
  'tntenders.gov.in':                'https://tntenders.gov.in',
  'tripuratenders.gov.in':           'https://tripuratenders.gov.in',
  'etender.up.nic.in':               'https://etender.up.nic.in',
  'wbtenders.gov.in':                'https://wbtenders.gov.in',
  'eprocure.andamannicobar.gov.in':  'https://eprocure.andamannicobar.gov.in',
  'etenders.chd.nic.in':             'https://etenders.chd.nic.in',
  'dnhtenders.gov.in':               'https://dnhtenders.gov.in',
  'ddtenders.gov.in':                'https://ddtenders.gov.in',
  'govtprocurement.delhi.gov.in':    'https://govtprocurement.delhi.gov.in',
  'jktenders.gov.in':                'https://jktenders.gov.in',
  'tendersutl.gov.in':               'https://tendersutl.gov.in',
  'pudutenders.gov.in':              'https://pudutenders.gov.in',
  'eprocure.gov.in':                 'https://eprocure.gov.in',
  'etenders.gov.in':                 'https://etenders.gov.in',
  'eprocurebhel.co.in':              'https://eprocurebhel.co.in'
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

export default function App() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [portal, setPortal] = useState('')
  const [last7, setLast7] = useState(false)
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
  const [pendingEmail, setPendingEmail] = useState(null)   // email awaiting create-confirmation

  // ownerRef holds the email that the CURRENT keywords belong to.
  // Auto-save only writes when ownerRef === activeEmail — stops one account's
  // keywords ever being written into another account's row.
  const ownerRef = useRef(null)
  const suppressSaveRef = useRef(false)   // skip exactly one auto-save (a load)

  const listTop = useRef(null)

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

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(query); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [query])

  const buildQuery = useCallback((select, opts) => {
    let q = supabase.from(TABLE).select(select, opts)

    if (portal) q = q.eq('portal', portal)

    if (last7) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      q = q.gte('published_at', cutoff.toISOString())
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
        .flatMap(k => [`title.ilike.%${k}%`, `organisation_name.ilike.%${k}%`])
        .join(',')
      q = q.or(ors)
    }

    return q
  }, [portal, last7, debounced, activeKw, watchOnly, keywords])

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

  useEffect(() => {
    supabase.from('portal_counts').select('*').then(({ data, error }) => {
      if (error || !data) return
      setPortals(data.map(r => [r.portal, r.n]))
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
          .or(`title.ilike.%${k}%,organisation_name.ilike.%${k}%`)
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

  return (
    <>
      <header>
        <div className="head-in">
          <div className="brand">
            <h1>Tender tracker</h1>
            <span className="sync">
              {lastSync
                ? 'Synced ' + new Date(lastSync).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                : 'Loading…'}
            </span>
          </div>
          {/* <span className="live"><span className="dot" /> Live</span> */}
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
            >Last 7 days</button>
            <button
              className={'btn' + (watchOnly ? ' on' : '')}
              onClick={() => { setWatchOnly(!watchOnly); setActiveKw(null); setPage(0) }}
            >Watchlist only</button>
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
            <h2>Portal</h2>
            <select
              value={portal}
              onChange={e => { setPortal(e.target.value); setPage(0) }}
              style={{ width: '100%' }}
            >
              <option value="">All portals</option>
              {portals.map(([name, count]) => (
                <option key={name} value={name}>{name} ({count.toLocaleString('en-IN')})</option>
              ))}
            </select>
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
            <div className="kwlist">
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
    </>
  )
}