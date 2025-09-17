import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signUpWaiter } from '@/lib/waiterAuthSimple'
import { Loader2, UserPlus } from 'lucide-react'

export const WaiterRegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    name: searchParams.get('name') || '',
    password: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.name || !formData.password) {
      setError('יש למלא את כל השדות')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות')
      return
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signUpWaiter(
        formData.email,
        formData.password,
        formData.name
      )

      setSuccess(true)

      // Wait and redirect to login
      setTimeout(() => {
        navigate('/waiter/login')
      }, 3000)
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('המשתמש כבר רשום במערכת')
      } else {
        setError(err.message || 'שגיאה בהרשמה')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="mb-4">
              <div className="p-3 bg-green-500/10 rounded-full inline-block">
                <UserPlus className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">נרשמת בהצלחה!</h2>
            <p className="text-muted-foreground">
              תוכל להתחבר עם הפרטים שהזנת
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              מעביר לעמוד הכניסה...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-giggsi-gold/10 rounded-full">
              <UserPlus className="h-8 w-8 text-giggsi-gold" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">הרשמת מלצר</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Giggsi Sports Bar - רישום למערכת המלצרים
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ישראל ישראלי"
                required
                disabled={loading || !!searchParams.get('name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">דוא"ל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="waiter@giggsi.com"
                required
                disabled={loading || !!searchParams.get('email')}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="לפחות 6 תווים"
                required
                disabled={loading}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="הזן שוב את הסיסמה"
                required
                disabled={loading}
                dir="ltr"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  נרשם...
                </>
              ) : (
                'הרשמה'
              )}
            </Button>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                כבר רשום?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/waiter/login')}
                className="w-full"
              >
                כניסה למערכת
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}