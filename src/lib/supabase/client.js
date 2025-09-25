// src/lib/supabase/client.js
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()

// For components that need the client
export const supabase = createClient()