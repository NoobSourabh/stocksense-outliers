/**
 * useMediaQuery — React hook for responsive breakpoints
 * 
 * Returns true when the media query matches the current viewport.
 */
"use client"

import { useSyncExternalStore } from "react"

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(query)
      if (media.addEventListener) {
        media.addEventListener("change", callback)
        return () => media.removeEventListener("change", callback)
      } else {
        media.addListener(callback)
        return () => media.removeListener(callback)
      }
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

// Common breakpoint hooks
export function useIsMobile() {
  return useMediaQuery("(max-width: 640px)")
}

export function useIsTablet() {
  return useMediaQuery("(max-width: 1024px)")
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1025px)")
}
