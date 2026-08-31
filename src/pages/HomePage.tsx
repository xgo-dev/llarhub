import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FocusEvent } from 'react'
import {
  Avatar,
  Button,
  Card,
  Kbd,
  SearchField,
} from '@heroui/react'
import {
  ChevronRight,
  Flame,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import AnimatedContent from '../components/react-bits/AnimatedContent/AnimatedContent'
import SoftAurora from '../components/react-bits/SoftAurora/SoftAurora/SoftAurora'
import HomeFooter from '../components/HomeFooter'
import HomeNavbar from '../components/HomeNavbar'
import PackageCard from '../components/PackageCard'
import { mockPackages, trendingPackageSlugs } from '../data/mockPackages'
import githubLogo from '../assets/github.ico'

const trendingPackages = trendingPackageSlugs.map((slug) => mockPackages.find((item) => item.slug === slug)!)

const suggestions = [
  'google/highway',
  'madler/zlib',
  'libuv/libuv',
  'grpc/grpc',
  'nlohmann/json',
]

const auroraSpeed = 0.36
const auroraColorSpeed = 0.5
const heroBackdropScale = 538 / 620
const searchBentoStyle = {
  '--home-search-bento-duration': `${1 / (auroraSpeed * 0.1 * auroraColorSpeed)}s`,
} as CSSProperties

export default function HomePage() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchBentoRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [compactViewport, setCompactViewport] = useState(() => window.matchMedia('(max-width: 800px)').matches)
  const radialViewportScale = compactViewport ? 0.6 : 1

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return trendingPackages
    return trendingPackages.filter((item) => item.slug.includes(normalized))
  }, [query])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, [contenteditable="true"]')) return
      event.preventDefault()
      searchInputRef.current?.focus()
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 800px)')
    const handleChange = (event: MediaQueryListEvent) => setCompactViewport(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const borderAnimation = searchBentoRef.current!.getAnimations().find(
      (animation) => animation instanceof CSSAnimation && animation.animationName === 'home-search-bento-wave-sync',
    )!
    borderAnimation.startTime = 0
  }, [reduceMotion])

  const handleSearchBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) setSearchOpen(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbfcff] text-[#101d3d]">
      <HomeNavbar />

      <section className="home-hero-section relative min-h-[620px] border-b border-[#e4e9f4] bg-[#f7f9ff] px-5 pt-[159px]" id="explore">
        <div className="home-hero-backdrop">
          <SoftAurora
            ariaLabel="Choose the foreground wave"
            bandSpread={1.16}
            brightness={0.98}
            color1="#91a7ef"
            color2="#b39be8"
            colorSpeed={auroraColorSpeed}
            depthShift={0.042 * heroBackdropScale * radialViewportScale}
            enableMouseInteraction={!reduceMotion}
            initialFrontLayer="lower"
            interactiveLayers
            layerOffset={1.9}
            lightMode
            lowerBandHeight={0.62}
            mouseInfluence={0.035}
            innerCenterYOffset={-0.13 * heroBackdropScale * radialViewportScale}
            noiseAmplitude={0.07 * heroBackdropScale * radialViewportScale}
            noiseFrequency={1.25}
            octaveDecay={0.34}
            outerRadius={1.48 * heroBackdropScale * radialViewportScale}
            radialCenterX={1 + 0.04 * radialViewportScale}
            radialCenterY={-0.46 * heroBackdropScale * radialViewportScale}
            radialMode
            scale={1.08 / (heroBackdropScale * radialViewportScale)}
            speed={reduceMotion ? 0 : auroraSpeed}
            innerRadius={1.22 * heroBackdropScale * radialViewportScale}
            surfaceColor1="#8f8bed"
            surfaceColor2="#6484f1"
          />
        </div>
        <div className="pointer-events-none relative z-10 mx-auto max-w-[1120px] text-center">
          <AnimatedContent animateOpacity distance={22} duration={0.65} ease="power3.out" threshold={0}>
            <h1 className="m-0 text-[clamp(38px,3.25vw,50px)] leading-[1.28] font-[700] text-[#0f1934]">
              Discover <span className="text-[#0874f8]">C/C++ libraries</span><br />
              and <span className="text-[#0874f8]">LLAR prebuilt packages.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[600px] text-[17px] leading-[1.75] text-[#6679a4]">
              LLARHub is the GitHub-native catalog for C and C++ libraries<br className="hidden sm:block" /> and LLAR prebuilt packages. Search, explore, and integrate—faster.
            </p>
          </AnimatedContent>

          <motion.div
            ref={searchBentoRef}
            layout
            animate={{ maxWidth: searchOpen ? 1160 : 1046, y: searchOpen ? -4 : 0 }}
            className="home-search-bento pointer-events-auto mx-auto mt-10 w-full text-left"
            data-engaged={searchOpen}
            onBlurCapture={handleSearchBlur}
            onFocusCapture={() => setSearchOpen(true)}
            style={searchBentoStyle}
            transition={{ type: 'spring', stiffness: 270, damping: 28 }}
          >
            <Card className="home-search-card min-h-[172px] gap-0 overflow-hidden p-5">
              <Card.Content className="gap-0">
                <motion.div layout transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                  <SearchField
                    aria-label="Search GitHub repositories"
                    fullWidth
                    name="package-search"
                    value={query}
                    variant="secondary"
                    onChange={setQuery}
                  >
                    <SearchField.Group className={`home-search-field-group ${searchOpen ? 'min-h-[76px]' : 'min-h-[70px]'}`}>
                      <SearchField.SearchIcon><img alt="" className="size-7" src={githubLogo} /></SearchField.SearchIcon>
                      <SearchField.Input ref={searchInputRef} placeholder="Search GitHub repositories" />
                      <SearchField.ClearButton />
                      <Kbd className="mr-3 hidden sm:inline-flex">/</Kbd>
                      <Button className="mr-3 hidden sm:inline-flex" size="sm" variant="outline"><SlidersHorizontal />Filters</Button>
                    </SearchField.Group>
                  </SearchField>
                </motion.div>

                <AnimatePresence initial={false}>
                  {searchOpen && (
                    <motion.div
                      key="search-results"
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0, y: -8 }}
                      initial={{ height: 0, opacity: 0, y: -8 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="grid gap-2 border-b border-[#e8edf6] py-4 sm:grid-cols-2">
                        {results.length > 0 ? results.map((item) => (
                          <Button
                            key={item.slug}
                            className="h-14 justify-start px-3 text-left"
                            fullWidth
                            variant="ghost"
                            onPress={() => item.slug === 'google/highway' && navigate('/packages/google/highway')}
                          >
                            <Avatar className="size-8 rounded-lg">
                              <Avatar.Image alt="" src={item.logo} />
                              <Avatar.Fallback>{item.slug.slice(0, 1).toUpperCase()}</Avatar.Fallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-[#152344]">{item.slug}</span>
                              <span className="block truncate text-xs font-normal text-[#6c7fa8]">{item.description}</span>
                            </span>
                            <ChevronRight className="ml-auto text-[#7b8cad]" />
                          </Button>
                        )) : <p className="col-span-full py-4 text-center text-sm text-[#7183a9]">No matching repositories</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <span className="mr-2 text-sm font-medium text-[#21345c]">Try</span>
                  {suggestions.map((suggestion) => (
                    <Button key={suggestion} size="sm" variant="secondary" onPress={() => setQuery(suggestion)}><Search />{suggestion}</Button>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-[1340px] px-6 pt-9 pb-20 2xl:px-0" id="packages">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-[20px] font-[680] text-[#122043]"><Flame className="size-5 fill-[#15264e]" />Trending packages</h2>
          <Button variant="ghost" onPress={() => navigate('/packages')}>View all<ChevronRight /></Button>
        </div>

        <AnimatedContent animateOpacity distance={26} duration={0.72} ease="power3.out" threshold={0.05}>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {trendingPackages.map((item) => (
              <PackageCard
                key={item.slug}
                item={item}
                onOpenOwner={(owner) => navigate(`/packages/${owner}`)}
                onOpenPackage={item.slug === 'google/highway' ? () => navigate('/packages/google/highway') : undefined}
              />
            ))}
          </div>
        </AnimatedContent>
      </section>

      <HomeFooter />
    </main>
  )
}
