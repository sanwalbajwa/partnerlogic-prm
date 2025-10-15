// src/lib/supabase/server.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => {
  return createRouteHandlerClient({ cookies })
}