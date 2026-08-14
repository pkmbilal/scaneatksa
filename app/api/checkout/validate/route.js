import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

const VALID_CHANNELS = new Set(['dine_in', 'pickup', 'delivery'])

function errorResponse(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const restaurantSlug = String(body?.restaurantSlug || '').trim()
    const channel = String(body?.channel || '').trim()
    const tableCode = String(body?.tableCode || '').trim()
    const requestedItems = Array.isArray(body?.items) ? body.items : []

    if (!restaurantSlug || !VALID_CHANNELS.has(channel)) {
      return errorResponse('Invalid checkout request.')
    }

    if (requestedItems.length === 0 || requestedItems.length > 100) {
      return errorResponse('Your cart is empty or too large.')
    }

    const normalizedItems = requestedItems.map((item) => ({
      id: item?.id,
      quantity: Number(item?.quantity),
    }))

    const hasInvalidQuantity = normalizedItems.some(
      (item) =>
        !item.id ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
    )

    if (hasInvalidQuantity) {
      return errorResponse('One or more cart quantities are invalid.')
    }

    const ids = normalizedItems.map((item) => item.id)
    if (new Set(ids.map(String)).size !== ids.length) {
      return errorResponse('Duplicate cart items are not allowed.')
    }

    const supabase = supabaseServer()
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, slug, phone, is_active, pickup_available, delivery_available')
      .eq('slug', restaurantSlug)
      .maybeSingle()

    if (restaurantError || !restaurant || restaurant.is_active === false) {
      return errorResponse('This restaurant is currently unavailable.', 404)
    }

    if (channel === 'pickup' && !restaurant.pickup_available) {
      return errorResponse('Pickup is no longer available for this restaurant.')
    }

    if (channel === 'delivery' && !restaurant.delivery_available) {
      return errorResponse('Delivery is no longer available for this restaurant.')
    }

    let tableNumber = null
    if (channel === 'dine_in') {
      if (!tableCode) return errorResponse('Please scan the table QR code again.')

      const { data: table } = await supabase
        .from('restaurant_tables')
        .select('table_number')
        .eq('restaurant_id', restaurant.id)
        .eq('code', tableCode)
        .eq('is_active', true)
        .maybeSingle()

      if (!table) return errorResponse('This table QR code is no longer active.')
      tableNumber = table.table_number
    }

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available, is_sold_out')
      .eq('restaurant_id', restaurant.id)
      .in('id', ids)

    if (menuError) return errorResponse('Unable to validate the menu right now.', 503)

    const menuById = new Map((menuItems || []).map((item) => [String(item.id), item]))
    const validatedItems = []

    for (const requestedItem of normalizedItems) {
      const menuItem = menuById.get(String(requestedItem.id))

      if (!menuItem) {
        return errorResponse('An item in your cart is no longer on the menu.')
      }

      if (menuItem.is_available === false || menuItem.is_sold_out === true) {
        return errorResponse(menuItem.name + ' is currently unavailable.')
      }

      validatedItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity: requestedItem.quantity,
      })
    }

    const total = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    return NextResponse.json({
      restaurant: {
        name: restaurant.name,
        phone: restaurant.phone,
      },
      tableNumber,
      items: validatedItems,
      total,
    })
  } catch {
    return errorResponse('Unable to validate the checkout right now.', 500)
  }
}
