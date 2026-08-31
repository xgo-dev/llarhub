import type { KeyboardEvent, MouseEvent } from 'react'
import { Avatar, Button, Card, Chip } from '@heroui/react'
import { BadgeCheck, GitFork, Star } from 'lucide-react'
import { motion } from 'motion/react'

import type { PackageSummary } from '../data/mockPackages'

export default function PackageCard({
  item,
  onOpenOwner,
  onOpenPackage,
}: {
  item: PackageSummary
  onOpenOwner: (owner: string) => void
  onOpenPackage?: (slug: string) => void
}) {
  const [owner, repo] = item.slug.split('/')

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onOpenPackage || (event.target as HTMLElement).closest('button')) return
    onOpenPackage(item.slug)
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpenPackage || event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onOpenPackage(item.slug)
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }}>
      <Card
        className={`h-[205px] gap-0 p-5 ${onOpenPackage ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        tabIndex={onOpenPackage ? 0 : undefined}
      >
        <Card.Header className="flex-row items-start gap-4">
          <Avatar className="size-[56px] rounded-2xl">
            <Avatar.Image alt="" src={item.logo} />
            <Avatar.Fallback>{owner.slice(0, 1).toUpperCase()}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1 overflow-hidden text-[16px] font-[680] text-foreground">
              <Button className="h-auto shrink-0 rounded-none p-0 text-[16px] font-[680] text-foreground [--button-bg-hover:transparent] [--button-bg-pressed:transparent] data-[hovered=true]:underline data-[pressed=true]:underline" variant="ghost" onPress={() => onOpenOwner(owner)}>{owner}</Button>
              <span aria-hidden="true" className="shrink-0">/</span>
              {onOpenPackage ? (
                <Button className="h-auto min-w-0 flex-1 justify-start overflow-hidden rounded-none p-0 text-[16px] font-[680] text-foreground [--button-bg-hover:transparent] [--button-bg-pressed:transparent] data-[hovered=true]:underline data-[pressed=true]:underline" variant="ghost" onPress={() => onOpenPackage(item.slug)}><span className="truncate">{repo}</span></Button>
              ) : <span className="min-w-0 flex-1 truncate">{repo}</span>}
              <BadgeCheck className="size-4 shrink-0 fill-accent text-accent-foreground" />
            </div>
            <Card.Description className="mt-1 line-clamp-2 text-[12px] leading-5">{item.description}</Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="mt-3 flex-none flex-row gap-2">
          <Chip size="sm"><span className="mr-1 inline-block size-2 rounded-full bg-accent" />{item.language}</Chip>
          <Chip size="sm">{item.license}</Chip>
        </Card.Content>
        <Card.Footer className="mt-auto flex w-full items-center justify-between border-t border-separator pt-4 text-sm text-muted">
          <span className="flex items-center gap-3"><Star className="size-4" />{item.stars}</span>
          <span className="flex items-center gap-3"><GitFork className="size-4" />{item.forks}</span>
        </Card.Footer>
      </Card>
    </motion.div>
  )
}
