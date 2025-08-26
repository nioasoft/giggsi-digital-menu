import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const session = await getSession()
      if (session) {
        setAuthenticated(true)
      } else {
        navigate('/admin-giggsi-2024/login')
      }
    } catch (error) {
      navigate('/admin-giggsi-2024/login')
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