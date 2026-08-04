// import { useState, useRef, useEffect } from 'react'
// import { supabase, TABLE } from './supabase'

// // One turn in the conversation:
// //   { id, query, loading, error, blocked:{message,examples}|null, count:number|null }
// // This panel NO LONGER renders tender cards. On a successful search it pushes
// // the matched rows up to the parent via onResults(rows, query); the parent
// // (App.jsx) swaps its main list to show them.

// export default function AiSearch({ open, onClose, onResults }) {
//   const [query, setQuery] = useState('')
//   const [messages, setMessages] = useState([])
//   const [busy, setBusy] = useState(false)

//   const inputRef = useRef(null)
//   const bottomRef = useRef(null)

//   // focus the input whenever the panel opens
//   useEffect(() => {
//     if (open) setTimeout(() => inputRef.current?.focus(), 50)
//   }, [open])

//   // Esc closes the panel
//   useEffect(() => {
//     if (!open) return
//     const onKey = (e) => { if (e.key === 'Escape') onClose() }
//     document.addEventListener('keydown', onKey)
//     return () => document.removeEventListener('keydown', onKey)
//   }, [open, onClose])

//   // auto-scroll to the newest turn
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
//   }, [messages])

//   const patchTurn = (id, patch) => {
//     setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)))
//   }

//   const runSearch = async (q) => {
//     const text = (q ?? query).trim()
//     if (!text || busy) return

//     const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7)
//     setMessages([{
//       id, query: text, loading: true, error: null, blocked: null, count: null,
//     }])
//     setQuery('')
//     setBusy(true)

//     try {
//       // 1) ask the Edge Function which tenders are relevant
//       const { data, error: fnErr } = await supabase.functions.invoke('ai-search', {
//         body: { query: text },
//       })
//       if (fnErr) throw new Error(fnErr.message || 'Search failed')

//       if (data?.blocked) {
//         patchTurn(id, { loading: false, blocked: { message: data.message, examples: data.examples || [] } })
//         setBusy(false)
//         return
//       }

//       const aiResults = Array.isArray(data?.results) ? data.results : []
//       if (aiResults.length === 0) {
//         patchTurn(id, { loading: false, count: 0 })
//         onResults?.([], text)          // clear the main list to show "no matches"
//         setBusy(false)
//         return
//       }

//       // keep the AI's order + its per-tender reason
//       const ids = aiResults.map(r => r.tender_id).filter(Boolean)
//       const reasonById = {}
//       aiResults.forEach(r => { if (r.tender_id) reasonById[r.tender_id] = r.reason })

//       // 2) re-fetch the FULL rows from Supabase (attention/'new', detail_link, etc.)
//       const { data: rows, error: dbErr } = await supabase
//         .from(TABLE)
//         .select('*')
//         .in('tender_id', ids)
//       if (dbErr) throw new Error(dbErr.message)

//       // 3) restore the AI's ordering and attach the reason
//       const byId = {}
//       ;(rows || []).forEach(row => { byId[row.tender_id] = row })
//       const ordered = ids
//         .map(tid => byId[tid] ? { ...byId[tid], _reason: reasonById[tid] } : null)
//         .filter(Boolean)

//       patchTurn(id, { loading: false, count: ordered.length })
//       onResults?.(ordered, text)       // <-- hand the rows to the parent list
//     } catch (e) {
//       patchTurn(id, { loading: false, error: e.message || String(e) })
//     }
//     setBusy(false)
//   }

//   const clearChat = () => {
//     setMessages([])
//     setQuery('')
//     inputRef.current?.focus()
//   }

//   if (!open) return null

//   return (
//     <div className="ai-pop" role="dialog" aria-label="AI Smart Search">
//       {/* header */}
//       <div className="ai-pop-head">
//         <div className="ai-pop-badge">
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
//           </svg>
//         </div>
//         <div className="ai-pop-title">
//           <strong>AI Smart Search</strong>
//           <span>Beta · results show in the list</span>
//         </div>
//         <button className="ai-pop-icon" onClick={clearChat} title="Clear chat" aria-label="Clear chat">
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
//           </svg>
//         </button>
//         <button className="ai-pop-icon" onClick={onClose} title="Close" aria-label="Close">
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
//             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M18 6 6 18M6 6l12 12" />
//           </svg>
//         </button>
//       </div>

//       {/* one-line helper */}
//       <div className="ai-pop-note">
//         Describe the tenders you're after in plain language. Matches appear in the main list.
//       </div>

//       {/* conversation thread */}
//       <div className="ai-pop-body">
//         {messages.length === 0 && (
//           <div className="ai-pop-hint">
//             <p>Hi there — what kind of tenders are you looking for?</p>
//             <div className="ai-pop-chips">
//               {['electric bus tenders in Maharashtra',
//                 'water treatment consultancy work',
//                 'solar power tenders closing soon'].map((ex, i) => (
//                 <button key={i} className="ai-pop-chip" onClick={() => runSearch(ex)}>{ex}</button>
//               ))}
//             </div>
//           </div>
//         )}

//         {messages.map(turn => (
//           <div className="ai-pop-turn" key={turn.id}>
//             <div className="ai-pop-ask"><span>{turn.query}</span></div>

//             {turn.loading && <div className="ai-pop-msg">Searching tenders…</div>}

//             {turn.error && <div className="ai-pop-msg err">Something went wrong. {turn.error}</div>}

//             {turn.blocked && (
//               <div className="ai-pop-msg">
//                 <p style={{ margin: 0 }}>{turn.blocked.message}</p>
//                 {turn.blocked.examples.length > 0 && (
//                   <div className="ai-pop-chips" style={{ marginTop: 8 }}>
//                     {turn.blocked.examples.map((ex, i) => (
//                       <button key={i} className="ai-pop-chip" onClick={() => runSearch(ex)}>{ex}</button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}

//             {turn.count === 0 && (
//               <div className="ai-pop-msg">
//                 No matching tenders found. Try describing the sector or work type differently.
//               </div>
//             )}

//             {turn.count > 0 && (
//               <div className="ai-pop-msg ok">
//                 Found {turn.count} tender{turn.count > 1 ? 's' : ''} — showing them in the list.
//               </div>
//             )}
//           </div>
//         ))}

//         <div ref={bottomRef} />
//       </div>

//       {/* composer */}
//       <div className="ai-pop-composer">
//         <input
//           ref={inputRef}
//           type="text"
//           value={query}
//           onChange={e => setQuery(e.target.value)}
//           onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
//           placeholder="Ask anything…"
//         />
//         <button className="ai-pop-send" onClick={() => runSearch()} disabled={busy} aria-label="Search">
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
//             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M5 12h14M13 6l6 6-6 6" />
//           </svg>
//         </button>
//       </div>
//       <p className="ai-pop-disclaimer">AI can make mistakes. Verify important tender details.</p>
//     </div>
//   )
// }




















import { useState, useRef, useEffect } from 'react'
import { supabase, TABLE } from './supabase'

export default function AiSearch({ open, onClose, onResults }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState(undefined)   // undefined = loading, null = signed out

  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  // track auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (open && session) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open, session])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const signInWithGoogle = async () => {
    sessionStorage.setItem('reopen-ai', '1')   // reopen this panel after redirect
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      sessionStorage.removeItem('reopen-ai')
      console.error(error.message)
    }
  }

  const patchTurn = (id, patch) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)))
  }

  const runSearch = async (q) => {
    const text = (q ?? query).trim()
    if (!text || busy) return

    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7)
    setMessages([{
      id, query: text, loading: true, error: null, blocked: null, count: null,
    }])
    setQuery('')
    setBusy(true)

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ai-search', {
        body: { query: text },
      })

      if (fnErr) {
        const status = fnErr.context?.status
        let msg = fnErr.message || 'Search failed'
        if (status === 429) {
          let code = null
          try { code = (await fnErr.context.json())?.code } catch { /* ignore */ }
          msg = code === 'DAILY_LIMIT'
            ? "You've used your 3 AI searches for today. Please come back tomorrow."
            : 'Too many searches — please wait a moment and try again.'
        } else if (status === 401) {
          msg = 'Please sign in again to use AI search.'
        } else if (status === 400) {
          msg = 'That query looks too long or invalid. Try a shorter description.'
        }
        patchTurn(id, { loading: false, error: msg })
        setBusy(false)
        return
      }

      if (data?.blocked) {
        patchTurn(id, { loading: false, blocked: { message: data.message, examples: data.examples || [] } })
        setBusy(false)
        return
      }

      const aiResults = Array.isArray(data?.results) ? data.results : []
      if (aiResults.length === 0) {
        patchTurn(id, { loading: false, count: 0 })
        onResults?.([], text)
        setBusy(false)
        return
      }

      const ids = aiResults.map(r => r.tender_id).filter(Boolean)
      const reasonById = {}
      aiResults.forEach(r => { if (r.tender_id) reasonById[r.tender_id] = r.reason })

      const { data: rows, error: dbErr } = await supabase
        .from(TABLE)
        .select('*')
        .in('tender_id', ids)
      if (dbErr) throw new Error(dbErr.message)

      const byId = {}
      ;(rows || []).forEach(row => { byId[row.tender_id] = row })
      const ordered = ids
        .map(tid => byId[tid] ? { ...byId[tid], _reason: reasonById[tid] } : null)
        .filter(Boolean)

      patchTurn(id, { loading: false, count: ordered.length })
      onResults?.(ordered, text)
    } catch (e) {
      patchTurn(id, { loading: false, error: e.message || String(e) })
    }
    setBusy(false)
  }

  const clearChat = () => {
    setMessages([])
    setQuery('')
    inputRef.current?.focus()
  }

  if (!open) return null

  const signedIn = !!session

  return (
    <div className="ai-pop" role="dialog" aria-label="AI Smart Search">
      <div className="ai-pop-head">
        <div className="ai-pop-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
        </div>
        <div className="ai-pop-title">
          <strong>AI Smart Search</strong>
          <span>Beta · results show in the list</span>
        </div>
        {signedIn && (
          <button className="ai-pop-icon" onClick={clearChat} title="Clear chat" aria-label="Clear chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
        )}
        <button className="ai-pop-icon" onClick={onClose} title="Close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* --- SIGN-IN GATE --- */}
      {session === undefined && (
        <div className="ai-pop-body">
          <div className="ai-pop-msg">Loading…</div>
        </div>
      )}

      {session === null && (
        <div className="ai-pop-body">
          <div className="ai-pop-hint" style={{ textAlign: 'center', padding: '24px 12px' }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Sign in to use AI Smart Search</p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
              Describe tenders in plain language and let AI find them for you.
              You get 3 AI searches per day.
            </p>
            <button
              onClick={signInWithGoogle}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: '#fff', color: '#3c4043',
                border: '1px solid #dadce0', borderRadius: 8,
                padding: '10px 16px', font: 'inherit', fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      )}

      {/* --- NORMAL UI (signed in) --- */}
      {signedIn && (
        <>
          <div className="ai-pop-note">
            Describe the tenders you're after in plain language. Matches appear in the main list.
          </div>

          <div className="ai-pop-body">
            {messages.length === 0 && (
              <div className="ai-pop-hint">
                <p>Hi there — what kind of tenders are you looking for?</p>
                <div className="ai-pop-chips">
                  {['electric bus tenders in Maharashtra',
                    'water treatment consultancy work',
                    'solar power tenders closing soon'].map((ex, i) => (
                    <button key={i} className="ai-pop-chip" onClick={() => runSearch(ex)}>{ex}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(turn => (
              <div className="ai-pop-turn" key={turn.id}>
                <div className="ai-pop-ask"><span>{turn.query}</span></div>
                {turn.loading && <div className="ai-pop-msg">Searching tenders…</div>}
                {turn.error && <div className="ai-pop-msg err">{turn.error}</div>}
                {turn.blocked && (
                  <div className="ai-pop-msg">
                    <p style={{ margin: 0 }}>{turn.blocked.message}</p>
                    {turn.blocked.examples.length > 0 && (
                      <div className="ai-pop-chips" style={{ marginTop: 8 }}>
                        {turn.blocked.examples.map((ex, i) => (
                          <button key={i} className="ai-pop-chip" onClick={() => runSearch(ex)}>{ex}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {turn.count === 0 && (
                  <div className="ai-pop-msg">
                    No matching tenders found. Try describing the sector or work type differently.
                  </div>
                )}
                {turn.count > 0 && (
                  <div className="ai-pop-msg ok">
                    Found {turn.count} tender{turn.count > 1 ? 's' : ''} — showing them in the list.
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="ai-pop-composer">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
              placeholder="Ask anything…"
            />
            <button className="ai-pop-send" onClick={() => runSearch()} disabled={busy} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <p className="ai-pop-disclaimer">AI can make mistakes. Verify important tender details.</p>
        </>
      )}
    </div>
  )
}