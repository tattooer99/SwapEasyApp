export interface User {
  id: number
  telegram_id: string
  name: string
  username?: string | null
  region?: string | null
  rating?: number
  successful_exchanges?: number
  created_at?: string
}

export interface Case {
  id: number
  user_id: number
  title: string
  item_type: ItemType
  description: string
  price_category: PriceCategory
  photo1?: string
  photo2?: string
  photo3?: string
  created_at?: string
  owner?: User
}

export type ItemType = 
  | 'Дитячий світ'
  | 'Авто'
  | 'Тварини'
  | 'Дім і сад'
  | 'Електроніка'
  | 'Одяг'
  | 'Послуги'

export type PriceCategory =
  | '0-100 грн'
  | '100-500 грн'
  | '500-1000 грн'
  | '1000-5000 грн'
  | '5000 грн і більше'

export interface Interest {
  id: number
  user_id: number
  item_type: ItemType
  price_category: PriceCategory
  created_at?: string
}

export interface Like {
  id: number
  user_id: number
  item_id: number
  created_at?: string
}

export interface ExchangeOffer {
  id: number
  from_user_id: number
  to_user_id: number
  offered_item_id: number
  requested_item_id: number
  status: 'pending' | 'accepted' | 'declined'
  created_at?: string
  offered_item?: Case
  requested_item?: Case
  from_user?: User
  to_user?: User
}

export interface MutualLikeNotification {
  id: number
  user1_id: number
  user2_id: number
  user1_item_id: number
  user2_item_id: number
  created_at?: string
  user1_item?: Case
  user2_item?: Case
  user1?: User
  user2?: User
}

export interface Message {
  id: number
  from_user_id: number
  to_user_id: number
  message_text: string
  is_read: boolean
  created_at?: string
  from_user?: User
  to_user?: User
}

export const ITEM_TYPES: { value: ItemType; emoji: string }[] = [
  { value: 'Дитячий світ', emoji: '🧸' },
  { value: 'Авто', emoji: '🚗' },
  { value: 'Тварини', emoji: '🐶' },
  { value: 'Дім і сад', emoji: '🏡' },
  { value: 'Електроніка', emoji: '📱' },
  { value: 'Одяг', emoji: '👗' },
  { value: 'Послуги', emoji: '🛠' },
]

export const PRICE_CATEGORIES: PriceCategory[] = [
  '0-100 грн',
  '100-500 грн',
  '500-1000 грн',
  '1000-5000 грн',
  '5000 грн і більше',
]

export const REGIONS = [
  'Київська',
  'Львівська',
  'Одеська',
  'Дніпропетровська',
  'Харківська',
  'Запорізька',
  'Вінницька',
  'Житомирська',
  'Івано-Франківська',
  'Тернопільська',
  'Хмельницька',
  'Черкаська',
  'Чернівецька',
  'Полтавська',
  'Сумська',
  'Рівненська',
  'Херсонська',
  'Миколаївська',
  'Кіровоградська',
  'Луганська',
  'Донецька',
  'Волинська',
  'Закарпатська',
  'Чернігівська',
]

