import type { Selection } from '@heroui/react'

import { useEffect, useState } from 'react'
import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  Disclosure,
  Link,
  ScrollShadow,
  Surface,
  Table,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@heroui/react'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  ExternalLink,
  FileText,
  Star,
  X,
} from 'lucide-react'
import { useReducedMotion } from 'motion/react'

import googleLogo from '../assets/google.png'
import HomeFooter from '../components/HomeFooter'
import HomeNavbar from '../components/HomeNavbar'
import Grainient from '../components/react-bits/Grainient/Grainient'
import SoftAurora from '../components/react-bits/SoftAurora/SoftAurora/SoftAurora'

const buildParameters = [
  ['HWY_ENABLE_TESTS', 'ON'],
  ['CMAKE_BUILD_TYPE', 'Release'],
  ['HWY_ENABLE_BENCHMARK', 'OFF'],
  ['CMAKE_POSITION_INDEPENDENT_CODE', 'ON'],
  ['BUILD_SHARED_LIBS', 'OFF'],
  ['CMAKE_CXX_STANDARD', '17'],
]

const supportedReleases = [
  { version: '1.0.0', status: 'Minimum' },
  { version: '1.0.1', status: 'Supported' },
  { version: '1.0.2', status: 'Supported' },
  { version: '1.0.3', status: 'Supported' },
  { version: '1.0.4', status: 'Supported' },
  { version: '1.0.5', status: 'Supported' },
  { version: '1.0.6', status: 'Supported' },
  { version: '1.0.7', status: 'Supported' },
  { version: '1.1.0', status: 'Supported' },
  { version: '1.2.0', status: 'Supported' },
  { version: '1.3.0', status: 'Supported' },
  { version: '1.4.0', status: 'Latest' },
]

const getVersionFamilyPrefix = (version: string) => {
  const separatorIndex = Math.max(
    version.lastIndexOf('.'),
    version.lastIndexOf('-'),
    version.lastIndexOf('_'),
    version.lastIndexOf('/'),
  )
  return separatorIndex === -1 ? null : version.slice(0, separatorIndex + 1)
}

const versionGroups: Array<{
  id: string
  label: string
  releases: typeof supportedReleases
  start: string
  end: string
}> = []

for (let index = 0; index < supportedReleases.length;) {
  const prefix = getVersionFamilyPrefix(supportedReleases[index].version)
  const releases = [supportedReleases[index]]
  let nextIndex = index + 1

  while (
    prefix !== null
    && nextIndex < supportedReleases.length
    && getVersionFamilyPrefix(supportedReleases[nextIndex].version) === prefix
  ) {
    releases.push(supportedReleases[nextIndex])
    nextIndex += 1
  }

  versionGroups.push({
    id: `range-${index}`,
    label: releases.length > 1 ? `${prefix}*` : releases[0].version,
    releases,
    start: releases[0].version,
    end: releases[releases.length - 1].version,
  })
  index = nextIndex
}

const modulePath = 'google/highway'

const operatingSystems = [
  { id: 'linux', label: 'Linux' },
  { id: 'darwin', label: 'macOS' },
  { id: 'windows', label: 'Windows' },
]

const architectures = [
  { id: 'amd64', label: 'AMD64' },
  { id: 'arm64', label: 'ARM64' },
]

const directDependencies: Array<{ path: string, version: string }> = []

const supportedRangeLabel = `${supportedReleases[0].version} — ${supportedReleases[supportedReleases.length - 1].version}`

function VersionRuler({
  activeRangeId,
  idPrefix,
  selectedVersion,
  onRangeChange,
  onVersionChange,
}: {
  activeRangeId: string | null
  idPrefix: string
  selectedVersion: string
  onRangeChange: (rangeId: string | null) => void
  onVersionChange: (version: string) => void
}) {
  const activeRange = activeRangeId === null ? null : versionGroups.find(({ id }) => id === activeRangeId)!
  const selectedVersionGroup = versionGroups.find(({ releases }) => releases.some(({ version }) => version === selectedVersion))!

  return (
    <>
      <div className="flex min-h-6 items-center justify-between gap-3">
        {activeRange === null ? (
          <p className="text-[11px] font-bold tracking-[.06em] text-[#7183a7] uppercase">Choose a version range</p>
        ) : (
          <Button className="-ml-2 h-6 min-w-0 gap-1 bg-transparent px-2 text-xs text-[#596782]" size="sm" variant="ghost" onPress={() => onRangeChange(null)}>
            <ChevronLeft className="size-3.5" />All ranges
          </Button>
        )}
        <span className="shrink-0 font-mono text-[11px] font-semibold text-[#263550]">
          {activeRange === null ? supportedRangeLabel : `${activeRange.start} — ${activeRange.end}`}
        </span>
      </div>

      <ScrollShadow className="mx-auto mt-2 w-full max-w-[560px] pb-2 [scrollbar-color:#b7c2d5_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#b7c2d5] [&::-webkit-scrollbar-track]:bg-transparent" orientation="horizontal" size={20}>
        {activeRange === null ? (
          <ToggleButtonGroup
            aria-label="Choose a supported version range"
            className="relative min-w-full justify-start"
            selectionMode="single"
            selectedKeys={[`${idPrefix}-${selectedVersionGroup.id}`]}
            style={{ width: `${versionGroups.length * 84}px` }}
          >
            {versionGroups.map((range) => (
              <ToggleButton
                key={range.id}
                aria-label={range.releases.length > 1 ? `Show versions ${range.start} through ${range.end}` : `Select version ${range.start}`}
                className="relative h-11 min-w-21 flex-1 rounded-none bg-transparent px-1 pt-6 pb-0 font-mono text-[10px] font-medium text-[#53617b] hover:bg-transparent data-[selected=true]:bg-transparent data-[selected=true]:text-[#0066cc]"
                id={`${idPrefix}-${range.id}`}
                variant="ghost"
                onPress={() => {
                  if (range.releases.length > 1) {
                    onRangeChange(range.id)
                  } else {
                    onVersionChange(range.start)
                  }
                }}
              >
                <span aria-hidden="true" className="absolute top-[9px] left-0 h-px w-full bg-[#cbd5e4]" />
                <span aria-hidden="true" className={`absolute top-[5px] left-1/2 size-[9px] -translate-x-1/2 rounded-full shadow-[0_0_0_1px_rgba(64,77,110,.18)] transition-[transform,background-color] ${selectedVersionGroup.id === range.id ? 'scale-125 bg-[#0874f8]' : 'bg-white'}`} />
                <span>{range.label}</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : (
          <ToggleButtonGroup
            aria-label={`Choose a version in ${activeRange.label}`}
            className="relative min-w-full justify-start"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={activeRange.releases.some(({ version }) => version === selectedVersion) ? [`${idPrefix}-${selectedVersion}`] : []}
            style={{ width: `${activeRange.releases.length * 88}px` }}
          >
            {activeRange.releases.map(({ version, status }) => (
              <ToggleButton
                key={version}
                aria-label={`${version}, ${status}`}
                className="relative h-11 min-w-22 flex-1 rounded-none bg-transparent px-2 pt-6 pb-0 font-mono text-[10px] font-medium text-[#53617b] hover:bg-transparent data-[selected=true]:bg-transparent data-[selected=true]:text-[#0066cc]"
                id={`${idPrefix}-${version}`}
                variant="ghost"
                onPress={() => onVersionChange(version)}
              >
                <span aria-hidden="true" className="absolute top-[9px] left-0 h-px w-full bg-[#cbd5e4]" />
                <span aria-hidden="true" className={`absolute top-[4px] left-1/2 size-[10px] -translate-x-1/2 rounded-full shadow-[0_0_0_1px_rgba(64,77,110,.18)] transition-[transform,background-color] ${selectedVersion === version ? 'scale-125 bg-[#0874f8]' : 'bg-white'}`} />
                <span>{version}</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </ScrollShadow>
      <p className="mt-3 text-xs text-[#7a7a7a]">Versions earlier than {supportedReleases[0].version} are not supported.</p>
    </>
  )
}

export default function PackagePage() {
  const reduceMotion = useReducedMotion()
  const [selectedVersion, setSelectedVersion] = useState(supportedReleases[supportedReleases.length - 1].version)
  const [activeRangeId, setActiveRangeId] = useState<string | null>(null)
  const [desktopVersionPickerOpen, setDesktopVersionPickerOpen] = useState(false)
  const [activeConfiguration, setActiveConfiguration] = useState('target')
  const [selectedBuildOptions, setSelectedBuildOptions] = useState<Selection>(new Set())
  const [selectedOS, setSelectedOS] = useState<string | null>(null)
  const [selectedArch, setSelectedArch] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'google/highway · LLARHub'
  }, [])

  const selectedBuildOptionKeys = selectedBuildOptions === 'all'
    ? new Set(buildParameters.map(([parameter]) => parameter))
    : selectedBuildOptions
  const installOptions = buildParameters
    .filter(([parameter]) => selectedBuildOptionKeys.has(parameter))
    .map(([parameter, value]) => `--options ${parameter}=${value}`)
    .join(' ')
  const targetArguments = [
    selectedOS === null ? '' : `--os ${selectedOS}`,
    selectedArch === null ? '' : `--arch ${selectedArch}`,
  ].filter(Boolean).join(' ')
  const commandArguments = [targetArguments, installOptions].filter(Boolean).join(' ')
  const installCommand = `llar install ${modulePath}@${selectedVersion}${commandArguments === '' ? '' : ` ${commandArguments}`}`
  const selectedBuildOptionCount = selectedBuildOptions === 'all' ? buildParameters.length : selectedBuildOptions.size
  const copyCommand = () => {
    void navigator.clipboard.writeText(installCommand).then(() => setCopied(true))
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbfcff] text-[#101d3d]">
      <HomeNavbar />

      <section className="relative border-b border-[#e2e8f3] bg-[#f7f9ff] pt-[82px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
          <SoftAurora
            ariaLabel="Package header ambient background"
            bandSpread={1.14}
            brightness={0.9}
            color1="#91a7ef"
            color2="#b39be8"
            colorSpeed={0.4}
            depthShift={0.032}
            enableMouseInteraction={false}
            initialFrontLayer="lower"
            interactiveLayers={false}
            layerOffset={1.8}
            lightMode
            lowerBandHeight={0.6}
            mouseInfluence={0}
            innerCenterYOffset={-0.12}
            noiseAmplitude={0.055}
            noiseFrequency={1.2}
            octaveDecay={0.34}
            outerRadius={1.48}
            radialCenterX={1.04}
            radialCenterY={-0.5}
            radialMode
            scale={1.1}
            speed={reduceMotion ? 0 : 0.2}
            innerRadius={1.22}
            surfaceColor1="#8f8bed"
            surfaceColor2="#6484f1"
          />
        </div>

        <div className="relative mx-auto w-full max-w-[1340px] px-6 2xl:px-0">
          <Breadcrumbs className="text-sm text-[#6b7da2]">
            <Breadcrumbs.Item href={`${import.meta.env.BASE_URL}#packages`}>Packages</Breadcrumbs.Item>
            <Breadcrumbs.Item href={`${import.meta.env.BASE_URL}packages/google`}>google</Breadcrumbs.Item>
            <Breadcrumbs.Item>highway</Breadcrumbs.Item>
          </Breadcrumbs>

          <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,.88fr)] lg:items-center">
            <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
              <Avatar className="size-[84px] shrink-0 rounded-[24px] border border-[#d9e3f2] bg-white shadow-[0_10px_28px_rgba(41,72,127,.08)]">
                <Avatar.Image alt="Google" loading="eager" src={googleLogo} />
                <Avatar.Fallback>G</Avatar.Fallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="text-[clamp(34px,4.1vw,56px)] leading-none font-bold tracking-[-.052em] text-[#111b35]">google/highway</h1>
                  <Link aria-label="Open google/highway on GitHub" className="shrink-0 text-[#0874f8]" href="https://github.com/google/highway" rel="noreferrer" target="_blank">
                    <ExternalLink className="size-5" />
                  </Link>
                </div>
                <p className="mt-4 max-w-[680px] text-base leading-7 text-[#58709b]">Performance-portable SIMD with runtime dispatch across modern CPU targets.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['C++', 'SIMD', 'Performance', 'Header-only'].map((topic) => <Chip key={topic} size="sm" variant="secondary">{topic}</Chip>)}
                </div>
              </div>
            </div>

            <Card className="min-w-0 w-full">
              <Card.Header className="flex-row items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="m-0 text-[11px] font-bold tracking-[.08em] text-muted uppercase">Install with LLAR</p>
                  <Card.Title className="mt-2 text-[22px] font-[680] tracking-[-.035em]">Selected release</Card.Title>
                </div>
                <Chip size="sm" variant="secondary"><span className="font-mono">@{selectedVersion}</span></Chip>
              </Card.Header>
              <Card.Content>
                <Surface className="flex min-h-[68px] items-center gap-3 rounded-xl px-4 text-foreground" variant="tertiary">
                  <span className="font-mono text-xs text-muted">$</span>
                  <code className="min-w-0 flex-1 overflow-x-auto py-1 font-mono text-xs whitespace-nowrap [scrollbar-width:none] sm:text-sm [&::-webkit-scrollbar]:hidden">{installCommand}</code>
                  <Tooltip delay={0}>
                    <Button isIconOnly aria-label="Copy install command" className="shrink-0" size="sm" variant="ghost" onPress={copyCommand}>{copied ? <Check /> : <Copy />}</Button>
                    <Tooltip.Content>{copied ? 'Copied' : 'Copy command'}</Tooltip.Content>
                  </Tooltip>
                </Surface>
              </Card.Content>
              <Card.Footer>
                <Card.Description className="leading-6"><span className="sm:hidden">Expand the version picker below to choose another version.</span><span className="hidden sm:inline">Hover the verified range below to choose another version.</span></Card.Description>
              </Card.Footer>
            </Card>
          </div>

          <div
            className="group/rail relative z-20 mb-6 hidden sm:block"
            onBlurCapture={(event) => {
              const nextTarget = event.relatedTarget as Node | null
              if (!nextTarget || !event.currentTarget.contains(nextTarget)) setDesktopVersionPickerOpen(false)
            }}
            onMouseLeave={() => setDesktopVersionPickerOpen(false)}
          >
            <div className="relative overflow-hidden rounded-[20px] border border-white/60 bg-[#f7f9ff]/70" style={{ clipPath: 'inset(0 round 20px)' }}>
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[20px] opacity-[.65] transition-opacity duration-300 group-hover/rail:opacity-100 motion-reduce:transition-none" style={{ clipPath: 'inset(0 round 20px)' }}>
              <Grainient
                blendAngle={-8}
                blendSoftness={0.08}
                centerX={0.04}
                centerY={0}
                color1="#ff9ffc"
                color2="#5227ff"
                color3="#b497cf"
                colorBalance={0}
                contrast={1.4}
                gamma={1}
                grainAmount={0.08}
                grainAnimated={false}
                grainScale={2}
                noiseScale={2}
                rotationAmount={500}
                saturation={1}
                timeSpeed={reduceMotion ? 0 : 0.065}
                warpAmplitude={50}
                warpFrequency={5}
                warpSpeed={0.7}
                warpStrength={1}
                zoom={0.9}
              />
              </div>
              <div aria-hidden="true" className="absolute inset-0 rounded-[20px] bg-[#f7f9ff]/20" />
              <dl className="relative grid rounded-[20px] sm:grid-cols-2 lg:grid-cols-4">
              <div
                aria-label="Choose an upstream version"
                className="group relative grid grid-cols-2 outline-none sm:col-span-2 focus-visible:ring-2 focus-visible:ring-[#0874f8]"
                data-picker-open={desktopVersionPickerOpen}
                role="group"
                tabIndex={0}
                onFocusCapture={() => setDesktopVersionPickerOpen(true)}
                onMouseEnter={() => setDesktopVersionPickerOpen(true)}
              >
                <div className="relative flex items-center justify-between gap-2 overflow-hidden border-b border-white px-3 py-5 sm:border-r lg:border-b-0 lg:px-5">
                  <span aria-hidden="true" className="absolute inset-0 bg-[rgba(247,249,255,.88)] backdrop-brightness-125 backdrop-contrast-85 backdrop-saturate-75 transition-[background-color,backdrop-filter] duration-300 motion-reduce:transition-none group-hover:bg-[rgba(255,159,252,.08)] group-hover:backdrop-brightness-100 group-hover:backdrop-contrast-100 group-hover:backdrop-saturate-125 group-data-[picker-open=true]:bg-[rgba(255,159,252,.08)] group-data-[picker-open=true]:backdrop-brightness-100 group-data-[picker-open=true]:backdrop-contrast-100 group-data-[picker-open=true]:backdrop-saturate-125" />
                  <dt className="relative text-sm tracking-[-.224px] text-[#7a7a7a] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white/85 group-data-[picker-open=true]:text-white/85">Supported from</dt>
                  <dd className="relative m-0 font-mono text-sm font-semibold tracking-[-.224px] text-[#0066cc] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white group-data-[picker-open=true]:text-white">{supportedReleases[0].version}</dd>
                </div>
                <div className="relative flex items-center justify-between gap-2 overflow-hidden border-b border-white px-3 py-5 lg:border-r lg:border-b-0 lg:px-5">
                  <span aria-hidden="true" className="absolute inset-0 bg-[rgba(247,249,255,.88)] backdrop-brightness-125 backdrop-contrast-85 backdrop-saturate-75 transition-[background-color,backdrop-filter] duration-300 motion-reduce:transition-none group-hover:bg-[rgba(82,39,255,.10)] group-hover:backdrop-brightness-100 group-hover:backdrop-contrast-100 group-hover:backdrop-hue-rotate-[-28deg] group-hover:backdrop-saturate-125 group-data-[picker-open=true]:bg-[rgba(82,39,255,.10)] group-data-[picker-open=true]:backdrop-brightness-100 group-data-[picker-open=true]:backdrop-contrast-100 group-data-[picker-open=true]:backdrop-hue-rotate-[-28deg] group-data-[picker-open=true]:backdrop-saturate-125" />
                  <dt className="relative text-sm tracking-[-.224px] text-[#7a7a7a] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white/85 group-data-[picker-open=true]:text-white/85">Latest verified</dt>
                  <dd className="relative m-0 inline-flex items-center gap-1.5 font-mono text-sm font-semibold tracking-[-.224px] text-[#1d1d1f] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white group-data-[picker-open=true]:text-white">
                    {supportedReleases[supportedReleases.length - 1].version}
                    <ChevronDown aria-hidden="true" className={`size-4 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180 motion-reduce:transition-none ${desktopVersionPickerOpen ? 'rotate-180' : ''}`} />
                  </dd>
                </div>
              </div>
              <div className="group relative flex items-center justify-between gap-2 overflow-hidden border-b border-white px-3 py-5 sm:border-r sm:border-b-0 lg:px-5" onMouseEnter={() => setDesktopVersionPickerOpen(false)}>
                <span aria-hidden="true" className="absolute inset-0 bg-[rgba(247,249,255,.88)] backdrop-brightness-125 backdrop-contrast-85 backdrop-saturate-75 transition-[background-color,backdrop-filter] duration-300 motion-reduce:transition-none group-hover:bg-[rgba(75,160,255,.10)] group-hover:backdrop-brightness-100 group-hover:backdrop-contrast-100 group-hover:backdrop-hue-rotate-[-65deg] group-hover:backdrop-saturate-125" />
                <dt className="relative text-sm tracking-[-.224px] text-[#7a7a7a] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white/85">Stars</dt>
                <dd className="relative m-0 inline-flex items-center gap-2 text-sm font-semibold tracking-[-.224px] text-[#1d1d1f] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white"><Star className="size-4" />5.8k</dd>
              </div>
              <div className="group relative flex items-center justify-between gap-2 overflow-hidden px-3 py-5 lg:px-5" onMouseEnter={() => setDesktopVersionPickerOpen(false)}>
                <span aria-hidden="true" className="absolute inset-0 bg-[rgba(247,249,255,.88)] backdrop-brightness-125 backdrop-contrast-85 backdrop-saturate-75 transition-[background-color,backdrop-filter] duration-300 motion-reduce:transition-none group-hover:bg-[rgba(180,151,207,.12)] group-hover:backdrop-brightness-100 group-hover:backdrop-contrast-100 group-hover:backdrop-hue-rotate-[28deg] group-hover:backdrop-saturate-125" />
                <dt className="relative text-sm tracking-[-.224px] text-[#7a7a7a] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white/85">License</dt>
                <dd className="relative m-0 inline-flex items-center gap-2 text-sm font-semibold tracking-[-.224px] text-[#1d1d1f] transition-colors duration-300 motion-reduce:transition-none group-hover:text-white"><FileText className="size-4" />Apache-2.0</dd>
              </div>
              </dl>
            </div>
            <div
              aria-hidden={!desktopVersionPickerOpen}
              className={`absolute top-full left-0 z-40 w-full rounded-b-[18px] border border-white bg-white/96 p-4 shadow-[0_18px_42px_rgba(43,69,118,.15)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none lg:w-1/2 ${desktopVersionPickerOpen ? 'pointer-events-auto visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'}`}
              onFocusCapture={() => setDesktopVersionPickerOpen(true)}
              onMouseEnter={() => setDesktopVersionPickerOpen(true)}
            >
              <VersionRuler
                activeRangeId={activeRangeId}
                idPrefix="desktop"
                selectedVersion={selectedVersion}
                onRangeChange={setActiveRangeId}
                onVersionChange={(version) => {
                  setSelectedVersion(version)
                  setCopied(false)
                }}
              />
            </div>
          </div>

          <Card className="relative z-20 mb-6 gap-0 overflow-hidden p-0 sm:hidden">
            <Card.Content className="gap-0">
              <Disclosure>
                <Disclosure.Heading>
                  <Button fullWidth className="h-auto justify-between rounded-none px-4 py-4" slot="trigger" variant="ghost">
                    <span className="flex min-w-0 flex-col items-start gap-1">
                      <span className="text-[11px] font-bold tracking-[.07em] text-muted uppercase">Versions</span>
                      <span className="font-mono text-xs text-muted">{supportedRangeLabel}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
                      @{selectedVersion}<Disclosure.Indicator />
                    </span>
                  </Button>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body className="border-t border-border px-4 py-4">
                    <VersionRuler
                      activeRangeId={activeRangeId}
                      idPrefix="mobile"
                      selectedVersion={selectedVersion}
                      onRangeChange={setActiveRangeId}
                      onVersionChange={(version) => {
                        setSelectedVersion(version)
                        setCopied(false)
                      }}
                    />
                  </Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
              <dl className="grid grid-cols-2 border-t border-border">
                <div className="flex items-center justify-center gap-3 border-r border-border px-3 py-3">
                  <dt className="text-xs text-muted">Stars</dt>
                  <dd className="m-0 inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap text-foreground"><Star className="size-3" />5.8k</dd>
                </div>
                <div className="flex items-center justify-center gap-3 px-3 py-3">
                  <dt className="text-xs text-muted">License</dt>
                  <dd className="m-0 inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap text-foreground"><FileText className="size-3" />Apache-2.0</dd>
                </div>
              </dl>
            </Card.Content>
          </Card>
        </div>
      </section>

      <div className="package-config mx-auto w-full max-w-[1340px] px-6 py-12 2xl:px-0">
        <Tabs
          className="package-config-tabs"
          orientation="vertical"
          selectedKey={activeConfiguration}
          variant="secondary"
          onSelectionChange={(key) => setActiveConfiguration(String(key))}
        >
          <Tabs.ListContainer className="package-config-tabs__list-container">
            <Tabs.List aria-label="Install configuration">
              <Tabs.Tab className="package-config-tab" id="target">
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="font-medium text-foreground">Build Target</span>
                  <span className="text-xs text-muted">{selectedOS ?? 'Any OS'} · {selectedArch ?? 'Any arch'}</span>
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab className="package-config-tab" id="cmake">
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="font-medium text-foreground">CMake</span>
                  <span className="text-xs text-muted">{selectedBuildOptionCount === 0 ? 'Defaults' : `${selectedBuildOptionCount} selected`}</span>
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab className="package-config-tab" id="dependencies">
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="font-medium text-foreground">Dependencies</span>
                  <span className="text-xs text-muted">{directDependencies.length === 0 ? 'None declared' : `${directDependencies.length} direct`}</span>
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel className="package-config-panel" id="target">
            <section>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="m-0 text-[11px] font-bold tracking-[.08em] text-muted uppercase">Target matrix</p>
                  <h2 className="mt-3 text-[28px] font-[680] tracking-[-.04em] text-foreground">Build Target</h2>
                  <p className="mt-3 max-w-[520px] text-sm leading-6 text-muted">Choose an OS and architecture for the install command.</p>
                </div>
                <Button
                  className="shrink-0 text-accent"
                  isDisabled={selectedOS === null && selectedArch === null}
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setSelectedOS(null)
                    setSelectedArch(null)
                    setCopied(false)
                  }}
                >
                  <X className="size-3.5" />Clear target
                </Button>
              </div>

              <div className="mt-8 border-y border-separator">
                <div className="grid gap-3 border-b border-separator py-5 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-center">
                  <span className="text-xs font-semibold tracking-[.06em] text-muted uppercase">OS</span>
                  <ToggleButtonGroup
                    fullWidth
                    aria-label="Operating system"
                    className="package-config-toggle"
                    selectedKeys={selectedOS === null ? [] : [selectedOS]}
                    selectionMode="single"
                    size="sm"
                    onSelectionChange={(keys) => {
                      const [value] = Array.from(keys)
                      setSelectedOS(value === undefined ? null : String(value))
                      setCopied(false)
                    }}
                  >
                    {operatingSystems.map(({ id, label }, index) => <ToggleButton key={id} className="font-mono text-xs" id={id}>{index > 0 && <ToggleButtonGroup.Separator />}{label}</ToggleButton>)}
                  </ToggleButtonGroup>
                </div>
                <div className="grid gap-3 py-5 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-center">
                  <span className="text-xs font-semibold tracking-[.06em] text-muted uppercase">Arch</span>
                  <ToggleButtonGroup
                    fullWidth
                    aria-label="Architecture"
                    className="package-config-toggle"
                    selectedKeys={selectedArch === null ? [] : [selectedArch]}
                    selectionMode="single"
                    size="sm"
                    onSelectionChange={(keys) => {
                      const [value] = Array.from(keys)
                      setSelectedArch(value === undefined ? null : String(value))
                      setCopied(false)
                    }}
                  >
                    {architectures.map(({ id, label }, index) => <ToggleButton key={id} className="font-mono text-xs" id={id}>{index > 0 && <ToggleButtonGroup.Separator />}{label}</ToggleButton>)}
                  </ToggleButtonGroup>
                </div>
              </div>
            </section>
          </Tabs.Panel>

          <Tabs.Panel className="package-config-panel" id="cmake">
            <section>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="m-0 text-[11px] font-bold tracking-[.08em] text-muted uppercase">Build-system parameters</p>
                  <h2 className="mt-3 text-[28px] font-[680] tracking-[-.04em] text-foreground">CMake defaults</h2>
                  <p className="mt-3 max-w-[520px] text-sm leading-6 text-muted">Select parameters to append them to the install command.</p>
                </div>
                <Button
                  className="shrink-0 text-accent"
                  isDisabled={selectedBuildOptionCount === 0}
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setSelectedBuildOptions(new Set())
                    setCopied(false)
                  }}
                >
                  <X className="size-3.5" />Clear selection
                </Button>
              </div>

              <Table className="package-config-table mt-8 !rounded-none border-0 bg-transparent p-0 shadow-none" variant="secondary">
                <Table.ScrollContainer className="max-h-[360px] overflow-y-auto [scrollbar-color:#b7c2d5_transparent] [&::-webkit-scrollbar]:size-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#b7c2d5] [&::-webkit-scrollbar-track]:bg-transparent">
                  <Table.Content
                    aria-label="Selectable build system parameters"
                    className="!rounded-none"
                    selectedKeys={selectedBuildOptions}
                    selectionBehavior="toggle"
                    selectionMode="multiple"
                    onSelectionChange={(selection) => {
                      setSelectedBuildOptions(selection)
                      setCopied(false)
                    }}
                  >
                    <Table.Header className="sticky top-0 z-10 bg-surface"><Table.Column className="bg-surface px-2" isRowHeader>Parameter</Table.Column><Table.Column className="bg-surface px-2 text-right">Default</Table.Column></Table.Header>
                    <Table.Body>
                      {buildParameters.map(([parameter, value]) => {
                        const isSelected = selectedBuildOptionKeys.has(parameter)
                        return (
                          <Table.Row key={parameter} className="cursor-pointer border-t border-separator" id={parameter} textValue={`${parameter} ${value}`}>
                            <Table.Cell className={`!rounded-none px-2 py-4 transition-colors ${isSelected ? 'bg-accent-soft' : 'bg-transparent'}`}>
                              <span className="inline-flex items-center gap-2">
                                <Check aria-hidden="true" className={`size-4 shrink-0 text-accent transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                <code className={`font-mono text-xs sm:text-sm ${isSelected ? 'text-accent' : 'text-foreground'}`}>{parameter}</code>
                              </span>
                            </Table.Cell>
                            <Table.Cell className={`!rounded-none px-2 py-4 text-right font-mono text-sm transition-colors ${isSelected ? 'bg-accent-soft text-accent' : 'bg-transparent text-muted'}`}>{value}</Table.Cell>
                          </Table.Row>
                        )
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </section>
          </Tabs.Panel>

          <Tabs.Panel className="package-config-panel" id="dependencies">
            <section>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="m-0 text-[11px] font-bold tracking-[.08em] text-muted uppercase">Declared requirements</p>
                  <h2 className="mt-3 text-[28px] font-[680] tracking-[-.04em] text-foreground">Dependencies</h2>
                  <p className="mt-3 max-w-[520px] text-sm leading-6 text-muted">Direct dependencies declared by this release. LLAR resolves them automatically.</p>
                </div>
                <Chip className="shrink-0" size="sm" variant="secondary"><span className="font-mono">@{selectedVersion}</span></Chip>
              </div>

              <Table className="package-config-table mt-8 !rounded-none border-0 bg-transparent p-0 shadow-none" variant="secondary">
                <Table.ScrollContainer className="max-h-[320px] overflow-y-auto [scrollbar-color:#b7c2d5_transparent] [&::-webkit-scrollbar]:size-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#b7c2d5] [&::-webkit-scrollbar-track]:bg-transparent">
                  <Table.Content aria-label={`Direct dependencies for ${modulePath}@${selectedVersion}`} className="w-full table-fixed !rounded-none">
                    <Table.Header className="sticky top-0 z-10 bg-surface">
                      <Table.Column className="w-3/5 bg-surface px-2" isRowHeader>Package</Table.Column>
                      <Table.Column className="w-2/5 bg-surface px-2 text-right">Required version</Table.Column>
                    </Table.Header>
                    <Table.Body
                      items={directDependencies}
                      renderEmptyState={() => (
                        <div className="flex min-h-28 items-center justify-center border-t border-separator px-4 text-center text-sm text-muted">
                          No direct dependencies declared for @{selectedVersion}.
                        </div>
                      )}
                    >
                      {(dependency) => (
                        <Table.Row id={`${dependency.path}@${dependency.version}`} className="border-t border-separator" textValue={`${dependency.path} ${dependency.version}`}>
                          <Table.Cell className="!rounded-none px-2 py-4"><code className="font-mono text-xs text-foreground sm:text-sm">{dependency.path}</code></Table.Cell>
                          <Table.Cell className="!rounded-none px-2 py-4 text-right"><code className="font-mono text-xs text-muted sm:text-sm">{dependency.version}</code></Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </section>
          </Tabs.Panel>
        </Tabs>
      </div>

      <HomeFooter />
    </main>
  )
}
