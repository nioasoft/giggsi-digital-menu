import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { runFullMigration } from '@/utils/fullMigration'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function FullMigrate() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigration = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const migrationResult = await runFullMigration()
      setResult(migrationResult)
      if (!migrationResult.success) {
        setError('Migration had some errors. Check console for details.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Full Menu Migration</CardTitle>
          <CardDescription>
            Import complete menu data (all 172 items) from giggsi_menu.json
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will import:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>All 18 categories</li>
              <li>All 172 menu items with Hebrew names and descriptions</li>
              <li>Prices and allergen detection</li>
              <li>Proper display ordering</li>
            </ul>
          </div>

          <Button 
            onClick={handleMigration} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Migrating...' : 'Start Full Migration'}
          </Button>

          {result?.success === true && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Migration completed successfully!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Inserted: {result.inserted} items
                {result.errors > 0 && `, Errors: ${result.errors}`}
              </p>
            </div>
          )}

          {error && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Migration error</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}