import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { runMigration } from '@/utils/migrateData'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function MigrateData() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigration = async () => {
    setLoading(true)
    setSuccess(null)
    setError(null)

    try {
      const result = await runMigration()
      setSuccess(result.success)
      if (!result.success && result.error) {
        const errorMessage = typeof result.error === 'object' && result.error !== null
          ? (result.error as any).message || JSON.stringify(result.error)
          : String(result.error)
        setError(errorMessage)
      }
    } catch (err) {
      setSuccess(false)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Migrate Menu Data</CardTitle>
          <CardDescription>
            Import menu data from giggsi_menu.json into Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Clear existing menu data</li>
              <li>Import all categories with translations</li>
              <li>Import all menu items with Hebrew content</li>
              <li>Set up proper relationships and ordering</li>
            </ul>
          </div>

          <Button 
            onClick={handleMigration} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Migrating...' : 'Start Migration'}
          </Button>

          {success === true && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>Migration completed successfully!</span>
            </div>
          )}

          {success === false && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Migration failed</span>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}