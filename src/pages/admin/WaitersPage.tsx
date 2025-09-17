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
  createWaiter,
  updateWaiter,
  deleteWaiter
} from '@/lib/waiterAuth'
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
  X
} from 'lucide-react'

export const WaitersPage: React.FC = () => {
  const navigate = useNavigate()
  const [waiters, setWaiters] = useState<WaiterUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [selectedWaiter, setSelectedWaiter] = useState<WaiterUser | null>(null)
  const [processing, setProcessing] = useState(false)

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

  const handleAddWaiter = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('יש למלא את כל השדות')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const result = await createWaiter(formData.email, formData.name, formData.password)

      // Check if we need to manually create auth user
      if (result.note) {
        alert(`מלצר נוצר בהצלחה!\n\nחשוב: כדי שהמלצר יוכל להתחבר, צור עבורו משתמש ב-Supabase:\n1. לך ל-Authentication > Users\n2. לחץ Invite User\n3. הזן: ${formData.email}\n4. הגדר סיסמה: ${formData.password}`)
      }

      await loadWaiters()
      setShowAddDialog(false)
      resetForm()
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת מלצר חדש')
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateWaiter = async () => {
    if (!selectedWaiter || !formData.name || !formData.email) {
      setError('יש למלא את כל השדות')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      await updateWaiter(selectedWaiter.id, {
        name: formData.name,
        email: formData.email
      })
      await loadWaiters()
      setShowEditDialog(false)
      resetForm()
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון מלצר')
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

  const handleToggleActive = async (waiter: WaiterUser) => {
    setProcessing(true)
    try {
      await updateWaiter(waiter.id, {
        is_active: !waiter.is_active
      })
      await loadWaiters()
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון סטטוס מלצר')
    } finally {
      setProcessing(false)
    }
  }

  const openEditDialog = (waiter: WaiterUser) => {
    setSelectedWaiter(waiter)
    setFormData({
      name: waiter.name,
      email: waiter.email,
      password: ''
    })
    setShowEditDialog(true)
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
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
      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {waiters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">אין מלצרים במערכת</p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="mt-4"
                >
                  הוסף מלצר ראשון
                </Button>
              </CardContent>
            </Card>
          ) : (
            waiters.map((waiter) => (
              <Card key={waiter.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-giggsi-gold/10 rounded-full">
                        <User className="h-6 w-6 text-giggsi-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{waiter.name}</h3>
                        <p className="text-sm text-muted-foreground">{waiter.email}</p>
                        {waiter.last_login && (
                          <p className="text-xs text-muted-foreground">
                            כניסה אחרונה: {new Date(waiter.last_login).toLocaleDateString('he-IL')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={waiter.is_active ? 'bg-green-500' : 'bg-red-500'}
                      >
                        {waiter.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(waiter)}
                        disabled={processing}
                      >
                        {waiter.is_active ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(waiter)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteWaiter(waiter)}
                        disabled={processing}
                      >
                        <Trash2 className="h-4 w-4" />
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
              variant="secondary"
              onClick={handleCreateInvite}
              disabled={processing || !formData.name || !formData.email}
            >
              צור קישור הזמנה
            </Button>
            <Button
              onClick={handleAddWaiter}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'צור ישירות (מתקדם)'
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

      {/* Edit Waiter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ערוך מלצר</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">שם מלצר</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ישראל ישראלי"
              />
            </div>

            <div>
              <Label htmlFor="edit-email">דוא"ל</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="waiter@giggsi.com"
                dir="ltr"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                resetForm()
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleUpdateWaiter}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'עדכן מלצר'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}