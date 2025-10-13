import { supabase, type Tables } from '@/lib/supabase'

export type Event = Tables<'events'>
export type EventInsert = {
  business_id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  location: string
  image_url?: string
  price?: number
  capacity?: number
  category: string
}

export class EventsService {
  // Get events for a specific business
  static async getBusinessEvents(businessId: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('business_id', businessId)
      .order('start_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return data
  }

  // Get a single event by ID
  static async getEvent(eventId: string) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        businesses (
          name,
          address,
          phone
        )
      `)
      .eq('id', eventId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch event: ${error.message}`)
    }

    return data
  }

  // Create a new event
  static async createEvent(event: EventInsert) {
    const { data, error } = await supabase
      .from('events')
      .insert(event as any)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`)
    }

    return data
  }

  // Update an event
  static async updateEvent(eventId: string, updates: Partial<EventInsert>) {
    const { data, error } = await supabase
      .from('events')
      .update(updates as any)
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data
  }

  // Delete an event
  static async deleteEvent(eventId: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`)
    }
  }

  // Get all events (for individuals to browse)
  static async getAllEvents(options?: {
    city?: string
    category?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('events')
      .select(`
        *,
        businesses (
          name,
          address,
          city
        )
      `)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })

    if (options?.city) {
      query = query.eq('businesses.city', options.city)
    }

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return data
  }
}
