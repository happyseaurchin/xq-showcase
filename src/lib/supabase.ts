import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Artifact {
  id: string
  slug: string
  title: string
  description: string | null
  jsx_code: string | null
  embed_url: string | null
  category: string
  tags: string[]
  featured: boolean
  display_order: number
  artifact_type: 'standalone' | 'slideshow' | 'visualization' | 'companion'
  parent_id: string | null
  created_at: string
  updated_at: string
}
