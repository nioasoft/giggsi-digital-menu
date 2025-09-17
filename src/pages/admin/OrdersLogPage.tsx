import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react'
import { getOrderLogs, getOrderLogsSummary } from '@/lib/waiterService'
import { Loader2 } from 'lucide-react'

interface OrderLog {
  id: string
  table_number: number
  order_id: string
  total_amount: number
  payment_method: string | null
  waiter_name: string
  status: string
  created_at: string
}

interface OrderSummary {
  date: string
  total_orders: number
  paid_orders: number
  cancelled_orders: number
  total_revenue: number
  unique_tables: number
}

export const OrdersLogPage: React.FC = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<OrderLog[]>([])
  const [summary, setSummary] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load logs for selected date
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)

      const [logsData, summaryData] = await Promise.all([
        getOrderLogs(startDate, endDate),
        getOrderLogsSummary()
      ])

      setLogs(logsData as OrderLog[])
      setSummary(summaryData as OrderSummary[])
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const getTodaySummary = () => {
    const today = summary.find(s => s.date === selectedDate)
    return today || {
      total_orders: 0,
      paid_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0,
      unique_tables: 0
    }
  }

  const formatPaymentMethod = (method: string | null) => {
    switch (method) {
      case 'cash': return 'מזומן'
      case 'credit': return 'אשראי'
      case 'bit': return 'ביט'
      case 'paybox': return 'פייבוקס'
      default: return '-'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">שולם</Badge>
      case 'cancelled':
        return <Badge variant="destructive">בוטל</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const todaySummary = getTodaySummary()

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin-giggsi-2024')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">רישום הזמנות</h1>
                <p className="text-sm text-muted-foreground">
                  מעקב אחר הזמנות ותשלומים
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ הזמנות</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySummary.total_orders}</div>
              <p className="text-xs text-muted-foreground">
                {todaySummary.paid_orders} שולמו, {todaySummary.cancelled_orders} בוטלו
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₪{Math.ceil(todaySummary.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">כולל שירות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">שולחנות פעילים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySummary.unique_tables}</div>
              <p className="text-xs text-muted-foreground">שולחנות שונים</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ממוצע להזמנה</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₪{todaySummary.paid_orders > 0
                  ? Math.ceil(todaySummary.total_revenue / todaySummary.paid_orders)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">ממוצע חשבון</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט הזמנות - {selectedDate}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין הזמנות לתאריך זה
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שעה</TableHead>
                      <TableHead className="text-right">שולחן</TableHead>
                      <TableHead className="text-right">סכום</TableHead>
                      <TableHead className="text-right">תשלום</TableHead>
                      <TableHead className="text-right">מלצר</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.created_at).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{log.table_number}</TableCell>
                        <TableCell>₪{Math.ceil(log.total_amount)}</TableCell>
                        <TableCell>{formatPaymentMethod(log.payment_method)}</TableCell>
                        <TableCell>{log.waiter_name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}