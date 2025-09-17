import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getAllTables } from '@/lib/waiterService'
import { signOutWaiter, getCurrentWaiter } from '@/lib/waiterAuth'
import type { Table, WaiterUser } from '@/lib/types'
import { Loader2, LogOut, User } from 'lucide-react'

export const TableSelectionPage: React.FC = () => {
  const navigate = useNavigate()
  const [tables, setTables] = useState<Table[]>([])
  const [currentWaiter, setCurrentWaiter] = useState<WaiterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [waiter, tablesData] = await Promise.all([
        getCurrentWaiter(),
        getAllTables()
      ])

      if (!waiter) {
        navigate('/waiter/login')
        return
      }

      setCurrentWaiter(waiter)
      setTables(tablesData)
    } catch (err: any) {
      setError(err.message || 'Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelect = (table: Table) => {
    navigate(`/waiter/table/${table.table_number}`)
  }

  const handleLogout = async () => {
    await signOutWaiter()
    navigate('/waiter/login')
  }

  const getStatusBadge = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">פנוי</Badge>
      case 'occupied':
        return <Badge className="bg-red-500">תפוס</Badge>
      case 'reserved':
        return <Badge className="bg-yellow-500">שמור</Badge>
      case 'cleaning':
        return <Badge className="bg-blue-500">ניקוי</Badge>
      default:
        return null
    }
  }

  const getTableColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'border-green-500 hover:bg-green-50 dark:hover:bg-green-950'
      case 'occupied':
        return 'border-red-500 hover:bg-red-50 dark:hover:bg-red-950'
      case 'reserved':
        return 'border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950'
      case 'cleaning':
        return 'border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950'
      default:
        return ''
    }
  }

  // Group tables by sections
  const groupedTables = {
    'אזור ראשי (1-19)': tables.filter(t => t.table_number >= 1 && t.table_number <= 19),
    'אזור 100': tables.filter(t => t.table_number >= 100 && t.table_number <= 104),
    'אזור 200': tables.filter(t => t.table_number >= 200 && t.table_number <= 204),
    'אזור 300': tables.filter(t => t.table_number >= 300 && t.table_number <= 304),
    'אזור 400': tables.filter(t => t.table_number >= 400 && t.table_number <= 404),
    'אזור 500': tables.filter(t => t.table_number >= 500 && t.table_number <= 504),
    'אזור VIP': tables.filter(t => t.table_number === 512 || t.table_number === 513),
    'אזור מרפסת (900-920)': tables.filter(t => t.table_number >= 900 && t.table_number <= 920)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-giggsi-gold" />
            <div>
              <h1 className="text-xl font-bold text-giggsi-gold">בחירת שולחן</h1>
              {currentWaiter && (
                <p className="text-sm text-muted-foreground">
                  מלצר: {currentWaiter.name}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            יציאה
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Table Sections */}
        {Object.entries(groupedTables).map(([section, sectionTables]) => {
          if (sectionTables.length === 0) return null

          return (
            <div key={section} className="mb-8">
              <h2 className="text-lg font-semibold mb-4">{section}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {sectionTables.map(table => (
                  <Card
                    key={table.id}
                    className={`cursor-pointer transition-all border-2 ${getTableColor(table.status)}`}
                    onClick={() => handleTableSelect(table)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold mb-2">
                        {table.table_number}
                      </div>
                      {getStatusBadge(table.status)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="mt-8 p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">מקרא:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">פנוי</Badge>
              <span className="text-sm">שולחן פנוי</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500">תפוס</Badge>
              <span className="text-sm">שולחן תפוס</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">שמור</Badge>
              <span className="text-sm">שולחן שמור</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">ניקוי</Badge>
              <span className="text-sm">בניקוי</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}