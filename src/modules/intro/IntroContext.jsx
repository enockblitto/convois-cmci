import { createContext, useCallback, useContext, useState } from 'react'

const IntroContext = createContext({ introDone: true, finishIntro: () => {} })
const KEY = 'cmci-intro-seen'

const shouldPlay = () => {
  if (typeof window === 'undefined') return false
  if (window.location.pathname !== '/') return false
  if (sessionStorage.getItem(KEY)) return false
  return true
}

export function IntroProvider({ children }) {
  const [introDone, setIntroDone] = useState(() => !shouldPlay())
  const finishIntro = useCallback(() => {
    sessionStorage.setItem(KEY, '1')
    setIntroDone(true)
  }, [])
  const replayIntro = useCallback(() => {
    sessionStorage.removeItem(KEY)
    window.scrollTo(0, 0)
    setIntroDone(false)
  }, [])
  return <IntroContext.Provider value={{ introDone, finishIntro, replayIntro }}>{children}</IntroContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useIntro = () => useContext(IntroContext)
