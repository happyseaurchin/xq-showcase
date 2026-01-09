import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Artifact {
  id: string
  slug: string
  title: string
  description: string | null
  jsx_code: string
  category: string
  tags: string[]
  featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}
