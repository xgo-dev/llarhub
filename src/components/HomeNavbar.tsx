import { useEffect, useState } from 'react'
import { Link } from '@heroui/react'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'

import githubLogo from '../assets/github.ico'
import NavGlassControl from './NavGlassControl'

export default function HomeNavbar() {
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8)
  const packagesActive = location.pathname === '/packages' || location.pathname.startsWith('/packages/')

  useEffect(() => {
    let wasScrolled = window.scrollY > 8

    const syncScrolledState = () => {
      const nextScrolled = window.scrollY > 8

      if (nextScrolled === wasScrolled) return

      wasScrolled = nextScrolled
      setIsScrolled(nextScrolled)
    }

    window.addEventListener('scroll', syncScrolledState, { passive: true })

    return () => window.removeEventListener('scroll', syncScrolledState)
  }, [])

  return (
    <nav
      aria-label="Primary navigation"
      className="home-header"
      data-scrolled={isScrolled}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setMenuOpen(false)
      }}
    >
      <header className="home-nav-surface home-navigation">
        <Link className="home-nav-brand" href="/">
          <svg aria-hidden="true" className="home-nav-xgo-logo" fill="none" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 8L10.72 24H5.78L12.46 16L6 8H10.89L14.89 13L19.02 8H24ZM15.66 19.92L19 24H23.88L18.18 16.93L15.66 19.92Z" fill="currentColor" />
            <path clipRule="evenodd" d="M40 8V11.8H29C27.69 11.8 25.8 13.19 25.8 16C25.8 18.81 27.69 20.2 29 20.2H35V24H29C25.13 24 22 20.42 22 16C22 11.58 25.13 8 29 8H40ZM37 14H30V17.8H36.2V24H40V17C39.9822 16.2099 39.6604 15.4572 39.1016 14.8984C38.5428 14.3396 37.7901 14.0178 37 14Z" fill="currentColor" fillRule="evenodd" />
            <path d="M51.81 10H46.81C45.1153 10.2043 43.5589 11.0366 42.448 12.3326C41.3372 13.6286 40.7527 15.294 40.81 17C40.7527 18.706 41.3372 20.3714 42.448 21.6674C43.5589 22.9634 45.1153 23.7957 46.81 24H51.81C53.5056 23.7979 55.0634 22.9662 56.1747 21.6697C57.286 20.3732 57.8696 18.7066 57.81 17C57.872 15.2929 57.2891 13.6249 56.1774 12.3279C55.0657 11.0309 53.5065 10.1998 51.81 10ZM51.81 20.11H46.81C46.1532 19.9092 45.583 19.4933 45.1912 18.9292C44.7994 18.3651 44.6088 17.6856 44.65 17C44.6066 16.3076 44.7983 15.6208 45.1939 15.0509C45.5896 14.481 46.1661 14.0614 46.83 13.86H51.83C52.4921 14.0632 53.0663 14.4836 53.46 15.0533C53.8537 15.6231 54.044 16.3089 54 17C54.0376 17.6891 53.842 18.3708 53.4447 18.935C53.0473 19.4993 52.4715 19.9132 51.81 20.11Z" fill="currentColor" />
          </svg>
          <span aria-hidden="true" className="home-nav-brand-divider">|</span>
          <span className="home-nav-brand-wordmark">LLARHub</span>
        </Link>

        <ul className="home-nav-links">
          <li><Link aria-current={packagesActive ? undefined : 'page'} className={`home-nav-link${packagesActive ? '' : ' home-nav-link--active'}`} href="/#explore">Explore</Link></li>
          <li><Link aria-current={packagesActive ? 'page' : undefined} className={`home-nav-link${packagesActive ? ' home-nav-link--active' : ''}`} href="/#packages">Packages</Link></li>
          <li><Link className="home-nav-link" href="/#docs">Docs</Link></li>
        </ul>

        <div className="home-nav-actions">
          <NavGlassControl
            as={Link}
            className="home-nav-github"
            href="https://github.com/xgo-dev/llarhub"
            rel="noreferrer"
            target="_blank"
          >
            <img alt="" aria-hidden="true" className="home-nav-github-icon" src={githubLogo} />
            <span>GitHub</span>
          </NavGlassControl>
          <NavGlassControl
            as="button"
            aria-controls="home-mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="home-nav-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
          </NavGlassControl>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="home-nav-mobile-menu"
            exit={{ opacity: 0, y: -6 }}
            id="home-mobile-navigation"
            initial={{ opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          >
            <ul className="home-nav-mobile-list">
              <li><Link aria-current={packagesActive ? undefined : 'page'} className={`home-nav-mobile-link${packagesActive ? '' : ' home-nav-mobile-link--active'}`} href="/#explore" onPress={() => setMenuOpen(false)}>Explore</Link></li>
              <li><Link aria-current={packagesActive ? 'page' : undefined} className={`home-nav-mobile-link${packagesActive ? ' home-nav-mobile-link--active' : ''}`} href="/#packages" onPress={() => setMenuOpen(false)}>Packages</Link></li>
              <li><Link className="home-nav-mobile-link" href="/#docs" onPress={() => setMenuOpen(false)}>Docs</Link></li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
