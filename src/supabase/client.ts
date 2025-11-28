import { createClient } from '@supabase/supabase-js'

// Замените эти значения на ваши из Supabase Dashboard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Создаем клиент только если есть URL и ключ
// В противном случае создаем пустой клиент (для разработки)
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// Типы для таблиц Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          telegram_id: string
          name: string
          username: string | null
          region: string | null
          created_at: string
        }
        Insert: {
          id?: number
          telegram_id: string
          name: string
          username?: string | null
          region?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          telegram_id?: string
          name?: string
          username?: string | null
          region?: string | null
          created_at?: string
        }
      }
      my_items: {
        Row: {
          id: number
          user_id: number
          title: string
          item_type: string
          description: string
          price_category: string
          photo1: string | null
          photo2: string | null
          photo3: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          title: string
          item_type: string
          description: string
          price_category: string
          photo1?: string | null
          photo2?: string | null
          photo3?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          title?: string
          item_type?: string
          description?: string
          price_category?: string
          photo1?: string | null
          photo2?: string | null
          photo3?: string | null
          created_at?: string
        }
      }
      liked_items: {
        Row: {
          id: number
          user_id: number
          item_id: number
          title: string
          item_type: string
          description: string
          price_category: string
          photo1: string | null
          photo2: string | null
          photo3: string | null
          owner_telegram_id: string
          owner_name: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          item_id: number
          title: string
          item_type: string
          description: string
          price_category: string
          photo1?: string | null
          photo2?: string | null
          photo3?: string | null
          owner_telegram_id: string
          owner_name: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          item_id?: number
          title?: string
          item_type?: string
          description?: string
          price_category?: string
          photo1?: string | null
          photo2?: string | null
          photo3?: string | null
          owner_telegram_id?: string
          owner_name?: string
          created_at?: string
        }
      }
      interests: {
        Row: {
          id: number
          user_id: number
          item_type: string
          price_category: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          item_type: string
          price_category: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          item_type?: string
          price_category?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: number
          user_id: number
          item_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          item_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          item_id?: number
          created_at?: string
        }
      }
      exchange_offers: {
        Row: {
          id: number
          from_user_id: number
          to_user_id: number
          offered_item_id: number
          requested_item_id: number
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
        }
        Insert: {
          id?: number
          from_user_id: number
          to_user_id: number
          offered_item_id: number
          requested_item_id: number
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Update: {
          id?: number
          from_user_id?: number
          to_user_id?: number
          offered_item_id?: number
          requested_item_id?: number
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
      }
      mutual_likes_notifications: {
        Row: {
          id: number
          user1_id: number
          user2_id: number
          user1_item_id: number
          user2_item_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user1_id: number
          user2_id: number
          user1_item_id: number
          user2_item_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user1_id?: number
          user2_id?: number
          user1_item_id?: number
          user2_item_id?: number
          created_at?: string
        }
      }
    }
  }
}

