import googleLogo from '../assets/google.png'
import grpcLogo from '../assets/grpc.png'
import libuvLogo from '../assets/libuv.png'
import madlerLogo from '../assets/madler.jpg'

export interface PackageSummary {
  description: string
  forks: string
  language: string
  license: string
  logo: string
  slug: string
  stars: string
}

export const mockPackages: PackageSummary[] = [
  {
    slug: 'google/highway',
    description: 'Performance-portable, length-agnostic SIMD with runtime dispatch.',
    language: 'C++',
    license: 'MIT',
    stars: '5.8k',
    forks: '463',
    logo: googleLogo,
  },
  {
    slug: 'google/crc32c',
    description: 'A portable CRC32C implementation with hardware acceleration support.',
    language: 'C++',
    license: 'BSD-3-Clause',
    stars: '—',
    forks: '—',
    logo: googleLogo,
  },
  {
    slug: 'google/double-conversion',
    description: 'Binary-decimal and decimal-binary routines for IEEE doubles.',
    language: 'C++',
    license: 'BSD-3-Clause',
    stars: '—',
    forks: '—',
    logo: googleLogo,
  },
  {
    slug: 'madler/zlib',
    description: 'A massively spiffy yet delicately unobtrusive compression library.',
    language: 'C',
    license: 'Zlib',
    stars: '16.6k',
    forks: '1.1k',
    logo: madlerLogo,
  },
  {
    slug: 'grpc/grpc',
    description: 'A high performance, open source universal RPC framework.',
    language: 'C++',
    license: 'Apache-2.0',
    stars: '32.1k',
    forks: '7.3k',
    logo: grpcLogo,
  },
  {
    slug: 'libuv/libuv',
    description: 'Cross-platform asynchronous I/O library.',
    language: 'C',
    license: 'MIT',
    stars: '8.9k',
    forks: '1.0k',
    logo: libuvLogo,
  },
]

export const trendingPackageSlugs = [
  'google/highway',
  'madler/zlib',
  'grpc/grpc',
  'libuv/libuv',
]
