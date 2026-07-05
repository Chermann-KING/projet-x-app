import { useWindowDimensions } from 'react-native'

const TABLET_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1024

export type AdminBreakpoint = 'mobile' | 'tablet' | 'desktop'

export function useAdminBreakpoint(): {
  breakpoint: AdminBreakpoint
  isDesktop: boolean
  isTablet: boolean
  isMobile: boolean
  width: number
} {
  const { width } = useWindowDimensions()

  const isDesktop = width >= DESKTOP_BREAKPOINT
  const isTablet = width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT
  const isMobile = width < TABLET_BREAKPOINT

  const breakpoint: AdminBreakpoint = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile'

  return { breakpoint, isDesktop, isTablet, isMobile, width }
}
