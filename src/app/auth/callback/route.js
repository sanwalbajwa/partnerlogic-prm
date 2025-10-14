// src/app/auth/callback/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth error:', error, error_description)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (err) {
      console.error('Error exchanging code for session:', err)
      return NextResponse.redirect(new URL('/auth/login?error=Failed to authenticate', request.url))
    }
  }

  // Redirect to the 'next' URL or default to dashboard
  return NextResponse.redirect(new URL(next, request.url))
}