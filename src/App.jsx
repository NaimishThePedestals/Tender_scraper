// import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
// import { supabase, TABLE } from './supabase'
// import AiSearch from './AiSearch'

// const PAGE_SIZE = 50



// // Every tender opens straight to its portal homepage. Keyed by the
// // detail-link hostname.
// const PORTAL_HOME = {
//   'uktenders.gov.in':                'https://uktenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'mahatenders.gov.in':              'https://mahatenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'assamtenders.gov.in':             'https://assamtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'tendersodisha.gov.in':            'https://tendersodisha.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'eprocure.goa.gov.in':             'https://eprocure.goa.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'mptenders.gov.in':                'https://mptenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'tenders.ladakh.gov.in':           'https://tenders.ladakh.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'eproc.punjab.gov.in':             'https://eproc.punjab.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'etenders.hry.nic.in':             'https://etenders.hry.nic.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'arunachaltenders.gov.in':         'https://arunachaltenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'hptenders.gov.in':                'https://hptenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'jharkhandtenders.gov.in':         'https://jharkhandtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'etenders.kerala.gov.in':          'https://etenders.kerala.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'manipurtenders.gov.in':           'https://manipurtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'meghalayatenders.gov.in':         'https://meghalayatenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'mizoramtenders.gov.in':           'https://mizoramtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'nagalandtenders.gov.in':          'https://nagalandtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'eproc.rajasthan.gov.in':          'https://eproc.rajasthan.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'sikkimtender.gov.in':             'https://sikkimtender.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'tntenders.gov.in':                'https://tntenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'tripuratenders.gov.in':           'https://tripuratenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'etender.up.nic.in':               'https://etender.up.nic.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'wbtenders.gov.in':                'https://wbtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'eprocure.andamannicobar.gov.in':  'https://eprocure.andamannicobar.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'etenders.chd.nic.in':             'https://etenders.chd.nic.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'dnhtenders.gov.in':               'https://dnhtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'ddtenders.gov.in':                'https://ddtenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'govtprocurement.delhi.gov.in':    'https://govtprocurement.delhi.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'jktenders.gov.in':                'https://jktenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'tendersutl.gov.in':               'https://tendersutl.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'pudutenders.gov.in':              'https://pudutenders.gov.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page',
//   'eprocure.gov.in':                 'https://eprocure.gov.in/eprocure/app?page=FrontEndTendersByOrganisation&service=page',
//   'etenders.gov.in':                 'https://etenders.gov.in/eprocure/app?page=FrontEndTendersByOrganisation&service=page',
//   'eprocurebhel.co.in':              'https://eprocurebhel.co.in/nicgep/app?page=FrontEndTendersByOrganisation&service=page'
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


// // function Logo() {
// //   return (
// //     <svg viewBox="0 0 624 624" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-label="Tender tracker logo">
// //       <path fill="#374151" d="M350.856873,61.751625 C358.602020,61.507965 364.427094,64.176849 369.496277,69.519218 C391.628754,92.844437 413.979950,115.961967 436.199493,139.204819 C442.116730,145.394547 444.930817,152.705826 444.466949,161.457275 C444.047607,169.368423 444.378387,177.319336 444.378387,186.302185 C436.100616,182.272339 429.256897,184.715042 422.617950,188.104446 C419.938354,184.406616 421.677643,180.859787 421.667664,177.508270 C421.645203,169.943069 421.764740,169.906631 414.373413,169.890594 C401.714447,169.863159 389.055206,169.931808 376.396393,169.877319 C354.860382,169.784622 341.952087,156.675751 341.983215,135.071991 C342.004578,120.240044 341.837921,105.406441 342.026215,90.577011 C342.079498,86.377541 340.583649,85.109009 336.515930,85.113823 C262.355591,85.201553 188.195084,85.156898 114.034698,85.222305 C103.242783,85.231827 96.201530,92.886971 96.191902,104.387100 C96.147110,157.882568 96.157097,211.378098 96.157448,264.873596 C96.157997,349.366516 96.168221,433.859436 96.169983,518.352356 C96.170288,532.595825 103.035774,539.583374 117.214455,539.593994 C156.544388,539.623413 195.874359,539.609741 235.204315,539.619385 C244.699280,539.621765 249.978043,543.498718 250.142395,550.556824 C250.314484,557.946411 244.943451,562.168396 235.249115,562.171204 C195.419113,562.182922 155.589127,562.186768 115.759125,562.167908 C90.672600,562.156067 72.977493,544.475647 72.971474,519.287292 C72.946594,415.129486 72.968369,310.971680 72.972061,206.813858 C72.973259,173.150055 72.916672,139.486115 72.991455,105.822479 C73.037704,85.001808 84.455635,69.073151 103.075417,63.402187 C107.435585,62.074223 111.868759,61.728584 116.398201,61.730286 C194.391403,61.759594 272.384613,61.751450 350.856873,61.751625 M365.167023,115.510056 C365.167236,122.174103 365.107910,128.838821 365.183624,135.502014 C365.267853,142.912460 368.765717,146.530243 376.256866,146.656067 C385.417358,146.809952 394.582672,146.739517 403.745056,146.665604 C405.469818,146.651703 407.391815,147.275848 409.332489,145.482681 C394.958618,130.572311 380.657684,115.737579 366.356720,100.902840 C365.960724,101.137192 365.564697,101.371544 365.168701,101.605896 C365.168701,105.909355 365.168701,110.212822 365.167023,115.510056 z"/>
// //       <path fill="#92400E" d="M454.583282,369.338043 C459.899200,372.511932 464.972992,375.383179 469.893280,378.497009 C474.948517,381.696259 476.742676,386.773773 475.098267,392.338196 C473.737793,396.941803 469.923065,399.411896 463.783173,399.413116 C403.327606,399.425415 342.872040,399.420441 282.416473,399.384125 C275.749390,399.380127 272.103546,396.836426 270.627136,391.514893 C269.199127,386.367798 271.461914,381.153748 276.755615,378.085144 C303.243622,362.730652 330.173492,348.085419 356.096283,331.832336 C368.109070,324.300537 377.462677,324.298615 389.361816,331.789093 C410.471832,345.077728 432.582031,356.777435 454.583282,369.338043 z"/>
// //       <path fill="#C4C9CF" d="M379.686218,259.999939 C379.688324,246.019791 379.643250,232.539429 379.716064,219.059692 C379.745331,213.643951 381.108185,212.637436 386.027008,214.759537 C399.922791,220.754471 413.726593,226.962418 427.581146,233.053421 C430.841583,234.486847 432.300354,236.769852 432.286041,240.445358 C432.172058,269.735199 432.207703,299.025604 432.137634,328.315704 C432.121246,335.159546 430.832550,335.880219 424.925385,332.551727 C411.187256,324.810791 397.509705,316.961365 383.722076,309.310059 C380.423462,307.479492 379.671204,304.817383 379.681427,301.439819 C379.722687,287.793335 379.691071,274.146576 379.686218,259.999939 z"/>
// //       <path fill="#2E3645" d="M454.917480,333.653259 C454.837463,337.099213 454.893097,340.097290 454.658813,343.072479 C454.403046,346.320099 452.624573,347.627991 449.554413,346.084686 C446.137390,344.367126 442.849792,342.393860 439.482025,340.576019 C436.282776,338.849091 436.165863,335.757263 436.137878,332.767853 C436.030457,321.281128 436.030090,309.793335 436.015747,298.305878 C435.992706,279.825836 436.131317,261.343964 435.888794,242.866974 C435.820587,237.667007 437.563354,234.633560 442.379181,232.452042 C457.231903,225.724045 471.905334,218.600128 486.647461,211.628067 C491.756317,209.211899 493.315460,210.091309 493.338196,215.737671 C493.415955,235.049652 493.401520,254.361984 493.426117,273.674194 C493.428040,275.172241 493.269531,276.701813 493.512299,278.162476 C494.337830,283.129883 492.208252,285.644318 487.549988,287.468597 C478.728485,290.923248 470.259552,295.269073 461.490021,298.869232 C456.381104,300.966644 454.485626,304.517914 454.606903,309.734619 C454.788666,317.553070 454.826385,325.374878 454.917480,333.653259 z"/>
// //       <path fill="#9CA3AF" d="M178.034515,253.339874 C167.731155,253.123642 157.936844,254.674484 148.105530,253.351318 C141.613129,252.477539 137.682312,248.742432 137.703751,242.826752 C137.725662,236.787659 142.058182,232.299652 148.363022,231.808197 C149.191528,231.743607 150.027527,231.763504 150.860046,231.763824 C200.489731,231.782867 250.119400,231.814423 299.749084,231.811722 C305.985016,231.811386 312.018433,232.559814 317.698761,235.375183 C320.592163,236.809250 322.516235,238.931915 323.151947,242.080948 C323.816589,245.373367 324.452698,248.637650 327.742310,250.528412 C325.809906,254.015076 322.875793,253.218445 320.422485,253.226486 C291.610901,253.320999 262.799042,253.336166 233.987259,253.353302 C215.501022,253.364288 197.014755,253.343826 178.034515,253.339874 z"/>
// //     </svg>
// //   );
// // }

// export default function App() {
//   const [rows, setRows] = useState([])
//   const [total, setTotal] = useState(0)
//   const [page, setPage] = useState(0)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   const [query, setQuery] = useState('')
//   const [debounced, setDebounced] = useState('')
//   const [selectedPortals, setSelectedPortals] = useState([])
//   const [portalMenuOpen, setPortalMenuOpen] = useState(false)
//   const [last7, setLast7] = useState(false)
//   const [closing7, setClosing7] = useState(false)
//   const [watchOnly, setWatchOnly] = useState(false)
//   const [activeKw, setActiveKw] = useState(null)

//   const [keywords, setKeywords] = useState([])   // always start blank
//   const [kwInput, setKwInput] = useState('')
//   const [kwCounts, setKwCounts] = useState({})

//   const [portals, setPortals] = useState([])
//   const [orgCount, setOrgCount] = useState(0)
//   const [lastSync, setLastSync] = useState(null)
//   const [liveBump, setLiveBump] = useState(0)

//   const [email, setEmail] = useState('')
//   const [activeEmail, setActiveEmail] = useState('')
//   const [syncMsg, setSyncMsg] = useState('')
//   const [downloading, setDownloading] = useState(false) 
//   const [pendingEmail, setPendingEmail] = useState(null)   // email awaiting create-confirmation
//   const [manualOpen, setManualOpen] = useState(false)
//   const [showFeedback, setShowFeedback] = useState(false)
//   const [feedbackName, setFeedbackName] = useState('')
//   const [feedbackWorking, setFeedbackWorking] = useState('')
//   const [feedbackMissing, setFeedbackMissing] = useState('')
//   const [aiOpen, setAiOpen] = useState(false)
//   const [aiRows, setAiRows] = useState(null)   // null = normal list; array = AI results active
//   const [aiQuery, setAiQuery] = useState('')

//   // ownerRef holds the email that the CURRENT keywords belong to.
//   // Auto-save only writes when ownerRef === activeEmail — stops one account's
//   // keywords ever being written into another account's row.
//   const ownerRef = useRef(null)
//   const suppressSaveRef = useRef(false)   // skip exactly one auto-save (a load)

//   const listTop = useRef(null)
//   const portalBoxRef = useRef(null)

//   // One click -> open the portal homepage directly (no session priming).
//   const openTender = (e, url) => {
//     e.preventDefault()
//     if (!url) return
//     let target = url
//     try {
//       const host = new URL(url).hostname
//       if (PORTAL_HOME[host]) target = PORTAL_HOME[host]   // known portal -> its home
//       else target = new URL(url).origin                   // unknown -> at least the origin
//     } catch (err) {
//       target = url
//     }
//     window.open(target, '_blank')
//   }

//   const togglePortal = (name) => {
//     setSelectedPortals(prev =>
//       prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
//     )
//     setPage(0)
//   }

//   useEffect(() => {
//     if (!portalMenuOpen) return
//     const onClick = (e) => {
//       if (portalBoxRef.current && !portalBoxRef.current.contains(e.target)) {
//         setPortalMenuOpen(false)
//       }
//     }
//     document.addEventListener('mousedown', onClick)
//     return () => document.removeEventListener('mousedown', onClick)
//   }, [portalMenuOpen])

//   useEffect(() => {
//     const t = setTimeout(() => { setDebounced(query); setPage(0) }, 300)
//     return () => clearTimeout(t)
//   }, [query])

//   const buildQuery = useCallback((select, opts) => {
//     let q = supabase.from(TABLE).select(select, opts)

//     if (selectedPortals.length) q = q.in('portal', selectedPortals)

//     if (last7) {
//       const cutoff = new Date()
//       cutoff.setDate(cutoff.getDate() - 7)
//       q = q.gte('published_at', cutoff.toISOString())
//     }

//     if (closing7) {
//       const now = new Date()
//       const in7 = new Date()
//       in7.setDate(in7.getDate() + 7)
//       q = q.gte('closing_at', now.toISOString())
//            .lte('closing_at', in7.toISOString())
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
//         .flatMap(k => [`title.ilike.%${k}%`])
//         .join(',')
//       q = q.or(ors)
//     }

//     return q
//   }, [selectedPortals, last7, debounced, activeKw, watchOnly, keywords,closing7])

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

//   // useEffect(() => {
//   //   supabase.from('portal_counts').select('*').then(({ data, error }) => {
//   //     if (error || !data) return
//   //     setPortals(data.map(r => [r.portal, r.n]))
//   //   })
//   // }, [liveBump])


//   useEffect(() => {
//     supabase.from('portal_counts').select('*').then(({ data, error }) => {
//       if (error || !data) return
//       const priority = ['Central1', 'Central2']
//       const sorted = data
//         .map(r => [r.portal, r.n])
//         .sort((a, b) => {
//           const aPri = priority.indexOf(a[0])
//           const bPri = priority.indexOf(b[0])
//           if (aPri !== -1 || bPri !== -1) {
//             if (aPri === -1) return 1
//             if (bPri === -1) return -1
//             return aPri - bPri
//           }
//           return a[0].localeCompare(b[0])
//         })
//       setPortals(sorted)
//     })
//   }, [liveBump])

//   // useEffect(() => {
//   //   supabase.from('org_count').select('n').single().then(({ data }) => {
//   //     if (data) setOrgCount(data.n)
//   //   })
//   // }, [liveBump])


//   useEffect(() => {
//     let cancelled = false
//     // pull organisation_name for the current filter, count distinct in JS
//     buildQuery('organisation_name', {})
//       .limit(10000)
//       .then(({ data, error }) => {
//         if (cancelled || error || !data) return
//         const uniq = new Set(data.map(r => r.organisation_name).filter(Boolean))
//         setOrgCount(uniq.size)
//       })
//     return () => { cancelled = true }
//   }, [buildQuery, liveBump])

//   useEffect(() => {
//     let cancelled = false
//     if (keywords.length === 0) { setKwCounts({}); return }
//     Promise.all(
//       keywords.map(k =>
//         supabase
//           .from(TABLE)
//           .select('id', { count: 'exact', head: true })
//           .or(`title.ilike.%${k}%`)
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


//   // count visits; show feedback dialog once past the threshold
//   useEffect(() => {
//     const THRESHOLD = 5
//     const count = parseInt(localStorage.getItem('visit-count') || '0', 10) + 1
//     localStorage.setItem('visit-count', String(count))
//     if (count > THRESHOLD && localStorage.getItem('feedback-shown') !== 'yes') {
//       setShowFeedback(true)
//       localStorage.setItem('feedback-shown', 'yes')
//     }
//   }, [])

//   const applyLoadedKeywords = (em, kw) => {
//     suppressSaveRef.current = true
//     ownerRef.current = em
//     setActiveEmail(em)
//     setKeywords(Array.isArray(kw) ? kw : [])
//   }

//   // auto-save keyword changes to the DB (debounced), only for the owning email
//   useEffect(() => {
//     if (!activeEmail) return
//     if (suppressSaveRef.current) { suppressSaveRef.current = false; return }
//     if (ownerRef.current !== activeEmail) return

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

//   // Step 1: user clicks Sync. Look up the email.
//   // If it exists -> load immediately. If not -> ask for confirmation.
//   const syncPreferences = async () => {
//     const em = email.trim().toLowerCase()
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setSyncMsg('Enter a valid email address'); return }

//     setPendingEmail(null)
//     setSyncMsg('Checking…')

//     const { data, error } = await supabase
//       .from('preferences').select('keywords').eq('email', em).maybeSingle()

//     if (error) { setSyncMsg('Error: ' + error.message); return }

//     if (data && Array.isArray(data.keywords)) {
//       applyLoadedKeywords(em, data.keywords)
//       setSyncMsg('Loaded ' + data.keywords.length + ' keywords for ' + em)
//     } else {
//       setPendingEmail(em)
//       setSyncMsg('')
//     }
//   }

//   // Step 2a: user confirms creating a new preferences record.
//   const confirmCreate = async () => {
//     const em = pendingEmail
//     if (!em) return
//     setSyncMsg('Creating…')
//     const { error } = await supabase
//       .from('preferences')
//       .upsert({ email: em, keywords, updated_at: new Date().toISOString() })
//     if (error) { setSyncMsg('Error: ' + error.message); return }
//     ownerRef.current = em
//     setActiveEmail(em)
//     setPendingEmail(null)
//     setSyncMsg('Created preferences for ' + em + ' (' + keywords.length + ' keywords)')
//   }

//   // Step 2b: user cancels.
//   const cancelCreate = () => {
//     setPendingEmail(null)
//     setSyncMsg('Cancelled')
//   }

//   const highlightTerms = useMemo(
//     () => (activeKw ? [activeKw] : keywords),
//     [activeKw, keywords]
//   )

//   const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

//   const aiActive = aiRows !== null
//   const displayRows = aiActive ? aiRows : rows
//   const clearAiResults = () => { setAiRows(null); setAiQuery('') }

//   const goPage = (p) => {
//     setPage(p)
//     listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
//   }

//   const downloadCsv = async () => {
//     setDownloading(true)
//     try {
//       let all = []

//       if (aiActive) {
//         // AI results are already the full rows shown in the list — export those.
//         all = aiRows || []
//       } else {
//         const pageSize = 1000
//         let from = 0
//         while (true) {
//           const { data, error } = await buildQuery('*', {})
//             .order('published_at', { ascending: false, nullsFirst: false })
//             .range(from, from + pageSize - 1)
//           if (error) { setSyncMsg('Download failed: ' + error.message); break }
//           if (!data || data.length === 0) break
//           all = all.concat(data)
//           if (data.length < pageSize) break
//           from += pageSize
//         }
//       }

//       if (!all.length) { setSyncMsg('Nothing to download for these filters'); setDownloading(false); return }



//       const cols = [
//         ['portal', 'Portal'],
//         ['organisation_name', 'Organisation'],
//         ['title', 'Title'],
//         ['reference_no', 'Reference No'],
//         ['tender_id', 'Tender ID'],
//         ['epublished_date', 'Published'],
//         ['closing_date', 'Closing'],
//         ['opening_date', 'Opening'],
//         ['organisation_chain', 'Organisation Chain'],
//         ['detail_link', 'Detail Link'],
//       ]

//       const esc = (v) => {
//         const s = (v ?? '').toString().replace(/"/g, '""')
//         return `"${s}"`
//       }
//       const header = cols.map(c => esc(c[1])).join(',')
//       const lines = all.map(row => cols.map(c => esc(row[c[0]])).join(','))
//       const csv = '\uFEFF' + [header, ...lines].join('\r\n')

//       const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
//       const url = URL.createObjectURL(blob)
//       const a = document.createElement('a')
//       const stamp = new Date().toISOString().slice(0, 10)
//       a.href = url
//       a.download = `tenders_${stamp}.csv`
//       document.body.appendChild(a)
//       a.click()
//       document.body.removeChild(a)
//       URL.revokeObjectURL(url)
//       setSyncMsg('Downloaded ' + all.length + ' tenders')
//     } catch (e) {
//       setSyncMsg('Download failed: ' + e.message)
//     }
//     setDownloading(false)
//   }


//   const submitFeedback = async () => {
//     const working = feedbackWorking.trim()
//     const missing = feedbackMissing.trim()
//     if (!working && !missing) { setShowFeedback(false); return }
//     await supabase.from('feedback').insert({
//       name: feedbackName.trim() || null,
//       working: working || null,
//       missing: missing || null,
//       visit_count: parseInt(localStorage.getItem('visit-count') || '0', 10),
//       created_at: new Date().toISOString()
//     })
//     setFeedbackName('')
//     setFeedbackWorking('')
//     setFeedbackMissing('')
//     setShowFeedback(false)
//   } 

//   return (
//     <>
//      <header>
//   <div className="head-in">
//     <div className="brand">
//       <h1>Tender tracker</h1>
//       <span className="sync">
//         {lastSync
//           ? 'Tenders last updated on ' + new Date(lastSync).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
//           : 'Loading…'}
//       </span>
//     </div>
//     <button className="manual" onClick={() => setManualOpen(true)}>
//   {/* <Logo size={40} /> */}
//   <p>Instructions</p>
// </button>
//   </div>
// </header>

//       <div className="wrap">
//         <main>
//         <div className="stats">
//             <div className="stat">
//               <div className="k">Portals</div>
//               <div className="v">{selectedPortals.length || portals.length}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Organisations</div>
//               <div className="v">{orgCount.toLocaleString('en-IN')}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Matching</div>
//               <div className="v">{(aiActive ? aiRows.length : total).toLocaleString('en-IN')}</div>
//             </div>
//             <div className="stat">
//               <div className="k">Page</div>
//               <div className="v">{aiActive ? 1 : page + 1}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / {aiActive ? 1 : pageCount}</span></div>
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
//             >Published in last 7 days</button>

// <button
//               className={'btn' + (closing7 ? ' on' : '')}
//               onClick={() => { setClosing7(!closing7); setPage(0) }}
//             >Closing in 7 days</button>

            
//             <button
//               className={'btn' + (watchOnly ? ' on' : '')}
//               onClick={() => { setWatchOnly(!watchOnly); setActiveKw(null); setPage(0) }}
//             >Watchlist only</button>
//             <button
//               className="btn"
//               onClick={downloadCsv}
//               disabled={downloading}
//             >
//               {downloading ? 'Preparing…' : 'Download'}
//             </button>
//           </div>

          

//           <div className="listhead" ref={listTop}>
//             {aiActive ? (
//               <span className="ai-active">
//                 ✨ AI results for "{aiQuery}" — {aiRows.length} found
//                 <button className="ai-clear" onClick={clearAiResults}>Clear</button>
//               </span>
//             ) : (
//               <span>
//                 {loading ? 'Loading…' : `Showing ${rows.length} of ${total.toLocaleString('en-IN')}`}
//               </span>
//             )}
//             <span>{aiActive ? 'Best match first' : 'Newest first'}</span>
//           </div>

//           {error && <div className="empty">Couldn't load tenders. {error}</div>}

//           {!error && !loading && displayRows.length === 0 && (
//             <div className="empty">
//               {aiActive
//                 ? 'No tenders matched your AI search. Try rephrasing in the chat.'
//                 : 'No tenders match these filters. Try clearing the search or watchlist.'}
//             </div>
//           )}

//           <div id="rows">
//             {displayRows.map(d => {
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
//                     {d._reason && <p className="ai-reason">{d._reason}</p>}
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

//           {!aiActive && (
//             <div className="pager">
//               <span>Page {page + 1} of {pageCount}</span>
//               <span>
//                 <button className="btn" disabled={page === 0} onClick={() => goPage(page - 1)}>Previous</button>
//                 {' '}
//                 <button className="btn" disabled={page + 1 >= pageCount} onClick={() => goPage(page + 1)}>Next</button>
//               </span>
//             </div>
//           )}
//         </main>

//         <aside>
//         <div className="panel">
//             <h2 style={{ display: 'flex', justifyContent: 'space-between' }}>
//               <span>Portals</span>
//               {selectedPortals.length > 0 && (
//                 <span
//                   style={{ cursor: 'pointer', color: 'var(--ink-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}
//                   onClick={() => { setSelectedPortals([]); setPage(0) }}
//                 >
//                   clear
//                 </span>
//               )}
//             </h2>

//             <div style={{ position: 'relative' }} ref={portalBoxRef}>
//               <button
//                 type="button"
//                 onClick={() => setPortalMenuOpen(o => !o)}
//                 style={{
//                   width: '100%', height: 38, padding: '0 12px', textAlign: 'left',
//                   border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
//                   background: '#fff', font: 'inherit', color: 'var(--ink)',
//                   cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
//                   alignItems: 'center'
//                 }}
//               >
//                 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                   {selectedPortals.length === 0
//                     ? 'All portals'
//                     : selectedPortals.length + ' selected'}
//                 </span>
//                 {/* <span style={{ color: 'var(--ink-3)', marginLeft: 8 }}>
//                   {portalMenuOpen ? '▲' : '▼'}
//                 </span> */}
//                 <svg
//   width="14" height="14" viewBox="0 0 24 24" fill="none"
//   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
//   style={{
//     marginLeft: 8,
//     color: 'var(--ink-3)',
//     flexShrink: 0,
//     transform: portalMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
//     transition: 'transform .15s ease'
//   }}
// >
//   <path d="M6 9l6 6 6-6" />
// </svg>
//               </button>

//               {portalMenuOpen && (
//                 <div style={{
//                   position: 'absolute', top: 42, left: 0, right: 0, zIndex: 20,
//                   background: '#fff', border: '1px solid var(--line-2)',
//                   borderRadius: 'var(--radius)', boxShadow: '0 6px 20px rgba(0,0,0,.12)',
//                   maxHeight: 280, overflowY: 'auto', padding: 4
//                 }}>
//                   {portals.length === 0 && (
//                     <p style={{ fontSize: 12, color: 'var(--ink-3)', padding: '8px' }}>No portals yet.</p>
//                   )}
//                   {portals.map(([name, count]) => (
//                     <label
//                       key={name}
//                       style={{
//                         display: 'flex', alignItems: 'center', gap: 8,
//                         padding: '7px 8px', borderRadius: 'var(--radius)',
//                         cursor: 'pointer', fontSize: 13
//                       }}
//                       onMouseEnter={e => e.currentTarget.style.background = 'var(--page)'}
//                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={selectedPortals.includes(name)}
//                         onChange={() => togglePortal(name)}
//                         style={{ cursor: 'pointer' }}
//                       />
//                       <span style={{ flex: 1 }}>{name}</span>
//                       <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
//                         {count.toLocaleString('en-IN')}
//                       </span>
//                     </label>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {selectedPortals.length > 0 && (
//               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
//                 {selectedPortals.map(name => (
//                   <span
//                     key={name}
//                     onClick={() => togglePortal(name)}
//                     style={{
//                       fontSize: 11, background: 'var(--match-bg)', color: 'var(--match)',
//                       padding: '3px 8px', borderRadius: 100, cursor: 'pointer',
//                       fontWeight: 500
//                     }}
//                   >
//                     {name} ×
//                   </span>
//                 ))}
//               </div>
//             )}
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
//             <div className="kwlist" style={{ maxHeight: 200, overflowY: 'auto' }}>
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
//             {activeEmail && (
//               <p style={{ fontSize: 12, color: 'var(--match)', marginBottom: 8 }}>
//                 Active: {activeEmail}
//               </p>
//             )}
//             <label style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
//               Enter your email
//             </label>
//             <input
//               type="email"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               onKeyDown={e => { if (e.key === 'Enter') syncPreferences() }}
//               placeholder="you@example.com"
//               disabled={!!pendingEmail}
//               style={{
//                 width: '100%', height: 34, padding: '0 10px', marginBottom: 8,
//                 border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
//                 font: 'inherit', fontSize: 13,
//                 background: pendingEmail ? 'var(--page)' : '#fff'
//               }}
//             />

//             {!pendingEmail && (
//               <button className="btn" style={{ width: '100%' }} onClick={syncPreferences}>
//                 Sync preferences
//               </button>
//             )}

//             {pendingEmail && (
//               <div style={{
//                 border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
//                 padding: 10, background: 'var(--page)'
//               }}>
//                 <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>
//                   No preferences found for:
//                 </p>
//                 <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 10, wordBreak: 'break-all' }}>
//                   {pendingEmail}
//                 </p>
//                 <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
//                   Create a new watchlist for this email?
//                 </p>
//                 <div style={{ display: 'flex', gap: 8 }}>
//                   <button className="btn on" style={{ flex: 1 }} onClick={confirmCreate}>
//                     Confirm
//                   </button>
//                   <button className="btn" style={{ flex: 1 }} onClick={cancelCreate}>
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             )}

//             {syncMsg && (
//               <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>{syncMsg}</p>
//             )}
//           </div>

//           <div className="panel">
//             <button
//               className="btn"
//               style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
//               onClick={() => setShowFeedback(true)}
//             >
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//               </svg>
//               Share your feedback
//             </button>
//           </div>
//         </aside>
//       </div>
//       {manualOpen && (
//   <div className="modal-overlay" onClick={() => setManualOpen(false)}>
//     <div className="modal-card" onClick={e => e.stopPropagation()}>
//       <div className="modal-topbar" />
//       <button className="modal-close" onClick={() => setManualOpen(false)} aria-label="Close">×</button>
//       <div className="modal-head">
//         {/* <Logo size={36} /> */}
//         <h4>Instructions</h4>
//       </div>
//       <div className="modal-body">
//         <p>This web provides access to current tender listings from 2 Central portals, 22 States and 9 Union Territories across India.</p>
//         <p>Currently, tenders are NOT available for the following states:</p>
//         <ul>
//           <li>Andhra Pradesh</li>
//           <li>Bihar</li>
//           <li>Chhattisgarh</li>
//           <li>Gujarat</li>
//           <li>Karnataka</li>
//           <li>Telangana</li>
//         </ul>
//         <p>You can add your keywords to search for tenders in specific categories. If you wish to save the keywords when you revisit, follow these steps:</p>
//         <ol>
//           <li>Enter your email address and save your keywords.</li>
//           <li>The next time you visit the website, simply enter the same email address.</li>
//           <li>Your previously saved keywords will be loaded automatically.</li>
//         </ol>
//         <div className= "modal-body" style={{ marginTop: '2rem', fontWeight: 'bold' }}>
//         <i>For any questions or concerns, write to deep.thepedestals@gmail.com</i>
//         </div>
//       </div>
//     </div>
//   </div>
// )}

// {showFeedback && (
//         <div className="modal-overlay">
//           <div className="modal-card" onClick={e => e.stopPropagation()}>
//             <div className="modal-topbar" />
//             <button className="modal-close" onClick={() => setShowFeedback(false)} aria-label="Close">×</button>
//             <div className="modal-head">
//               <h4>Quick feedback</h4>
//             </div>
//             <div className="modal-body">
//               <p>You've used the tender tracker a few times — we'd love your thoughts.</p>

//               <input
//                 type="text"
//                 value={feedbackName}
//                 onChange={e => setFeedbackName(e.target.value)}
//                 placeholder="Your name"
//                 style={{
//                   width: '100%', height: 34, padding: '0 10px', marginTop: 8,
//                   border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
//                   font: 'inherit', fontSize: 13
//                 }}
//               />

//               <label style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', marginTop: 12, marginBottom: 4 }}>
//                 What's working well?
//               </label>
//               <textarea
//                 value={feedbackWorking}
//                 onChange={e => setFeedbackWorking(e.target.value)}
//                 placeholder="What you find useful…"
//                 rows={3}
//                 style={{
//                   width: '100%', padding: 10,
//                   border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
//                   font: 'inherit', fontSize: 13, resize: 'vertical'
//                 }}
//               />

//               <label style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', marginTop: 12, marginBottom: 4 }}>
//                 What's missing or could be better?
//               </label>
//               <textarea
//                 value={feedbackMissing}
//                 onChange={e => setFeedbackMissing(e.target.value)}
//                 placeholder="What you'd like added or changed…"
//                 rows={3}
//                 style={{
//                   width: '100%', padding: 10,
//                   border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
//                   font: 'inherit', fontSize: 13, resize: 'vertical'
//                 }}
//               />

//               <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
//                 <button className="btn" onClick={() => setShowFeedback(false)}>Maybe later</button>
//                 <button className="btn on" onClick={submitFeedback}>Send feedback</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Floating chat launcher — hidden while the panel is open */}
//       {!aiOpen && (
//         <button className="ai-fab" onClick={() => setAiOpen(true)} aria-label="Open AI Smart Search">
//           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
//             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//           </svg>
//           <span className="ai-fab-spark">✨</span>
//         </button>
//       )}

//       <AiSearch
//         open={aiOpen}
//         onClose={() => setAiOpen(false)}
//         onResults={(rows, q) => { setAiRows(rows); setAiQuery(q) }}
//       />
//     </>
//   )
// }

















































import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase, TABLE } from './supabase'
import AiSearch from './AiSearch'

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
  'eprocure.gov.in':                 'https://eprocure.gov.in/eprocure/app?page=FrontEndTendersByOrganisation&service=page',
  'etenders.gov.in':                 'https://etenders.gov.in/eprocure/app?page=FrontEndTendersByOrganisation&service=page',
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
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackWorking, setFeedbackWorking] = useState('')
  const [feedbackMissing, setFeedbackMissing] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [aiRows, setAiRows] = useState(null)   // null = normal list; array = AI results active
  const [aiQuery, setAiQuery] = useState('')

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

  // useEffect(() => {
  //   supabase.from('org_count').select('n').single().then(({ data }) => {
  //     if (data) setOrgCount(data.n)
  //   })
  // }, [liveBump])


  useEffect(() => {
    let cancelled = false
    // pull organisation_name for the current filter, count distinct in JS
    buildQuery('organisation_name', {})
      .limit(10000)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const uniq = new Set(data.map(r => r.organisation_name).filter(Boolean))
        setOrgCount(uniq.size)
      })
    return () => { cancelled = true }
  }, [buildQuery, liveBump])

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


  // count visits; show feedback dialog once past the threshold
  useEffect(() => {
    const THRESHOLD = 5
    const count = parseInt(localStorage.getItem('visit-count') || '0', 10) + 1
    localStorage.setItem('visit-count', String(count))
    if (count > THRESHOLD && localStorage.getItem('feedback-shown') !== 'yes') {
      setShowFeedback(true)
      localStorage.setItem('feedback-shown', 'yes')
    }
  }, [])

  // reopen AI panel after returning from Google sign-in
  useEffect(() => {
    if (sessionStorage.getItem('reopen-ai') === '1') {
      sessionStorage.removeItem('reopen-ai')
      setAiOpen(true)
    }
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

  const aiActive = aiRows !== null
  const displayRows = aiActive ? aiRows : rows
  const aiPortalCount = aiActive ? new Set(aiRows.map(r => r.portal).filter(Boolean)).size : 0
  const aiOrgCount = aiActive ? new Set(aiRows.map(r => r.organisation_name).filter(Boolean)).size : 0
  const clearAiResults = () => { setAiRows(null); setAiQuery('') }

  const goPage = (p) => {
    setPage(p)
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const downloadCsv = async () => {
    setDownloading(true)
    try {
      let all = []

      if (aiActive) {
        // AI results are already the full rows shown in the list — export those.
        all = aiRows || []
      } else {
        const pageSize = 1000
        let from = 0
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


  const submitFeedback = async () => {
    const working = feedbackWorking.trim()
    const missing = feedbackMissing.trim()
    if (!working && !missing) { setShowFeedback(false); return }
    await supabase.from('feedback').insert({
      name: feedbackName.trim() || null,
      working: working || null,
      missing: missing || null,
      visit_count: parseInt(localStorage.getItem('visit-count') || '0', 10),
      created_at: new Date().toISOString()
    })
    setFeedbackName('')
    setFeedbackWorking('')
    setFeedbackMissing('')
    setShowFeedback(false)
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
              <div className="v">{aiActive ? aiPortalCount : (selectedPortals.length || portals.length)}</div>
            </div>
            <div className="stat">
              <div className="k">Organisations</div>
              <div className="v">{(aiActive ? aiOrgCount : orgCount).toLocaleString('en-IN')}</div>
            </div>
            <div className="stat">
              <div className="k">Matching</div>
              <div className="v">{(aiActive ? aiRows.length : total).toLocaleString('en-IN')}</div>
            </div>
            <div className="stat">
              <div className="k">Page</div>
              <div className="v">{aiActive ? 1 : page + 1}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}> / {aiActive ? 1 : pageCount}</span></div>
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
            {aiActive ? (
              <span className="ai-active">
                ✨ AI results for "{aiQuery}" — {aiRows.length} found
                <button className="ai-clear" onClick={clearAiResults}>Clear</button>
              </span>
            ) : (
              <span>
                {loading ? 'Loading…' : `Showing ${rows.length} of ${total.toLocaleString('en-IN')}`}
              </span>
            )}
            <span>{aiActive ? 'Best match first' : 'Newest first'}</span>
          </div>

          {error && <div className="empty">Couldn't load tenders. {error}</div>}

          {!error && !loading && displayRows.length === 0 && (
            <div className="empty">
              {aiActive
                ? 'No tenders matched your AI search. Try rephrasing in the chat.'
                : 'No tenders match these filters. Try clearing the search or watchlist.'}
            </div>
          )}

          <div id="rows">
            {displayRows.map(d => {
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
                    {d._reason && <p className="ai-reason">{d._reason}</p>}
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

          {!aiActive && (
            <div className="pager">
              <span>Page {page + 1} of {pageCount}</span>
              <span>
                <button className="btn" disabled={page === 0} onClick={() => goPage(page - 1)}>Previous</button>
                {' '}
                <button className="btn" disabled={page + 1 >= pageCount} onClick={() => goPage(page + 1)}>Next</button>
              </span>
            </div>
          )}
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

          <div className="panel">
            <button
              className="btn"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => setShowFeedback(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Share your feedback
            </button>
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
        <p style={{ marginTop: '1.5rem', fontWeight: 'bold' }}>How to Use AI Smart Search</p>
  <p>To use AI Smart Search, sign in with your Google account.</p>
  <ul>
    <li>Each user receives 3 AI search requests per day.</li>
    <li>Your available requests reset automatically every day.</li>
    <li>AI Smart Search helps you find relevant tenders using natural language instead of relying only on exact keywords.</li>
  </ul>
  <div style={{ marginTop: '2rem', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>
  <i>For any questions or concerns, write to deep.thepedestals@gmail.com</i>
</div>
      </div>
    </div>
  </div>
)}

{showFeedback && (
        <div className="modal-overlay">
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-topbar" />
            <button className="modal-close" onClick={() => setShowFeedback(false)} aria-label="Close">×</button>
            <div className="modal-head">
              <h4>Quick feedback</h4>
            </div>
            <div className="modal-body">
              <p>You've used the tender tracker a few times — we'd love your thoughts.</p>

              <input
                type="text"
                value={feedbackName}
                onChange={e => setFeedbackName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: '100%', height: 34, padding: '0 10px', marginTop: 8,
                  border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
                  font: 'inherit', fontSize: 13
                }}
              />

              <label style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', marginTop: 12, marginBottom: 4 }}>
                What's working well?
              </label>
              <textarea
                value={feedbackWorking}
                onChange={e => setFeedbackWorking(e.target.value)}
                placeholder="What you find useful…"
                rows={3}
                style={{
                  width: '100%', padding: 10,
                  border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
                  font: 'inherit', fontSize: 13, resize: 'vertical'
                }}
              />

              <label style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', marginTop: 12, marginBottom: 4 }}>
                What's missing or could be better?
              </label>
              <textarea
                value={feedbackMissing}
                onChange={e => setFeedbackMissing(e.target.value)}
                placeholder="What you'd like added or changed…"
                rows={3}
                style={{
                  width: '100%', padding: 10,
                  border: '1px solid var(--line-2)', borderRadius: 'var(--radius)',
                  font: 'inherit', fontSize: 13, resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn" onClick={() => setShowFeedback(false)}>Maybe later</button>
                <button className="btn on" onClick={submitFeedback}>Send feedback</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating chat launcher — hidden while the panel is open */}
      {/* {!aiOpen && (
        <button className="ai-fab" onClick={() => setAiOpen(true)} aria-label="Open AI Smart Search">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="ai-fab-spark">✨</span>
        </button>
      )} */}

{!aiOpen && (
  <button className="ai-fab" onClick={() => setAiOpen(true)} aria-label="Open AI Smart Search">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
    <span className="ai-fab-label">✨ AI Smart Search</span>
  </button>
)}

      <AiSearch
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onResults={(rows, q) => { setAiRows(rows); setAiQuery(q) }}
      />
    </>
  )
}