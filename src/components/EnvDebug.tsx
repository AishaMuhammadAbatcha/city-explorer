import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Environment Variables Debug Component
 * Displays the status of required environment variables
 * Only shows in development or when URL param ?debug=env is present
 */
export function EnvDebug() {
  const [show, setShow] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return import.meta.env.DEV || params.get('debug') === 'env';
  });

  if (!show) return null;

  const envVars = {
    'Google Maps API Key': {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      required: true,
      description: 'Required for maps, places search, and AI recommendations'
    },
    'Google Maps Map ID': {
      key: 'VITE_MAP_ID',
      value: import.meta.env.VITE_MAP_ID,
      required: true,
      description: 'Required for custom styled maps'
    },
    'Supabase URL': {
      key: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL,
      required: true,
      description: 'Required for database and authentication'
    },
    'Supabase Anon Key': {
      key: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
      required: true,
      description: 'Required for database and authentication'
    }
  };

  const allConfigured = Object.values(envVars).every(v => v.value);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Environment Variables</CardTitle>
            <button
              onClick={() => setShow(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <CardDescription>
            {allConfigured ? (
              <span className="text-green-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                All variables configured
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Missing required variables
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(envVars).map(([name, config]) => (
            <div key={config.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                {config.value ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {config.description}
              </div>
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">
                {config.key}: {config.value ? '✓ Set' : '✗ Not Set'}
              </div>
            </div>
          ))}

          <div className="pt-3 border-t space-y-2">
            <div className="text-sm">
              <strong>Environment:</strong>{' '}
              <Badge variant={import.meta.env.PROD ? 'default' : 'secondary'}>
                {import.meta.env.MODE}
              </Badge>
            </div>
            {!allConfigured && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <strong>Action Required:</strong> Set missing environment variables in Vercel and redeploy.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnvDebug;
