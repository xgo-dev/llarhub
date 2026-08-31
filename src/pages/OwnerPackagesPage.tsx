import { useEffect, useMemo } from 'react'
import {
  Avatar,
  Breadcrumbs,
  Button,
  Label,
  Pagination,
  SearchField,
} from '@heroui/react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import HomeFooter from '../components/HomeFooter'
import HomeNavbar from '../components/HomeNavbar'
import PackageCard from '../components/PackageCard'
import { mockPackages } from '../data/mockPackages'

const pageSize = 50

export default function OwnerPackagesPage() {
  const navigate = useNavigate()
  const { owner } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const ownerFilter = searchParams.has('owner') ? searchParams.get('owner')! : owner ?? ''
  const repoFilter = searchParams.get('repo') ?? ''
  const requestedPage = Number(searchParams.get('page') ?? '1')
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const filteredPackages = useMemo(() => {
    const normalizedOwner = ownerFilter.trim().toLowerCase()
    const normalizedRepo = repoFilter.trim().toLowerCase()

    return mockPackages.filter(({ slug }) => {
      const [packageOwner, repo] = slug.split('/')
      return (!normalizedOwner || packageOwner.toLowerCase().includes(normalizedOwner))
        && (!normalizedRepo || repo.toLowerCase().includes(normalizedRepo))
    })
  }, [ownerFilter, repoFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visiblePackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const resultStart = filteredPackages.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const resultEnd = Math.min(currentPage * pageSize, filteredPackages.length)
  const ownerPackage = mockPackages.find(({ slug }) => slug.split('/')[0].toLowerCase() === ownerFilter.trim().toLowerCase())

  useEffect(() => {
    document.title = `${ownerFilter || 'All'} packages · LLARHub`
    window.scrollTo(0, 0)
  }, [ownerFilter])

  const updateFilter = (key: 'owner' | 'repo', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value === '' && !(key === 'owner' && owner)) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setSearchParams(next)
  }

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage === 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageNumbers: Array<number | 'ellipsis'> = []
  if (totalPages <= 7) {
    for (let index = 1; index <= totalPages; index += 1) pageNumbers.push(index)
  } else {
    pageNumbers.push(1)
    if (currentPage > 3) pageNumbers.push('ellipsis')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let index = start; index <= end; index += 1) pageNumbers.push(index)
    if (currentPage < totalPages - 2) pageNumbers.push('ellipsis')
    pageNumbers.push(totalPages)
  }

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (owner) next.set('owner', '')
    setSearchParams(next)
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbfcff] text-[#101d3d]">
      <HomeNavbar />

      <section className="border-b border-[#e2e8f3] bg-[#f7f9ff] pt-[108px]">
        <div className="mx-auto w-full max-w-[1340px] px-6 pb-10 2xl:px-0">
          <Breadcrumbs className="text-sm text-[#6b7da2]">
            <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
            {ownerFilter ? <Breadcrumbs.Item>{ownerFilter}</Breadcrumbs.Item> : null}
          </Breadcrumbs>

          {ownerFilter ? (
            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-5">
                <Avatar className="size-[72px] shrink-0 rounded-[22px] border border-[#d9e3f2] bg-white shadow-[0_10px_28px_rgba(41,72,127,.08)]">
                  {ownerPackage ? <Avatar.Image alt="" src={ownerPackage.logo} /> : null}
                  <Avatar.Fallback>{ownerFilter.slice(0, 1).toUpperCase()}</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[.08em] text-[#7a7a7a] uppercase">Owner catalog</p>
                  <h1 className="mt-0 max-w-full break-words text-[clamp(34px,5vw,52px)] leading-none font-semibold tracking-normal text-[#1d1d1f]">{ownerFilter}</h1>
                  <p className="mt-3 text-sm leading-5 text-[#7a7a7a]">Google ❤️ Open Source</p>
                </div>
              </div>
              <span className="font-mono text-xs text-[#7a7a7a]">{filteredPackages.length} repositories</span>
            </div>
          ) : null}

          <div className={`${ownerFilter ? 'mt-8' : 'mt-6'} grid gap-5 border-y border-[#dfe6f2] py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end`}>
            <SearchField className="w-full gap-2" fullWidth aria-label="Filter by owner" value={ownerFilter} variant="primary" onChange={(value) => updateFilter('owner', value)}>
              <Label>Owner</Label>
              <SearchField.Group className="h-11 rounded-lg border border-default bg-field shadow-none">
                <SearchField.SearchIcon><Search /></SearchField.SearchIcon>
                <SearchField.Input placeholder="Search owner" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <SearchField className="w-full gap-2" fullWidth aria-label="Filter by repository" value={repoFilter} variant="primary" onChange={(value) => updateFilter('repo', value)}>
              <Label>Repo</Label>
              <SearchField.Group className="h-11 rounded-lg border border-default bg-field shadow-none">
                <SearchField.SearchIcon><SlidersHorizontal /></SearchField.SearchIcon>
                <SearchField.Input placeholder="Search repository" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <Button isDisabled={ownerFilter === '' && repoFilter === ''} variant="ghost" onPress={clearFilters}><X />Clear filters</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1340px] px-6 py-10 2xl:px-0">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-[20px] font-[680] text-[#122043]">Repositories</h2>
          <span className="text-sm text-[#7183a7]">{resultStart}–{resultEnd} of {filteredPackages.length}</span>
        </div>

        {visiblePackages.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {visiblePackages.map((item) => (
              <PackageCard
                key={item.slug}
                item={item}
                onOpenOwner={(packageOwner) => navigate(`/packages/${packageOwner}`)}
                onOpenPackage={item.slug === 'google/highway' ? (slug) => navigate(`/packages/${slug}`) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="border-y border-[#dfe6f2] py-16 text-center">
            <p className="text-base font-semibold text-[#24375d]">No matching repositories</p>
            <p className="mt-2 text-sm text-[#7183a7]">Clear or adjust the Owner and Repo filters.</p>
          </div>
        )}

        {filteredPackages.length > 0 ? (
          <Pagination className="mt-10 w-full" size="sm">
            <Pagination.Summary>Showing {resultStart}–{resultEnd} of {filteredPackages.length} results</Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous isDisabled={currentPage === 1} onPress={() => setPage(currentPage - 1)}><Pagination.PreviousIcon /><span className="hidden sm:inline">Previous</span></Pagination.Previous>
              </Pagination.Item>
              {pageNumbers.map((pageNumber, index) => pageNumber === 'ellipsis' ? (
                <Pagination.Item key={`ellipsis-${index}`}><Pagination.Ellipsis /></Pagination.Item>
              ) : (
                <Pagination.Item key={pageNumber}><Pagination.Link isActive={pageNumber === currentPage} onPress={() => setPage(pageNumber)}>{pageNumber}</Pagination.Link></Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next isDisabled={currentPage === totalPages} onPress={() => setPage(currentPage + 1)}><span className="hidden sm:inline">Next</span><Pagination.NextIcon /></Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        ) : null}
      </section>

      <HomeFooter />
    </main>
  )
}
