import React from 'react'

export default function EnvCheck() {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Check</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Variable</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px' }}>VITE_SUPABASE_URL</td>
            <td style={{ padding: '10px', color: envVars.VITE_SUPABASE_URL ? 'green' : 'red' }}>
              {envVars.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </td>
            <td style={{ padding: '10px' }}>
              {envVars.VITE_SUPABASE_URL || 'undefined'}
            </td>
          </tr>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <td style={{ padding: '10px' }}>VITE_SUPABASE_ANON_KEY</td>
            <td style={{ padding: '10px', color: envVars.VITE_SUPABASE_ANON_KEY ? 'green' : 'red' }}>
              {envVars.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </td>
            <td style={{ padding: '10px' }}>
              {envVars.VITE_SUPABASE_ANON_KEY ? `${envVars.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px' }}>MODE</td>
            <td style={{ padding: '10px' }}>ℹ️</td>
            <td style={{ padding: '10px' }}>{envVars.MODE}</td>
          </tr>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <td style={{ padding: '10px' }}>Production Build</td>
            <td style={{ padding: '10px' }}>{envVars.PROD ? '✅' : '❌'}</td>
            <td style={{ padding: '10px' }}>{String(envVars.PROD)}</td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Troubleshooting:</h2>
        {!envVars.VITE_SUPABASE_URL && (
          <p style={{ color: 'red' }}>
            ⚠️ VITE_SUPABASE_URL is missing. Add it in Vercel Dashboard → Settings → Environment Variables
          </p>
        )}
        {!envVars.VITE_SUPABASE_ANON_KEY && (
          <p style={{ color: 'red' }}>
            ⚠️ VITE_SUPABASE_ANON_KEY is missing. Add it in Vercel Dashboard → Settings → Environment Variables
          </p>
        )}
        {envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY && (
          <p style={{ color: 'green' }}>
            ✅ All environment variables are properly configured!
          </p>
        )}
      </div>
    </div>
  )
}