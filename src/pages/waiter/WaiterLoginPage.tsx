import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signInWaiter } from '@/lib/waiterAuth'
import { Loader2, User } from 'lucide-react'

export const WaiterLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWaiter(email, password)
      navigate('/waiter/tables')
    } catch (err: any) {
      setError(err.message || 'שם משתמש או סיסמה לא נכונים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-giggsi-gold/10 rounded-full">
              <User className="h-8 w-8 text-giggsi-gold" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">כניסת מלצרים</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Giggsi Sports Bar - מערכת מלצרים
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">דוא"ל</Label>
              <Input
                id="email"
                type="email"
                placeholder="waiter@giggsi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  מתחבר...
                </>
              ) : (
                'כניסה'
              )}
            </Button>

            <div className="text-center pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm"
              >
                חזרה לתפריט הרגיל
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}