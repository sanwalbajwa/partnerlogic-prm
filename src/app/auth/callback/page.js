// src/app/auth/callback/page.js
'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('=== Auth Callback Debug ===')
        console.log('Full URL:', window.location.href)
        console.log('Hash:', window.location.hash)
        console.log('Search params:', window.location.search)

        // Get the 'next' parameter
        const next = searchParams.get('next') || '/auth/set-password'
        console.log('Next parameter:', next)

        // Check if there's a hash in the URL (for invite tokens)
        const hash = window.location.hash
        if (hash) {
          console.log('Found hash:', hash)
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const type = hashParams.get('type')
          const errorCode = hashParams.get('error')
          const errorDescription = hashParams.get('error_description')

          console.log('Hash params:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            type,
            errorCode,
            errorDescription
          })

          // Check for errors in hash
          if (errorCode) {
            console.error('Error in hash:', errorCode, errorDescription)
            setError(errorDescription || errorCode)
            setDebugInfo(`Error: ${errorCode} - ${errorDescription}`)
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }

          if (accessToken && refreshToken) {
            console.log('Setting session from tokens...')
            
            // Set the session from the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (sessionError) {
              console.error('Session error:', sessionError)
              setError('Failed to authenticate. Please try again.')
              setDebugInfo(`Session Error: ${sessionError.message}`)
              setTimeout(() => router.push('/auth/login'), 3000)
              return
            }

            console.log('Session set successfully:', sessionData)

            // Verify the session was set
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (userError || !user) {
              console.error('Failed to get user after setting session:', userError)
              setError('Authentication failed. Please try again.')
              setDebugInfo(`User Error: ${userError?.message || 'No user found'}`)
              setTimeout(() => router.push('/auth/login'), 3000)
              return
            }

            console.log('User authenticated:', user.email)
            console.log('Redirecting to:', next)

            // Redirect to set password page
            router.push(next)
            return
          }
        }

        // If no hash, check for code parameter (OAuth flow)
        const code = searchParams.get('code')
        if (code) {
          console.log('Exchange code for session...')
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (sessionError) {
            console.error('Code exchange error:', sessionError)
            setError('Failed to authenticate. Please try again.')
            setDebugInfo(`Code Exchange Error: ${sessionError.message}`)
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }

          console.log('Session from code:', sessionData)
          router.push(next)
          return
        }

        // No hash and no code - check if already authenticated
        const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
        
        if (sessionCheckError) {
          console.error('Session check error:', sessionCheckError)
          setError('Failed to check authentication status.')
          setDebugInfo(`Session Check Error: ${sessionCheckError.message}`)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (session) {
          console.log('Already has session, redirecting to:', next)
          router.push(next)
        } else {
          console.log('No session found, redirecting to login')
          setError('No authentication data found.')
          setDebugInfo('No hash, code, or existing session found')
          setTimeout(() => router.push('/auth/login'), 3000)
        }

      } catch (err) {
        console.error('Callback error:', err)
        setError('An unexpected error occurred.')
        setDebugInfo(`Unexpected Error: ${err.message}`)
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    handleCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full shadow-lg mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {error ? 'Authentication Failed' : 'Authenticating...'}
          </h2>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-center font-medium">{error}</p>
            {debugInfo && (
              <p className="text-red-600 text-xs text-center mt-2 font-mono">{debugInfo}</p>
            )}
            <p className="text-red-600 text-sm text-center mt-3">Redirecting to login...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 text-center">
                Please wait while we authenticate your account...
              </p>
              <p className="text-gray-400 text-xs text-center">
                This may take a few seconds
              </p>
            </div>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-mono break-all">
              URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}