import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getAllWaiters,
  approveWaiter,
  deactivateWaiter,
  deleteWaiter
} from '@/lib/waiterService'
import { createWaiterInvite } from '@/lib/waiterAuthSimple'
import type { WaiterUser } from '@/lib/types'
import {
  Loader2,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  User,
  Check,
  X,
  Mail,
  UserCheck
} from 'lucide-react'

export const WaitersPage: React.FC = () => {
  const navigate = useNavigate()
  const [waiters, setWaiters] = useState<WaiterUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [selectedWaiter, setSelectedWaiter] = useState<WaiterUser | null>(null)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    loadWaiters()
  }, [])

  const loadWaiters = async () => {
    setLoading(true)
    try {
      const data = await getAllWaiters()
      setWaiters(data)
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת רשימת מלצרים')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveWaiter = async (waiter: WaiterUser) => {
    setProcessing(true)
    setError(null)

    try {
      await approveWaiter(waiter.id)
      await loadWaiters()
      alert('המלצר אושר בהצלחה!')
    } catch (err: any) {
      setError(err.message || 'שגיאה באישור מלצר')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeactivateWaiter = async (waiter: WaiterUser) => {
    if (!confirm(`האם אתה בטוח שברצונך לבטל את המלצר ${waiter.name}?`)) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      await deactivateWaiter(waiter.id)
      await loadWaiters()
    } catch (err: any) {
      setError(err.message || 'שגיאה בביטול מלצר')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteWaiter = async (waiter: WaiterUser) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המלצר ${waiter.name}?`)) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      await deleteWaiter(waiter.id)
      await loadWaiters()
    } catch (err: any) {
      setError(err.message || 'שגיאה במחיקת מלצר')
    } finally {
      setProcessing(false)
    }
  }


  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: ''
    })
    setSelectedWaiter(null)
    setError(null)
    setInviteLink('')
  }

  // Filter waiters based on search and status
  const filteredWaiters = waiters.filter(waiter => {
    const matchesSearch =
      waiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waiter.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && waiter.is_active) ||
      (filterStatus === 'inactive' && !waiter.is_active)

    return matchesSearch && matchesStatus
  })

  const handleCreateInvite = async () => {
    if (!formData.name || !formData.email) {
      setError('יש למלא שם ודוא"ל')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const result = await createWaiterInvite(formData.email, formData.name)
      setInviteLink(result.inviteLink)
      setShowAddDialog(false)
      setShowInviteDialog(true)
      await loadWaiters()
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת הזמנה')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b text-right">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin-giggsi-2024')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-giggsi-gold">ניהול מלצרים</h1>
              <p className="text-sm text-muted-foreground">
                ניהול משתמשי מערכת המלצרים
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowAddDialog(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            הוסף מלצר חדש
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 text-right">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="חפש לפי שם או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              הכל ({waiters.length})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
            >
              מאושרים ({waiters.filter(w => w.is_active).length})
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('inactive')}
              size="sm"
            >
              ממתינים ({waiters.filter(w => !w.is_active).length})
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredWaiters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {waiters.length === 0
                    ? 'אין מלצרים במערכת'
                    : 'לא נמצאו מלצרים התואמים לחיפוש'}
                </p>
                {waiters.length === 0 && (
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="mt-4"
                  >
                    הוסף מלצר ראשון
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredWaiters.map((waiter) => (
              <Card key={waiter.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-giggsi-gold/10 rounded-full">
                        <User className="h-6 w-6 text-giggsi-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{waiter.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{waiter.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          נרשם: {new Date(waiter.created_at || Date.now()).toLocaleDateString('he-IL')}
                          {waiter.last_login && (
                            <span> • כניסה אחרונה: {new Date(waiter.last_login).toLocaleDateString('he-IL')}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={waiter.is_active ? 'bg-green-500' : 'bg-orange-500'}
                      >
                        {waiter.is_active ? 'מאושר' : 'ממתין לאישור'}
                      </Badge>

                      {!waiter.is_active && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveWaiter(waiter)}
                          disabled={processing}
                          className="gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4" />
                          אשר מלצר
                        </Button>
                      )}

                      {waiter.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivateWaiter(waiter)}
                          disabled={processing}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" />
                          בטל
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteWaiter(waiter)}
                        disabled={processing}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Add Waiter Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף מלצר חדש</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="add-name">שם מלצר</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ישראל ישראלי"
              />
            </div>

            <div>
              <Label htmlFor="add-email">דוא"ל</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="waiter@giggsi.com"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="add-password">סיסמה</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="סיסמה חזקה"
                dir="ltr"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                resetForm()
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleCreateInvite}
              disabled={processing || !formData.name || !formData.email}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'צור קישור הזמנה'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>קישור הזמנה למלצר</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              שלח את הקישור הזה למלצר כדי שיוכל להירשם בעצמו:
            </p>

            <div className="p-3 bg-muted rounded-lg break-all">
              <code className="text-xs" dir="ltr">{inviteLink}</code>
            </div>

            <Button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink)
                alert('הקישור הועתק!')
              }}
              className="w-full"
            >
              העתק קישור
            </Button>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowInviteDialog(false)
                resetForm()
              }}
            >
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}