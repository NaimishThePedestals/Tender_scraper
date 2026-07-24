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
//   const [lastSync, setLastSync] = useState(null)
//   const [liveBump, setLiveBump] = useState(0)

//   const listTop = useRef(null)

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
//     supabase.from(TABLE).select('portal').then(({ data }) => {
//       if (!data) return
//       const counts = {}
//       data.forEach(r => { counts[r.portal] = (counts[r.portal] || 0) + 1 })
//       setPortals(Object.entries(counts).sort((a, b) => b[1] - a[1]))
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
//           <span className="live"><span className="dot" /> Live</span>
//         </div>
//       </header>

//       <div className="wrap">
//         <main>
//           <div className="stats">
//             <div className="stat">
//               <div className="k">Matching</div>
//               <div className="v">{total.toLocaleString('en-IN')}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Watchlist terms</div>
//               <div className="v">{keywords.length}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Portals</div>
//               <div className="v">{portals.length}</div>
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
//                       {d.tender_id && <> &nbsp;·&nbsp; <span className="mono">{d.tender_id}</span></>}
//                     </p>
//                   </div>
//                   <div className="right">
//                     <span className="lbl">Published</span>
//                     <span>{d.epublished_date || '—'}</span>
//                     <span className="lbl" style={{ marginTop: 4 }}>Closes</span>
//                     <span className="close">{d.closing_date || '—'}</span>
//                     {d.detail_link && (
//                       <a className="open" href={d.detail_link} target="_blank" rel="noreferrer">
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

















import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase, TABLE } from './supabase'

const PAGE_SIZE = 50
const KW_STORE = 'tender-keywords'

function loadKeywords() {
  try {
    const raw = localStorage.getItem(KW_STORE)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return ['security', 'manpower', 'survey', 'consultancy']
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

  const [keywords, setKeywords] = useState(loadKeywords)
  const [kwInput, setKwInput] = useState('')
  const [kwCounts, setKwCounts] = useState({})

  const [portals, setPortals] = useState([])
  const [lastSync, setLastSync] = useState(null)
  const [liveBump, setLiveBump] = useState(0)

  const listTop = useRef(null)

  const openTender = (e, url) => {
    e.preventDefault()
    const w = window.open(url, '_blank')
    if (!w) return
    setTimeout(() => {
      try { w.location.href = url } catch (err) { /* tab closed or blocked */ }
    }, 1200)
  }

  useEffect(() => {
    localStorage.setItem(KW_STORE, JSON.stringify(keywords))
  }, [keywords])

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
    supabase.from(TABLE).select('portal').then(({ data }) => {
      if (!data) return
      const counts = {}
      data.forEach(r => { counts[r.portal] = (counts[r.portal] || 0) + 1 })
      setPortals(Object.entries(counts).sort((a, b) => b[1] - a[1]))
    })
  }, [liveBump])

  useEffect(() => {
    let cancelled = false
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

  const addKeyword = () => {
    const v = kwInput.trim().toLowerCase()
    if (v && !keywords.includes(v)) setKeywords([...keywords, v])
    setKwInput('')
  }

  const removeKeyword = (k) => {
    setKeywords(keywords.filter(x => x !== k))
    if (activeKw === k) setActiveKw(null)
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
          <span className="live"><span className="dot" /> Live</span>
        </div>
      </header>

      <div className="wrap">
        <main>
          <div className="stats">
            <div className="stat">
              <div className="k">Matching</div>
              <div className="v">{total.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat">
              <div className="k">Watchlist terms</div>
              <div className="v">{keywords.length}</div>
            </div>
            <div className="stat">
              <div className="k">Portals</div>
              <div className="v">{portals.length}</div>
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
                      {d.tender_id && <> &nbsp;·&nbsp; <span className="mono">{d.tender_id}</span></>}
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
        </aside>
      </div>
    </>
  )
}