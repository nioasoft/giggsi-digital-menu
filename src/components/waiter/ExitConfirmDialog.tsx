import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Send } from 'lucide-react'

interface ExitConfirmDialogProps {
  open: boolean
  onClose: () => void
  unsentCount: number
  onSendToKitchen: () => Promise<void>
  onExitWithoutSending: () => void
}

export const ExitConfirmDialog: React.FC<ExitConfirmDialogProps> = ({
  open,
  onClose,
  unsentCount,
  onSendToKitchen,
  onExitWithoutSending
}) => {
  const handleSendAndExit = async () => {
    await onSendToKitchen()
    onClose()
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent dir="rtl" className="text-right">
        <AlertDialogHeader>
          <AlertDialogTitle>יש פריטים שלא נשלחו למטבח</AlertDialogTitle>
          <AlertDialogDescription>
            יש {unsentCount} פריטים שהוספת להזמנה אך עדיין לא נשלחו למטבח/בר.
            מה תרצה לעשות?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogAction
            onClick={handleSendAndExit}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 ml-2" />
            שלח למטבח ויציאה
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onExitWithoutSending}
            variant="outline"
          >
            יציאה ללא שליחה
          </AlertDialogAction>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}