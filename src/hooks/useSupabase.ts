import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import { useTelegram } from './useTelegram'
import type { User, Case, Interest, ExchangeOffer, MutualLikeNotification, Message } from '../types'

export function useSupabase() {
  const { user } = useTelegram()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем, настроен ли Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase не настроен. Проверьте переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
      // В режиме разработки создаем мок-пользователя
      if (import.meta.env.DEV && user) {
        setCurrentUser({
          id: 1,
          telegram_id: user.id.toString(),
          name: user.first_name,
          username: user.username || undefined,
          region: undefined,
          created_at: new Date().toISOString(),
        } as User)
      }
      setLoading(false)
      return
    }

    if (user) {
      initializeUser()
    } else {
      // Если пользователя нет (разработка), создаем мок-пользователя для тестирования
      if (import.meta.env.DEV) {
        console.log('Режим разработки: создаем тестового пользователя')
        setCurrentUser({
          id: 1,
          telegram_id: '123456789',
          name: 'Тестовий користувач',
          username: 'testuser',
          region: undefined, // undefined чтобы показать форму выбора региона
          created_at: new Date().toISOString(),
        } as User)
      }
      setLoading(false)
    }
  }, [user])

  async function initializeUser() {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Проверяем, существует ли пользователь
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', user.id.toString())
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Если это не ошибка "не найдено", пробуем создать пользователя
        console.warn('Ошибка при поиске пользователя:', fetchError)
        // Продолжаем создание нового пользователя
      }

      if (existingUser) {
        console.log('Found existing user:', existingUser)
        setCurrentUser(existingUser as User)
        setLoading(false)
        return
      }

      // Создаем нового пользователя
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: user.id.toString(),
          name: user.first_name,
          username: user.username || null,
        })
        .select()
        .single()

      if (createError) {
        console.error('Ошибка при создании пользователя:', createError)
        // Продолжаем работу даже если не удалось создать пользователя
      } else {
        console.log('Created new user:', newUser)
        setCurrentUser(newUser as User)
      }
    } catch (error) {
      console.error('Error initializing user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRegion(region: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    // В режиме разработки без реального пользователя Telegram - работаем локально
    if (import.meta.env.DEV && !user) {
      if (currentUser) {
        setCurrentUser({ ...currentUser, region } as User)
      } else {
        // Создаем мок-пользователя с регионом
        const mockUser = {
          id: 1,
          telegram_id: '123456789',
          name: 'Тестовий користувач',
          username: 'testuser',
          region: region,
          created_at: new Date().toISOString(),
        } as User
        setCurrentUser(mockUser)
      }
      return
    }
    
    // Если Supabase не настроен - просто обновляем локально
    if (!supabaseUrl) {
      if (currentUser) {
        setCurrentUser({ ...currentUser, region } as User)
      } else {
        // Создаем мок-пользователя с регионом
        const mockUser = {
          id: 1,
          telegram_id: user?.id?.toString() || '123456789',
          name: user?.first_name || 'Тестовий користувач',
          username: user?.username || 'testuser',
          region: region,
          created_at: new Date().toISOString(),
        } as User
        setCurrentUser(mockUser)
      }
      return
    }

    // Если Supabase настроен, но нет currentUser - создаем пользователя
    if (!currentUser) {
      if (!user) {
        throw new Error('User not initialized')
      }
      
      // Создаем нового пользователя с регионом
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: user.id.toString(),
          name: user.first_name,
          username: user.username || null,
          region: region,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        throw new Error(`Помилка створення користувача: ${createError.message || 'Невідома помилка'}`)
      }
      if (newUser) {
        setCurrentUser(newUser)
        return
      }
    }

    // Обновляем регион существующего пользователя
    // Используем telegram_id вместо id, так как id может быть неверным в режиме разработки
    if (!currentUser) {
      throw new Error('User not initialized')
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({ region })
      .eq('telegram_id', currentUser.telegram_id)
      .select()
      .single()

    if (error) {
      // Если пользователь не найден по telegram_id, пробуем создать нового
      if (error.code === 'PGRST116' && user) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            telegram_id: user.id.toString(),
            name: user.first_name,
            username: user.username || null,
            region: region,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          throw new Error(`Помилка створення користувача: ${createError.message || 'Невідома помилка'}`)
        }
        if (newUser) {
          setCurrentUser(newUser)
          return
        }
      }
      // Улучшенная обработка ошибок
      const errorMessage = error.message || error.code || 'Невідома помилка'
      console.error('Error updating region:', error)
      throw new Error(`Помилка оновлення регіону: ${errorMessage}`)
    }
    
    if (data) {
      setCurrentUser(data)
    } else {
      // Если data нет, обновляем локально
      setCurrentUser({ ...currentUser, region } as User)
    }
  }

  async function createCase(caseData: {
    title: string
    item_type: string
    description: string
    price_category: string
    photo1?: string | null
    photo2?: string | null
    photo3?: string | null
  }): Promise<Case> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    // В режиме разработки без Supabase возвращаем мок-кейс
    if (!supabaseUrl && import.meta.env.DEV) {
      console.warn('Режим разработки: Supabase не настроен, возвращаем тестовый кейс')
      return {
        id: Date.now(),
        user_id: currentUser?.id || 1,
        ...caseData,
        created_at: new Date().toISOString(),
      } as Case
    }

    if (!currentUser) {
      // В режиме разработки создаем кейс с мок-пользователем
      if (import.meta.env.DEV) {
        console.warn('Режим разработки: создаем кейс без реального пользователя')
        return {
          id: Date.now(),
          user_id: 1,
          ...caseData,
          created_at: new Date().toISOString(),
        } as Case
      }
      throw new Error('User not initialized')
    }

    if (!supabaseUrl) {
      throw new Error('Supabase не настроен. Налаштуйте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY')
    }

    // Подготавливаем данные для вставки - явно указываем null для отсутствующих фото
    const insertData = {
      user_id: currentUser.id,
      title: caseData.title,
      item_type: caseData.item_type,
      description: caseData.description,
      price_category: caseData.price_category,
      photo1: caseData.photo1 || null,
      photo2: caseData.photo2 || null,
      photo3: caseData.photo3 || null,
    }
    
    console.log('createCase: inserting case with photos:', {
      photo1: insertData.photo1 ? 'exists' : 'null',
      photo2: insertData.photo2 ? 'exists' : 'null',
      photo3: insertData.photo3 ? 'exists' : 'null'
    })

    const { data, error } = await supabase
      .from('my_items')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('createCase: error inserting case:', error)
      throw error
    }
    
    console.log('createCase: case created successfully:', data)
    return data as Case
  }

  async function getMyCases(): Promise<Case[]> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('Supabase не настроен, повертаємо порожній список')
      return []
    }

    // Получаем telegram_id из Telegram WebApp или из currentUser
    const telegramId = user?.id?.toString() || currentUser?.telegram_id

    if (!telegramId) {
      console.warn('getMyCases: no telegram_id available, user:', user, 'currentUser:', currentUser)
      return []
    }

    console.log('getMyCases: searching by telegram_id:', telegramId)

    // Сначала находим пользователя по telegram_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single()

    if (userError) {
      console.error('getMyCases: error finding user:', userError)
      return []
    }

    if (!userData) {
      console.warn('getMyCases: user not found in database for telegram_id:', telegramId)
      return []
    }

    const userId = userData.id
    console.log('getMyCases: found user_id:', userId, 'for telegram_id:', telegramId)

    // Обновляем currentUser если id не совпадает
    if (!currentUser || currentUser.id !== userId) {
      console.log('getMyCases: updating currentUser with correct id')
      const { data: fullUserData } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single()
      
      if (fullUserData) {
        setCurrentUser(fullUserData as User)
      }
    }

    // Получаем кейсы по найденному user_id - явно указываем все поля фото
    const { data, error } = await supabase
      .from('my_items')
      .select('id, user_id, title, item_type, description, price_category, photo1, photo2, photo3, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching my cases:', error)
      return []
    }

    console.log('getMyCases: found cases:', data?.length || 0)
    // Логируем детали каждого кейса
    if (data && data.length > 0) {
      data.forEach((item: any) => {
        const photoCount = [item.photo1, item.photo2, item.photo3].filter(p => p != null && p !== '').length
        console.log(`Case ${item.id} (${item.title}): ${photoCount} photos`, {
          photo1: item.photo1 ? 'exists (' + item.photo1.substring(0, 50) + '...)' : 'null',
          photo2: item.photo2 ? 'exists (' + item.photo2.substring(0, 50) + '...)' : 'null',
          photo3: item.photo3 ? 'exists (' + item.photo3.substring(0, 50) + '...)' : 'null'
        })
      })
    }
    return (data || []) as Case[]
  }

  async function getLikedCases(): Promise<Case[]> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('Supabase не настроен, повертаємо порожній список')
      return []
    }

    if (!currentUser) return []

    // Получаем liked_items
    const { data: likedItems, error } = await supabase
      .from('liked_items')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching liked cases:', error)
      return []
    }

    if (!likedItems || likedItems.length === 0) return []

    // Получаем уникальные telegram_id владельцев
    const ownerTelegramIds = [...new Set(likedItems.map((item: any) => item.owner_telegram_id))]

    // Получаем информацию о владельцах
    const { data: owners } = await supabase
      .from('users')
      .select('id, telegram_id, name, username, region')
      .in('telegram_id', ownerTelegramIds)

    // Создаем мапу для быстрого поиска владельца
    const ownersMap = new Map((owners || []).map((owner: any) => [owner.telegram_id, owner]))

    // Объединяем данные
    return likedItems.map((item: any) => {
      const owner = ownersMap.get(item.owner_telegram_id)
      return {
        ...item,
        owner: owner || {
          id: 0,
          telegram_id: item.owner_telegram_id,
          name: item.owner_name || 'Невідомо',
        },
      }
    }) as Case[]
  }

  async function searchCases(filters?: {
    item_type?: string
    region?: string
  }): Promise<Case[]> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('Supabase не настроен, повертаємо порожній список')
      return []
    }

    if (!currentUser) return []

    // Сначала получаем пользователей по региону, если указан фильтр
    let userIds: number[] | null = null
    if (filters?.region) {
      const { data: usersByRegion } = await supabase
        .from('users')
        .select('id')
        .eq('region', filters.region)
      
      if (usersByRegion) {
        userIds = usersByRegion.map(u => u.id)
        if (userIds.length === 0) return []
      }
    }

    let query = supabase
      .from('my_items')
      .select(`
        *,
        users:user_id (
          id,
          telegram_id,
          name,
          username,
          region
        )
      `)
      .neq('user_id', currentUser.id)

    if (userIds) {
      query = query.in('user_id', userIds)
    }

    if (filters?.item_type) {
      query = query.eq('item_type', filters.item_type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((item: any) => ({
      ...item,
      owner: Array.isArray(item.users) ? item.users[0] : item.users,
    })) as Case[]
  }

  async function likeCase(itemId: number, caseData: Case): Promise<void> {
    if (!currentUser) throw new Error('User not initialized')

    // Добавляем лайк
    const { error: likeError } = await supabase
      .from('likes')
      .insert({
        user_id: currentUser.id,
        item_id: itemId,
      })

    if (likeError && likeError.code !== '23505') {
      // Игнорируем ошибку дублирования (UNIQUE constraint)
      throw likeError
    }

    // Добавляем в liked_items
    const { error: likedError } = await supabase
      .from('liked_items')
      .insert({
        user_id: currentUser.id,
        item_id: itemId,
        title: caseData.title,
        item_type: caseData.item_type,
        description: caseData.description,
        price_category: caseData.price_category,
        photo1: caseData.photo1,
        photo2: caseData.photo2,
        photo3: caseData.photo3,
        owner_telegram_id: caseData.owner?.telegram_id || '',
        owner_name: caseData.owner?.name || '',
      })

    if (likedError && likedError.code !== '23505') {
      throw likedError
    }

    // Проверяем взаимный лайк
    await checkMutualLike(itemId, caseData)
  }

  async function checkMutualLike(itemId: number, caseData: Case): Promise<void> {
    if (!currentUser || !caseData.owner) return

    // Проверяем, лайкнул ли владелец что-то у текущего пользователя
    const { data: myCases } = await supabase
      .from('my_items')
      .select('id')
      .eq('user_id', currentUser.id)

    if (!myCases || myCases.length === 0) return

    const myCaseIds = myCases.map(c => c.id)

    const { data: ownerLikes } = await supabase
      .from('likes')
      .select('item_id')
      .eq('user_id', caseData.owner.id)
      .in('item_id', myCaseIds)

    if (ownerLikes && ownerLikes.length > 0) {
      // Взаимный лайк! Создаем уведомление
      const mutualItemId = ownerLikes[0].item_id

      const { error } = await supabase
        .from('mutual_likes_notifications')
        .insert({
          user1_id: currentUser.id,
          user2_id: caseData.owner.id,
          user1_item_id: mutualItemId,
          user2_item_id: itemId,
        })

      // Игнорируем ошибку дублирования
      if (error && error.code !== '23505') {
        console.error('Error creating mutual like notification:', error)
      }
    }
  }

  async function createExchangeOffer(
    toUserId: number,
    offeredItemId: number,
    requestedItemId: number
  ): Promise<ExchangeOffer> {
    if (!currentUser) throw new Error('User not initialized')

    const { data, error } = await supabase
      .from('exchange_offers')
      .insert({
        from_user_id: currentUser.id,
        to_user_id: toUserId,
        offered_item_id: offeredItemId,
        requested_item_id: requestedItemId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data as ExchangeOffer
  }

  async function getNotifications(): Promise<{
    mutualLikes: MutualLikeNotification[]
    exchangeOffers: ExchangeOffer[]
  }> {
    if (!currentUser) return { mutualLikes: [], exchangeOffers: [] }

    const [mutualLikesResult, exchangeOffersResult] = await Promise.all([
      supabase
        .from('mutual_likes_notifications')
        .select(`
          *,
          user1:user1_id (*),
          user2:user2_id (*),
          user1_item:user1_item_id (*),
          user2_item:user2_item_id (*)
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('exchange_offers')
        .select(`
          *,
          from_user:from_user_id (*),
          to_user:to_user_id (*),
          offered_item:offered_item_id (*),
          requested_item:requested_item_id (*)
        `)
        .eq('to_user_id', currentUser.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])

    return {
      mutualLikes: (mutualLikesResult.data || []) as MutualLikeNotification[],
      exchangeOffers: (exchangeOffersResult.data || []) as ExchangeOffer[],
    }
  }

  async function respondToExchangeOffer(
    offerId: number,
    status: 'accepted' | 'declined'
  ): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Supabase не настроен')
    }

    // Сначала получаем информацию об обмене
    const { data: offer, error: fetchError } = await supabase
      .from('exchange_offers')
      .select('from_user_id, to_user_id')
      .eq('id', offerId)
      .single()

    if (fetchError) throw fetchError
    if (!offer) throw new Error('Обмін не знайдено')

    // Обновляем статус обмена
    const { error } = await supabase
      .from('exchange_offers')
      .update({ status })
      .eq('id', offerId)

    if (error) throw error

    // Если обмен принят, обновляем рейтинг обоих пользователей
    if (status === 'accepted') {
      // Получаем текущие значения рейтинга для обоих пользователей
      const [fromUserResult, toUserResult] = await Promise.all([
        supabase.from('users').select('rating, successful_exchanges').eq('id', offer.from_user_id).single(),
        supabase.from('users').select('rating, successful_exchanges').eq('id', offer.to_user_id).single(),
      ])

      // Обновляем рейтинг для обоих пользователей
      if (fromUserResult.data) {
        await supabase
          .from('users')
          .update({
            rating: (fromUserResult.data.rating || 0) + 1,
            successful_exchanges: (fromUserResult.data.successful_exchanges || 0) + 1,
          })
          .eq('id', offer.from_user_id)
      }

      if (toUserResult.data) {
        await supabase
          .from('users')
          .update({
            rating: (toUserResult.data.rating || 0) + 1,
            successful_exchanges: (toUserResult.data.successful_exchanges || 0) + 1,
          })
          .eq('id', offer.to_user_id)
      }
    }
  }

  async function addInterest(itemType: string, priceCategory: string): Promise<Interest> {
    if (!currentUser) throw new Error('User not initialized')

    const { data, error } = await supabase
      .from('interests')
      .insert({
        user_id: currentUser.id,
        item_type: itemType,
        price_category: priceCategory,
      })
      .select()
      .single()

    if (error) throw error
    return data as Interest
  }

  async function getInterests(): Promise<Interest[]> {
    if (!currentUser) return []

    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Interest[]
  }

  async function deleteInterest(interestId: number): Promise<void> {
    const { error } = await supabase
      .from('interests')
      .delete()
      .eq('id', interestId)

    if (error) throw error
  }

  async function updateCase(
    caseId: number,
    caseData: {
      title?: string
      item_type?: string
      description?: string
      price_category?: string
      photo1?: string | null
      photo2?: string | null
      photo3?: string | null
    }
  ): Promise<Case> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    if (!supabaseUrl && import.meta.env.DEV) {
      // В режиме разработки возвращаем обновленный кейс
      console.warn('Режим разработки: обновление кейса локально')
      const myCases = await getMyCases()
      const updatedCase = myCases.find(c => c.id === caseId)
      if (updatedCase) {
        return { ...updatedCase, ...caseData } as Case
      }
      throw new Error('Кейс не знайдено')
    }

    if (!currentUser) {
      throw new Error('User not initialized')
    }

    if (!supabaseUrl) {
      throw new Error('Supabase не настроен')
    }

    // Подготавливаем данные для обновления - явно указываем null для отсутствующих фото
    const updateData: {
      title?: string
      item_type?: string
      description?: string
      price_category?: string
      photo1?: string | null
      photo2?: string | null
      photo3?: string | null
    } = {}
    
    if (caseData.title !== undefined) updateData.title = caseData.title
    if (caseData.item_type !== undefined) updateData.item_type = caseData.item_type
    if (caseData.description !== undefined) updateData.description = caseData.description
    if (caseData.price_category !== undefined) updateData.price_category = caseData.price_category
    if (caseData.photo1 !== undefined) updateData.photo1 = caseData.photo1 || null
    if (caseData.photo2 !== undefined) updateData.photo2 = caseData.photo2 || null
    if (caseData.photo3 !== undefined) updateData.photo3 = caseData.photo3 || null
    
    console.log('updateCase: updating case with photos:', {
      photo1: updateData.photo1 ? 'exists' : 'null',
      photo2: updateData.photo2 ? 'exists' : 'null',
      photo3: updateData.photo3 ? 'exists' : 'null'
    })

    const { data, error } = await supabase
      .from('my_items')
      .update(updateData)
      .eq('id', caseId)
      .eq('user_id', currentUser.id)
      .select()
      .single()

    if (error) {
      console.error('updateCase: error updating case:', error)
      throw new Error(`Помилка оновлення кейсу: ${error.message || 'Невідома помилка'}`)
    }

    if (!data) {
      throw new Error('Кейс не знайдено або немає доступу')
    }
    
    console.log('updateCase: case updated successfully:', data)

    return data as Case
  }

  async function deleteCase(caseId: number): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    if (!supabaseUrl && import.meta.env.DEV) {
      // В режиме разработки просто возвращаемся
      console.warn('Режим разработки: удаление кейса локально')
      return
    }

    if (!currentUser) {
      throw new Error('User not initialized')
    }

    if (!supabaseUrl) {
      throw new Error('Supabase не настроен')
    }

    // Удаляем кейс (каскадное удаление обработает связанные записи)
    const { error } = await supabase
      .from('my_items')
      .delete()
      .eq('id', caseId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error deleting case:', error)
      throw new Error(`Помилка видалення кейсу: ${error.message || 'Невідома помилка'}`)
    }
  }

  async function getUserCases(userId: number): Promise<{ cases: Case[], user: User }> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    if (!supabaseUrl && import.meta.env.DEV) {
      console.warn('Режим разработки: возвращаем пустой список')
      return { cases: [], user: {} as User }
    }

    if (!supabaseUrl) {
      throw new Error('Supabase не настроен')
    }

    // Получаем информацию о пользователе
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      throw new Error(`Помилка завантаження користувача: ${userError.message || 'Невідома помилка'}`)
    }

    if (!userData) {
      throw new Error('Користувач не знайдено')
    }

    // Получаем кейсы пользователя
    const { data: casesData, error: casesError } = await supabase
      .from('my_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (casesError) {
      console.error('Error fetching user cases:', casesError)
      throw new Error(`Помилка завантаження кейсів: ${casesError.message || 'Невідома помилка'}`)
    }

    return {
      cases: (casesData || []) as Case[],
      user: userData as User,
    }
  }

  async function sendMessage(toUserId: number, messageText: string): Promise<Message> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Supabase не настроен')
    }

    if (!currentUser) {
      throw new Error('User not initialized')
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        from_user_id: currentUser.id,
        to_user_id: toUserId,
        message_text: messageText,
        is_read: false,
      })
      .select(`
        *,
        from_user:from_user_id (*),
        to_user:to_user_id (*)
      `)
      .single()

    if (error) throw error
    return data as Message
  }

  async function getMessages(otherUserId: number): Promise<Message[]> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('Supabase не настроен, повертаємо порожній список')
      return []
    }

    if (!currentUser) return []

    // Получаем все сообщения между текущим пользователем и другим пользователем
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        from_user:from_user_id (*),
        to_user:to_user_id (*)
      `)
      .or(`and(from_user_id.eq.${currentUser.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    // Помечаем входящие сообщения как прочитанные
    const unreadMessages = (data || []).filter(
      (msg: Message) => msg.to_user_id === currentUser.id && !msg.is_read
    )

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((msg: Message) => msg.id)
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds)
    }

    return (data || []) as Message[]
  }

  async function getChats(): Promise<{ user: User; lastMessage?: Message; unreadCount: number }[]> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('Supabase не настроен, повертаємо порожній список')
      return []
    }

    if (!currentUser) return []

    // Получаем все уникальные пользователи, с которыми есть переписка
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        from_user:from_user_id (*),
        to_user:to_user_id (*)
      `)
      .or(`from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching chats:', error)
      return []
    }

    // Группируем по пользователям
    const chatsMap = new Map<number, { user: User; messages: Message[] }>()

    ;(messages || []).forEach((msg: Message) => {
      const otherUser = msg.from_user_id === currentUser.id ? msg.to_user : msg.from_user
      if (!otherUser) return

      if (!chatsMap.has(otherUser.id)) {
        chatsMap.set(otherUser.id, { user: otherUser, messages: [] })
      }
      chatsMap.get(otherUser.id)!.messages.push(msg as Message)
    })

    // Преобразуем в массив с последним сообщением и количеством непрочитанных
    return Array.from(chatsMap.values()).map((chat) => {
      const sortedMessages = chat.messages.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
      const lastMessage = sortedMessages[0]
      const unreadCount = chat.messages.filter(
        (msg) => msg.to_user_id === currentUser.id && !msg.is_read
      ).length

      return {
        user: chat.user,
        lastMessage,
        unreadCount,
      }
    })
  }

  async function getExchangeHistory(): Promise<ExchangeOffer[]> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('Supabase не настроен, повертаємо порожній список')
      return []
    }

    if (!currentUser) return []

    // Получаем все завершенные обмены (accepted), где пользователь участвовал
    const { data, error } = await supabase
      .from('exchange_offers')
      .select(`
        *,
        from_user:from_user_id (*),
        to_user:to_user_id (*),
        offered_item:offered_item_id (*),
        requested_item:requested_item_id (*)
      `)
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching exchange history:', error)
      return []
    }

    return (data || []) as ExchangeOffer[]
  }

  async function getUserRating(userId: number): Promise<{ rating: number; successful_exchanges: number }> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      return { rating: 0, successful_exchanges: 0 }
    }

    const { data, error } = await supabase
      .from('users')
      .select('rating, successful_exchanges')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user rating:', error)
      return { rating: 0, successful_exchanges: 0 }
    }

    return {
      rating: data?.rating || 0,
      successful_exchanges: data?.successful_exchanges || 0,
    }
  }

  return {
    currentUser,
    loading,
    updateUserRegion,
    createCase,
    getMyCases,
    getLikedCases,
    searchCases,
    likeCase,
    createExchangeOffer,
    getNotifications,
    respondToExchangeOffer,
    addInterest,
    getInterests,
    deleteInterest,
    updateCase,
    deleteCase,
    getUserCases,
    sendMessage,
    getMessages,
    getChats,
    getExchangeHistory,
    getUserRating,
  }
}

