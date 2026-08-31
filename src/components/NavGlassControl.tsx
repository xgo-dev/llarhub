import { createElement } from 'react'
import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { clsx } from 'clsx'

type NavGlassControlProps<T extends ElementType> = {
  as: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

export default function NavGlassControl<T extends ElementType>({
  as,
  className,
  ...props
}: NavGlassControlProps<T>) {
  return createElement(as, {
    ...props,
    className: clsx('home-nav-glass-control', className),
  })
}
