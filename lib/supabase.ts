import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type FanProfile = {
  id: string
  display_name: string
  email: string
  location: string | null
  is_admin: boolean
  created_at: string
}

export type NewsPost = {
  id: string
  title: string | null
  body: string
  image_url: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  created_at: string
}

export type ChatMessage = {
  id: string
  fan_id: string
  content: string
  media_url: string | null
  media_type: 'image' | 'video' | null
  created_at: string
  fans: { display_name: string } | null
}

export type CanalPost = {
  id: string
  body: string
  media_url: string | null
  media_type: 'image' | 'video' | null
  created_at: string
}

export const REACTION_EMOJIS = ['❤️', '🔥', '👏', '🐺'] as const
export type ReactionEmoji = typeof REACTION_EMOJIS[number]
