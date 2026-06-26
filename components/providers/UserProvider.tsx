'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/lib/types'

interface UserContextValue {
  profile: Profile
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  return <UserContext.Provider value={{ profile }}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser deve ser usado dentro de UserProvider')
  return ctx
}
