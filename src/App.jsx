import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useProgress } from '@react-three/drei'
import SceneCanvas from './components/SceneCanvas'
import { NAV_ITEMS, RIG_DEFAULTS, RIG_POSES, SCROLL_SEGMENTS } from './config/scrollConfig'

gsap.registerPlugin(ScrollTrigger)

const drivers = [
  { index: '01', tag: 'THE LINE', name: 'Lando Norris', role: 'Race driver / 04', copy: 'Instinct, precision, and the nerve to leave a mark where the track runs out.' },
  { index: '02', tag: 'THE EDGE', name: 'Oscar Piastri', role: 'Race driver / 81', copy: 'Calm under pressure. Relentless by design. Every apex is an invitation.' },
  { index: '03', tag: 'THE TEAM', name: 'McLaren Racing', role: 'Papaya / 1963', copy: 'One colour. One pulse. A machine built to turn momentum into memory.' },
]

const specs = [
  { label: 'Maximum power', value: '845', unit: 'BHP', note: 'Hybrid V6 / 1.6 L' },
  { label: 'Top speed', value: '350', unit: 'KM/H', note: 'Track configuration' },
  { label: 'Chassis', value: 'MCL39', unit: 'CARBON', note: 'Monocoque / 2025' },
]

const roster = [
  { number: '04', name: 'Lando Norris', detail: 'Papaya / precision', accent: 'card-orange' },
  { number: '81', name: 'Oscar Piastri', detail: 'Papaya / composure', accent: 'card-cream' },
  { number: '01', name: 'The MCL39', detail: 'Papaya / velocity', accent: 'card-dark' },
]

function ErrorBoundary({ children, onError }) {
  const [hasError, setHasError] = useState(false)
  useEffect(() => {
    if (hasError) onError?.()
  }, [hasError, onError])
  if (hasError) return null
  return <ErrorCatcher onError={() => setHasError(true)}>{children}</ErrorCatcher>
}

class ErrorCatcher extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    this.props.onError?.(error)
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

function LoadingOverlay({ status }) {
  const { progress } = useProgress()
  const isVisible = status !== 'ready'
  return (
    <div className={`loading-screen ${isVisible ? 'is-visible' : 'is-hidden'}`} aria-live="polite">
      <div className="loading-screen__inner">
        <div className="loading-screen__mark">APEX<span>/</span>ARCHIVE</div>
        {status === 'error' ? (
          <p className="loading-screen__error">Model unavailable. The archive can still be explored.</p>
        ) : (
          <>
            <div className="loading-screen__bar"><span style={{ width: `${Math.min(progress, 100)}%` }} /></div>
            <div className="loading-screen__meta"><span>LOADING MCL39</span><span>{Math.round(progress)}%</span></div>
          </>
        )}
      </div>
    </div>
  )
}

function Eyebrow({ children }) {
  return <div className="eyebrow"><span className="eyebrow__line" />{children}</div>
}

function App() {
  const rig = useRef({ ...RIG_DEFAULTS })
  const lenisRef = useRef(null)
  const driverRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [navSolid, setNavSolid] = useState(false)

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: true,
      lerp: 0.085,
      overscroll: false,
    })
    lenisRef.current = lenis
    const raf = (time) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const onScroll = () => setNavSolid(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!driverRef.current) return undefined
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: driverRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      })
      timeline
        .to(rig.current, { ...RIG_POSES.hero, duration: 0.001 }, 0)
        .to(rig.current, { ...RIG_POSES.drivers, duration: SCROLL_SEGMENTS.drivers[1] - SCROLL_SEGMENTS.drivers[0] }, SCROLL_SEGMENTS.drivers[0])
        .to(rig.current, { ...RIG_POSES.specs, duration: SCROLL_SEGMENTS.specs[1] - SCROLL_SEGMENTS.specs[0] }, SCROLL_SEGMENTS.specs[0])
        .to(rig.current, { ...RIG_POSES.roster, duration: SCROLL_SEGMENTS.roster[1] - SCROLL_SEGMENTS.roster[0] }, SCROLL_SEGMENTS.roster[0])
        .to(rig.current, { ...RIG_POSES.cta, duration: SCROLL_SEGMENTS.cta[1] - SCROLL_SEGMENTS.cta[0] }, SCROLL_SEGMENTS.cta[0])

      gsap.fromTo('.hero-copy', { y: 0, autoAlpha: 1 }, {
        y: -90,
        autoAlpha: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
      })
      gsap.fromTo('.driver-row', { x: 55, autoAlpha: 0 }, {
        x: 0,
        autoAlpha: 1,
        stagger: 0.16,
        ease: 'none',
        scrollTrigger: { trigger: '#drivers', start: 'top 72%', end: 'top 22%', scrub: 1 },
      })
      gsap.fromTo('.spec-panel', { x: 70, autoAlpha: 0 }, {
        x: 0,
        autoAlpha: 1,
        ease: 'none',
        scrollTrigger: { trigger: '#specs', start: 'top 70%', end: 'top 25%', scrub: 1 },
      })
      gsap.fromTo('.roster-card', { y: 80, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        stagger: 0.13,
        ease: 'none',
        scrollTrigger: { trigger: '#roster', start: 'top 76%', end: 'top 25%', scrub: 1 },
      })
      gsap.fromTo('.cta-shell', { y: 45, autoAlpha: 0.25 }, {
        y: 0,
        autoAlpha: 1,
        ease: 'none',
        scrollTrigger: { trigger: '#cta', start: 'top 82%', end: 'top 35%', scrub: 1 },
      })
    }, driverRef)
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    requestAnimationFrame(refresh)
    return () => {
      window.removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [])

  useEffect(() => {
    if (status === 'ready') requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [status])

  const scrollTo = useCallback((target) => {
    const element = document.getElementById(target)
    if (element) lenisRef.current?.scrollTo(element, { offset: 0, duration: 1.35 })
  }, [])

  const sceneError = useCallback(() => setStatus('error'), [])
  const sceneReady = useCallback(() => setStatus('ready'), [])
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  return (
    <div className="app-shell">
      <header className={`site-nav ${navSolid ? 'site-nav--solid' : ''}`}>
        <button className="brand" onClick={() => scrollTo('hero')} aria-label="Back to archive top">
          <span className="brand__symbol">M</span>
          <span className="brand__name">APEX / ARCHIVE</span>
        </button>
        <nav className="site-nav__links" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => <button key={item.target} onClick={() => scrollTo(item.target)}>{item.label}</button>)}
        </nav>
        <div className="site-nav__status"><span className="status-dot" />MCL39 / 2025</div>
      </header>

      <div className="scene-layer" aria-hidden="true">
        <ErrorBoundary onError={sceneError}>
          <SceneCanvas rig={rig} onReady={sceneReady} onError={sceneError} />
        </ErrorBoundary>
      </div>

      <LoadingOverlay status={status} />

      <div ref={driverRef} className="scroll-driver">
        <main>
          <section id="hero" className="story-section story-section--hero">
            <div className="hero-copy">
              <Eyebrow>THE MCL39 / DIGITAL STUDY 01</Eyebrow>
              <h1>Built for<br /><span>the next</span> apex.</h1>
              <p className="hero-copy__lede">A moving archive of speed, control and the relentless pursuit of a cleaner line.</p>
              <button className="scroll-cue" onClick={() => scrollTo('drivers')}><span>SCROLL TO ENTER</span><i /></button>
            </div>
            <div className="hero-meta"><span>03—05</span><span>WOKING / GB</span></div>
            <div className="hero-index">01</div>
          </section>

          <section id="drivers" className="story-section story-section--drivers">
            <div className="section-shell drivers-shell">
              <div className="section-heading"><Eyebrow>02 / THE HUMAN INPUT</Eyebrow><h2>The car follows<br /><em>the nerve.</em></h2></div>
              <div className="driver-list">
                {drivers.map((driver) => (
                  <article className="driver-row" key={driver.index}>
                    <span className="driver-row__index">{driver.index}</span>
                    <div><span className="driver-row__tag">{driver.tag}</span><h3>{driver.name}</h3><p>{driver.copy}</p></div>
                    <span className="driver-row__role">{driver.role}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="specs" className="story-section story-section--specs">
            <div className="section-shell specs-shell">
              <div className="section-heading section-heading--compact"><Eyebrow>03 / THE MACHINE</Eyebrow><h2>Numbers with<br /><em>intent.</em></h2></div>
              <div className="spec-panel">
                <div className="spec-panel__top"><span>MCL39 / SPECIFICATION</span><span>01 — 03</span></div>
                {specs.map((spec) => <div className="spec-row" key={spec.label}><span className="spec-row__label">{spec.label}</span><strong>{spec.value}</strong><span className="spec-row__unit">{spec.unit}</span><span className="spec-row__note">{spec.note}</span></div>)}
                <div className="spec-panel__foot"><span>DATASET / RACING LINE</span><span className="accent-text">PAPAYA IN MOTION</span></div>
              </div>
            </div>
          </section>

          <section id="roster" className="story-section story-section--roster">
            <div className="section-shell roster-shell">
              <div className="roster-heading"><Eyebrow>04 / THE ROSTER</Eyebrow><h2>Three ways<br /><em>to commit.</em></h2><p>Every lap is a conversation between human instinct and engineered intent.</p></div>
              <div className="roster-grid">
                {roster.map((member, index) => <article className={`roster-card ${member.accent}`} key={member.number}><div className="roster-card__top"><span>ARCHIVE {String(index + 1).padStart(2, '0')}</span><span>↗</span></div><div className="roster-card__number">{member.number}</div><h3>{member.name}</h3><p>{member.detail}</p></article>)}
              </div>
            </div>
          </section>

          <section id="cta" className="story-section story-section--cta">
            <div className="cta-shell"><Eyebrow>05 / HOLD THE LINE</Eyebrow><h2>Keep your eyes<br />on the <em>apex.</em></h2><p>Continue the study. The next frame is already moving.</p><button className="cta-button" onClick={() => scrollTo('hero')}>REPLAY THE ARCHIVE <span>↗</span></button></div>
            <div className="cta-footer"><span>APEX / ARCHIVE</span><span>© {currentYear} / MCL39 STUDY</span><span>SCROLL 05—05</span></div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
