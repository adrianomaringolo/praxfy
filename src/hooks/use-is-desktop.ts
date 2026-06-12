'use client'

import { useEffect, useState } from 'react'

/**
 * true quando a viewport é >= breakpoint (md por padrão).
 * Retorna true no primeiro render (SSR) e ajusta após montar.
 */
export function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])

  return isDesktop
}
