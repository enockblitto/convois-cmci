import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authRepository } from './authRepository'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const u = await authRepository.getUser()
      setUser(u)
      setProfile(u ? await authRepository.getProfile(u.id) : null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    return authRepository.onChange(refresh)
  }, [refresh])

  const value = useMemo(() => {
    const role = profile?.role
    return {
      user,
      profile,
      loading,
      role,
      isAdmin: role === 'admin',
      isStaff: role === 'admin',
      signIn: authRepository.signIn,
      signUp: authRepository.signUp,
      signOut: authRepository.signOut,
      refresh,
    }
  }, [user, profile, loading, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
