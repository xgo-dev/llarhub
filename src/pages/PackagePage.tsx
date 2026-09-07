import type { Selection } from '@heroui/react'
import type { Components } from 'react-markdown'
import type { FileContents, FileOptions } from '@pierre/diffs/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { hotkeysCoreFeature, selectionFeature, syncDataLoaderFeature } from '@headless-tree/core'
import { useTree } from '@headless-tree/react'
import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  Disclosure,
  Link,
  ScrollShadow,
  Table,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@heroui/react'
import {
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  GitFork,
  Library,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import Markdown from 'react-markdown'

import googleLogo from '../assets/google.png'
import HomeFooter from '../components/HomeFooter'
import HomeNavbar from '../components/HomeNavbar'
import Grainient from '../components/react-bits/Grainient/Grainient'
import SoftAurora from '../components/react-bits/SoftAurora/SoftAurora/SoftAurora'
import './PackageContent.css'
import installedHeaderManifest from '../data/highway-1.4.0-linux-amd64/manifest.json'

const installedHeaderPrefix = '../data/highway-1.4.0-linux-amd64/include/'
const installedHeaderURLs = import.meta.glob<string>('../data/highway-1.4.0-linux-amd64/include/**/*', {
  query: '?url&no-inline', import: 'default', eager: true,
})
const HeaderCodeFile = lazy(async () => {
  const [viewer, { preloadHighlighter }] = await Promise.all([
    import('@pierre/diffs/react'), import('@pierre/diffs'),
  ])
  // Initialize before mounting: an empty first render can be reused by StrictMode hydration.
  await preloadHighlighter({ langs: ['cpp'], themes: ['github-light'] })
  return { default: viewer.File }
})
const headerCodeOptions = {
  theme: 'github-light', themeType: 'light', disableFileHeader: true,
  overflow: 'scroll', enableLineSelection: true,
} satisfies FileOptions<undefined, undefined>

type HeaderItem = { name: string, children: string[], isFolder: boolean, size?: number }
const installedHeaderTree = new Map<string, HeaderItem>([
  ['root', { name: 'include', children: [], isFolder: true }],
])
for (const file of installedHeaderManifest) {
  const parts = file.path.split('/')
  let parent = 'root'
  for (let index = 0; index < parts.length; index++) {
    const path = parts.slice(0, index + 1).join('/')
    const isFolder = index < parts.length - 1
    if (!installedHeaderTree.has(path)) {
      installedHeaderTree.set(path, { name: parts[index], children: [], isFolder, size: isFolder ? undefined : file.size })
      installedHeaderTree.get(parent)!.children.push(path)
    }
    parent = path
  }
}
for (const item of installedHeaderTree.values()) {
  item.children.sort((a, b) => {
    const left = installedHeaderTree.get(a)!, right = installedHeaderTree.get(b)!
    return Number(right.isFolder) - Number(left.isFolder) || left.name.localeCompare(right.name)
  })
}

function InstalledHeaderFile({ path }: { path: string }) {
  const url = installedHeaderURLs[installedHeaderPrefix + path]
  const [file, setFile] = useState<FileContents | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`Could not load the installed header (HTTP ${response.status}).`)
        const contents = await response.text()
        if (!controller.signal.aborted) setFile({ name: path, contents, lang: 'cpp' })
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load the installed header.')
      }
    }
    void load()
    return () => controller.abort()
  }, [url, path])

  return <section className="package-header-file" aria-label={`Installed file include/${path}`}>
    <div className="package-header-file-heading">
      <code className="package-installed-header-path">include/{path}</code>
      <div className="package-header-file-actions">
        <Button size="sm" variant="ghost" aria-label="Copy header source" isDisabled={file === null} onPress={() => {
          if (file !== null) void navigator.clipboard.writeText(file.contents).then(() => setCopyState('copied'), () => setCopyState('failed'))
        }}>{copyState === 'copied' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copyState === 'copied' ? 'Copied' : 'Copy'}</Button>
        <Link href={url} target="_blank" rel="noreferrer">Raw<ExternalLink className="size-3" /></Link>
      </div>
    </div>
    <div className="package-header-origin"><span>Build output · Linux / AMD64 · @1.4.0</span><span>Click line numbers to select</span></div>
    {copyState === 'failed' && <p className="package-header-message" role="status">Copy failed. Select the code to copy it manually.</p>}
    {file !== null ? <div className="package-header-code" aria-label="Installed header source" tabIndex={0}>
      <Suspense fallback={<p className="package-header-message" role="status">Loading code viewer…</p>}><HeaderCodeFile file={file} options={headerCodeOptions} /></Suspense>
    </div> : <p className="package-header-message" role={error ? 'alert' : 'status'}>{error ?? 'Loading installed header…'}</p>}
  </section>
}

function InstalledHeaders() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [treeOpen, setTreeOpen] = useState(false)
  const tree = useTree<HeaderItem>({
    rootItemId: 'root',
    dataLoader: { getItem: id => installedHeaderTree.get(id)!, getChildren: id => installedHeaderTree.get(id)!.children },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
    getItemName: item => item.getItemData().name,
    isItemFolder: item => item.getItemData().isFolder,
    initialState: { expandedItems: ['hwy'] },
    onPrimaryAction: item => { if (!item.isFolder()) setSelectedPath(item.getId()) },
  })

  return <div className="package-header-browser package-installed-headers" data-file-open={selectedPath !== null} data-tree-open={treeOpen}>
    <div className="package-header-toolbar">
      {selectedPath === null ? <span className="package-header-build-label"><Folder className="size-4" />include/ <span>{installedHeaderManifest.length} files</span></span>
        : <Button className="package-header-back" size="sm" variant="ghost" onPress={() => setSelectedPath(null)}><ChevronLeft className="size-4" />All headers</Button>}
      {selectedPath !== null && <Button size="sm" variant="ghost" aria-controls="installed-header-directory" aria-expanded={treeOpen} onPress={() => setTreeOpen(open => !open)}><Folder className="size-4" />Files</Button>}
    </div>
    <div className="package-header-browser-layout">
      <div id="installed-header-directory" hidden={selectedPath !== null && !treeOpen}>
        <div className="package-header-tree package-installed-header-tree">
          <div className="package-installed-header-columns"><span>Header</span><span>Size</span></div>
          <div {...tree.getContainerProps('Installed include directory')}>
            {tree.getItems().map(item => {
              const data = item.getItemData()
              return <button {...item.getProps()} key={item.getKey()} type="button" className="package-installed-header-row">
                <span className="package-installed-header-columns">
                  <span style={{ paddingInlineStart: `${item.getItemMeta().level * 16}px` }}>
                    {data.isFolder ? <ChevronRight className={`size-3.5 ${item.isExpanded() ? 'rotate-90' : ''}`} /> : <span className="size-3.5 shrink-0" />}
                    {data.isFolder ? (item.isExpanded() ? <FolderOpen className="size-4" /> : <Folder className="size-4" />) : <FileCode2 className="size-4" />}
                    <code>{data.name}</code>
                  </span>
                  <span>{data.size === undefined ? '' : `${(data.size / 1024).toFixed(1)} kB`}</span>
                </span>
              </button>
            })}
          </div>
        </div>
      </div>
      {selectedPath !== null && <InstalledHeaderFile key={selectedPath} path={selectedPath} />}
    </div>
  </div>
}

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


const readmeMarkdown = `# Efficient and performance-portable vector software

Highway is a C++ library that provides portable SIMD/vector intrinsics.

[Read the documentation](https://google.github.io/highway/en/master/)

## Why

Highway is for engineers who want to reliably and economically push the boundaries of what is possible in software across servers, mobile devices, and desktops.

## How

SIMD/vector instructions apply the same operation to multiple data items. Highway makes SIMD/vector programming practical according to these principles:

- **Does what you expect.** Functions map closely to CPU instructions without extensive compiler transformations.
- **Works on widely-used platforms.** The same C++17 application code targets seven architectures, including scalable vector instruction sets.
- **Flexible to deploy.** Applications can choose the best instruction set at runtime or target one instruction set without changing their core code.
- **Suitable for many domains.** Highway is used for image processing, compression, video analysis, linear algebra, cryptography, sorting, and random generation.

## Current status

Highway supports 27 targets across Arm, IBM Z, LoongArch, POWER, RISC-V, WebAssembly, and x86. Releases follow semantic versioning, and release builds are recommended over the Git tip.
`

const readmeComponents: Components = {
  h1: ({ children }) => <h1 className="text-[clamp(30px,4vw,40px)] leading-[1.14] font-semibold tracking-[-.03em] text-[#101d3d]">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-12 border-t border-[#e2e8f3] pt-8 text-[28px] leading-[1.2] font-semibold tracking-[-.03em] text-[#101d3d]">{children}</h2>,
  p: ({ children }) => <p className="mt-4 text-base leading-6 text-[#58709b]">{children}</p>,
  a: ({ children, href }) => <Link className="mt-3 inline-flex text-[#0066cc]" href={href} rel="noreferrer" target="_blank">{children}<Link.Icon aria-hidden="true" /></Link>,
  ul: ({ children }) => <ul className="mt-5 space-y-3 pl-5 text-base leading-6 text-[#58709b]">{children}</ul>,
  li: ({ children }) => <li className="list-disc pl-1 marker:text-[#7a7a7a]">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#101d3d]">{children}</strong>,
}


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
  const [activeConfiguration, setActiveConfiguration] = useState('readme')
  const [selectedBuildOptions, setSelectedBuildOptions] = useState<Selection>(new Set())
  const [selectedOS, setSelectedOS] = useState<string | null>(null)
  const [selectedArch, setSelectedArch] = useState<string | null>(null)
  const [headerPlatform, setHeaderPlatform] = useState('linux/amd64')
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

          <div className="py-7 sm:py-8">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <Avatar className="size-16 shrink-0 rounded-[20px] border border-[#d9e3f2] bg-white shadow-[0_8px_24px_rgba(41,72,127,.07)]">
                <Avatar.Image alt="Google" loading="eager" src={googleLogo} />
                <Avatar.Fallback>G</Avatar.Fallback>
              </Avatar>

              <div className="min-w-0 pt-0.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <h1 className="text-[clamp(34px,4.1vw,48px)] leading-[1.06] font-bold tracking-[-.05em] text-[#111b35]">google/highway</h1>
                  <Link aria-label="Open google/highway on GitHub" className="shrink-0 text-[#0874f8]" href="https://github.com/google/highway" rel="noreferrer" target="_blank">
                    <ExternalLink className="size-4.5" />
                  </Link>
                </div>
                <p className="mt-2.5 max-w-[820px] text-[15px] leading-6 text-[#58709b]">Performance-portable SIMD with runtime dispatch across modern CPU targets.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['C++', 'SIMD', 'Performance', 'Header-only'].map((topic) => <Chip key={topic} size="sm" variant="secondary">{topic}</Chip>)}
                </div>
              </div>
            </div>
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

      <section className="package-content">
        <div className="package-content-layout">
          <section className="package-content-main">
            <Tabs className="min-w-0" selectedKey={activeConfiguration} variant="secondary" onSelectionChange={(key) => setActiveConfiguration(String(key))}>
              <Tabs.ListContainer>
                <Tabs.List aria-label="Package content">
                  <Tabs.Tab id="readme"><FileText className="size-4" />README<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="headers"><FileCode2 className="size-4" />Headers{selectedVersion === '1.4.0' && headerPlatform === 'linux/amd64' && <span className="package-content-count">{installedHeaderManifest.length}</span>}<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="dependencies"><Boxes className="size-4" />Dependencies <span className="package-content-count">{directDependencies.length}</span><Tabs.Indicator /></Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel className="mt-0 min-w-0 p-0" id="readme">
                <div className="package-content-source">
                  <span><FileText className="size-3.5" /><code>README.md</code><span className="package-content-source-note">from the repository</span></span>
                  <Link href="https://github.com/google/highway#readme" rel="noreferrer" target="_blank">View source<Link.Icon aria-hidden="true" /></Link>
                </div>
                <article className="package-content-readme">
                  <Markdown components={readmeComponents} skipHtml>{readmeMarkdown}</Markdown>
                </article>
              </Tabs.Panel>

              <Tabs.Panel className="mt-8 min-w-0 p-0" id="headers">
                <div className="package-content-heading package-headers-heading">
                  <div><h2 className="flex items-center gap-2 text-[22px] font-semibold tracking-[-.02em] text-[#101d3d]"><Library className="size-5 text-[#58709b]" />Installed headers</h2><p className="mt-2 max-w-[560px] text-sm leading-6 text-[#58709b]">Files from the build output's <code>include/</code> directory.</p></div>
                  <label className="package-header-platform">
                    <span>Platform</span>
                    <select value={headerPlatform} onChange={event => setHeaderPlatform(event.target.value)}>
                      <option value="">Choose platform</option>
                      {operatingSystems.map(os => <optgroup key={os.id} label={os.label}>
                        {architectures.map(arch => <option key={arch.id} value={`${os.id}/${arch.id}`}>{os.label} / {arch.label}</option>)}
                      </optgroup>)}
                    </select>
                  </label>
                </div>
                {selectedVersion === '1.4.0' && headerPlatform === 'linux/amd64' ? <InstalledHeaders /> : <div className="package-header-platform-empty" role="status">
                  <Folder className="size-6" />
                  <h3>{headerPlatform === '' ? 'Select a target platform' : 'Build headers not available'}</h3>
                  <p>{headerPlatform === ''
                    ? <>Headers come from the installed <code>include/</code> directory for each version and target platform.</>
                    : <>The build output's <code>include/</code> files have not been provided for <code>{headerPlatform}</code> at <code>@{selectedVersion}</code>.</>}</p>
                </div>}
              </Tabs.Panel>

              <Tabs.Panel className="mt-8 min-w-0 p-0" id="dependencies">
                <div className="package-content-heading">
                  <div><h2 className="text-[22px] font-semibold tracking-[-.02em] text-[#101d3d]">Dependencies</h2><p className="mt-2 max-w-[560px] text-sm leading-6 text-[#58709b]">Direct dependencies declared for this release.</p></div>
                  <Chip className="shrink-0" size="sm" variant="secondary"><span className="font-mono">@{selectedVersion}</span></Chip>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#d9e3f2] bg-white">
                  <Table className="!rounded-none border-0 bg-transparent p-0 shadow-none" variant="secondary">
                    <Table.ScrollContainer className="max-h-[320px] overflow-y-auto [scrollbar-width:thin]">
                      <Table.Content aria-label={`Direct dependencies for ${modulePath}@${selectedVersion}`} className="w-full table-fixed !rounded-none">
                        <Table.Header className="sticky top-0 z-10 bg-[#f3f6fc]"><Table.Column className="w-3/5 bg-[#f3f6fc] px-4" isRowHeader>Module</Table.Column><Table.Column className="w-2/5 bg-[#f3f6fc] px-4 text-right">Required version</Table.Column></Table.Header>
                        <Table.Body items={directDependencies} renderEmptyState={() => <div className="flex min-h-36 items-center justify-center border-t border-[#e2e8f3] px-4 text-center text-sm text-[#58709b]">No direct dependencies declared for @{selectedVersion}.</div>}>
                          {(dependency) => <Table.Row id={`${dependency.path}@${dependency.version}`} className="border-t border-[#e2e8f3]" textValue={`${dependency.path} ${dependency.version}`}><Table.Cell className="!rounded-none px-4 py-4"><code className="font-mono text-xs text-[#101d3d] sm:text-sm">{dependency.path}</code></Table.Cell><Table.Cell className="!rounded-none px-4 py-4 text-right"><code className="font-mono text-xs text-[#58709b] sm:text-sm">{dependency.version}</code></Table.Cell></Table.Row>}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                </div>
              </Tabs.Panel>
            </Tabs>
          </section>

          <aside className="package-content-aside">
            <section className="package-content-install">
              <div className="package-content-install-body">
                <div className="package-content-install-heading">
                  <div><p>Install with LLAR</p><h2>Use this release</h2></div>
                  <span>@{selectedVersion}</span>
                </div>
                <div className="package-content-terminal">
                  <div className="package-content-terminal-heading">
                    <span>Terminal</span>
                    <Tooltip delay={0}>
                      <Button aria-label="Copy install command" className="package-content-copy" size="sm" variant="ghost" onPress={copyCommand}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? 'Copied' : 'Copy'}</Button>
                      <Tooltip.Content>{copied ? 'Copied' : 'Copy command'}</Tooltip.Content>
                    </Tooltip>
                  </div>
                  <div className="package-content-command"><span aria-hidden="true">$</span><code>{installCommand}</code></div>
                </div>
              </div>

              <Disclosure>
                <Disclosure.Heading>
                  <Button fullWidth className="package-content-customize" slot="trigger" variant="ghost">
                    <span><SlidersHorizontal className="size-3.5" />Customize</span>
                    <span>{selectedOS === null && selectedArch === null && selectedBuildOptionCount === 0 ? 'Defaults' : 'Custom'}<Disclosure.Indicator /></span>
                  </Button>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body className="package-content-config">
                    <div className="rounded-lg bg-white p-3 text-[#101d3d]">
                      <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold tracking-[.06em] text-[#58709b] uppercase">Build target</span><Button className="h-7 min-w-0 rounded-lg px-2 text-xs" isDisabled={selectedOS === null && selectedArch === null && selectedBuildOptionCount === 0} size="sm" variant="ghost" onPress={() => { setSelectedOS(null); setSelectedArch(null); setSelectedBuildOptions(new Set()); setCopied(false) }}>Reset</Button></div>
                      <div className="mt-3 space-y-3">
                        <ToggleButtonGroup fullWidth aria-label="Operating system" className="overflow-hidden rounded-lg border border-[#d9e3f2]" selectedKeys={selectedOS === null ? [] : [selectedOS]} selectionMode="single" size="sm" onSelectionChange={(keys) => { const [value] = Array.from(keys); setSelectedOS(value === undefined ? null : String(value)); setCopied(false) }}>{operatingSystems.map(({ id, label }, index) => <ToggleButton key={id} className="min-w-0 rounded-none px-2 font-mono text-[10px]" id={id}>{index > 0 && <ToggleButtonGroup.Separator />}{label}</ToggleButton>)}</ToggleButtonGroup>
                        <ToggleButtonGroup fullWidth aria-label="Architecture" className="overflow-hidden rounded-lg border border-[#d9e3f2]" selectedKeys={selectedArch === null ? [] : [selectedArch]} selectionMode="single" size="sm" onSelectionChange={(keys) => { const [value] = Array.from(keys); setSelectedArch(value === undefined ? null : String(value)); setCopied(false) }}>{architectures.map(({ id, label }, index) => <ToggleButton key={id} className="rounded-none font-mono text-[10px]" id={id}>{index > 0 && <ToggleButtonGroup.Separator />}{label}</ToggleButton>)}</ToggleButtonGroup>
                      </div>
                      <div className="mt-4 border-t border-[#e2e8f3] pt-3">
                        <div className="flex items-center justify-between"><span className="text-[11px] font-semibold tracking-[.06em] text-[#58709b] uppercase">CMake</span><span className="text-[10px] text-[#7a7a7a]">{selectedBuildOptionCount} selected</span></div>
                        <Table className="mt-2 !rounded-none border-0 bg-transparent p-0 shadow-none" variant="secondary">
                          <Table.ScrollContainer className="max-h-[220px] overflow-y-auto [scrollbar-width:thin]">
                            <Table.Content aria-label="Selectable build system parameters" className="!rounded-none" selectedKeys={selectedBuildOptions} selectionBehavior="toggle" selectionMode="multiple" onSelectionChange={(selection) => { setSelectedBuildOptions(selection); setCopied(false) }}>
                              <Table.Header className="bg-white"><Table.Column className="bg-white px-1" isRowHeader>Option</Table.Column><Table.Column className="bg-white px-1 text-right">Default</Table.Column></Table.Header>
                              <Table.Body>{buildParameters.map(([parameter, value]) => { const isSelected = selectedBuildOptionKeys.has(parameter); return <Table.Row key={parameter} className="cursor-pointer border-t border-[#e2e8f3]" id={parameter} textValue={`${parameter} ${value}`}><Table.Cell className={`!rounded-none px-1 py-2.5 ${isSelected ? 'bg-[#edf4ff]' : 'bg-white'}`}><code className="block max-w-[170px] truncate font-mono text-[9px] text-[#101d3d]">{parameter}</code></Table.Cell><Table.Cell className={`!rounded-none px-1 py-2.5 text-right font-mono text-[9px] ${isSelected ? 'bg-[#edf4ff]' : 'bg-white'}`}>{value}</Table.Cell></Table.Row> })}</Table.Body>
                            </Table.Content>
                          </Table.ScrollContainer>
                        </Table>
                      </div>
                    </div>
                  </Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            </section>

            <section className="package-content-resources">
              <h2>Project resources</h2>
              <div>
                <Link href="https://github.com/google/highway" rel="noreferrer" target="_blank"><span>Source repository<small>google/highway</small></span><Link.Icon aria-hidden="true" /></Link>
                <Link href="https://google.github.io/highway/en/master/" rel="noreferrer" target="_blank"><span>Documentation<small>Highway documentation</small></span><Link.Icon aria-hidden="true" /></Link>
              </div>
              <dl>
                <div><dt>Forks</dt><dd><GitFork className="size-3.5" />463</dd></div>
                <div><dt>Language</dt><dd>C++</dd></div>
              </dl>
            </section>
          </aside>
        </div>
      </section>


      <HomeFooter />
    </main>
  )
}
