import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWaiterSession } from '@/lib/waiterAuth'
import { Loader2 } from 'lucide-react'

interface WaiterProtectedRouteProps {
  children: React.ReactNode
}

export const WaiterProtectedRoute: React.FC<WaiterProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const waiterSession = await getWaiterSession()
      if (waiterSession) {
        setAuthenticated(true)
      } else {
        navigate('/waiter/login')
      }
    } catch (error) {
      navigate('/waiter/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}