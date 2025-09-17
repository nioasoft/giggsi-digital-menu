import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock } from 'lucide-react'

interface PasswordModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
}

const CORRECT_PASSWORD = '6954'

export const PasswordModal: React.FC<PasswordModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'אישור פעולה',
  description = 'הכנס סיסמה לאישור הפעולה'
}) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === CORRECT_PASSWORD) {
      setPassword('')
      setError(false)
      onConfirm()
    } else {
      setError(true)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {description}
            </p>

            <Input
              type="password"
              placeholder="הכנס סיסמה"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              dir="ltr"
              className="text-center"
              autoFocus
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  סיסמה שגויה, נסה שוב
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              ביטול
            </Button>
            <Button type="submit">
              אישור
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}