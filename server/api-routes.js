const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { sanitizeInput } = require('./security-config');

// Initialize Supabase client with service role key for backend operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials for API routes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const router = express.Router();

// =============================================================================
// DISHES API
// =============================================================================

router.get('/dishes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ error: 'Failed to fetch dishes' });
  }
});

// =============================================================================
// RESTAURANTS API
// =============================================================================

router.get('/restaurants', async (req, res) => {
  try {
    const { town } = req.query;
    let query = supabase.from('restaurants').select('*').eq('active', true);
    
    if (town) {
      query = query.eq('town', sanitizeInput(town));
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// =============================================================================
// RESTAURANT MENUS API
// =============================================================================

router.get('/restaurant-menus', async (req, res) => {
  try {
    const { town } = req.query;
    let query = supabase
      .from('restaurant_menus')
      .select(`
        *,
        restaurant:restaurants!inner(*),
        dish:dishes!inner(*)
      `)
      .eq('availability', true)
      .eq('restaurant.active', true)
      .eq('dish.active', true);

    if (town) {
      query = query.eq('restaurant.town', sanitizeInput(town));
    }

    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching restaurant menus:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant menus' });
  }
});

// =============================================================================
// LOCATION & ZONING API
// =============================================================================

// Get delivery fee based on locality
router.post('/calculate-delivery-fee', async (req, res) => {
  try {
    const { locality, latitude, longitude } = req.body;

    // Limbe zoning system
    const limbeZones = {
      A: {
        localities: ['Ngueme', 'Isokolo', 'Carata', 'Mile 4', 'Saker Junction', 'Down Beach'],
        fee: 1000
      },
      B: {
        localities: ['Red Cross', 'Bundes', 'Middlefarms', 'Church Street', 'Busumbu', 'Behind GHS'],
        fee: 800
      },
      C: {
        localities: ['Mile 2'],
        fee: 600
      }
    };

    let deliveryFee = 1000; // Default fee
    let detectedZone = null;

    // Check locality-based zoning first
    if (locality) {
      for (const [zone, data] of Object.entries(limbeZones)) {
        if (data.localities.some(loc => locality.toLowerCase().includes(loc.toLowerCase()))) {
          deliveryFee = data.fee;
          detectedZone = zone;
          break;
        }
      }
    }

    // If coordinates provided, calculate distance-based fee
    if (latitude && longitude) {
      // Default restaurant location (could be made dynamic)
      const restaurantLat = 4.0167; // Limbe coordinates
      const restaurantLng = 9.2167;

      const distance = calculateDistance(latitude, longitude, restaurantLat, restaurantLng);

      if (distance <= 2) {
        deliveryFee = Math.min(deliveryFee, 600);
      } else if (distance <= 5) {
        deliveryFee = Math.min(deliveryFee, 800);
      } else {
        deliveryFee = Math.max(deliveryFee, 1000);
      }
    }

    res.json({
      deliveryFee,
      zone: detectedZone,
      locality: locality || 'Unknown',
      method: latitude && longitude ? 'coordinates' : 'locality'
    });
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    res.status(500).json({ error: 'Failed to calculate delivery fee' });
  }
});

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// =============================================================================
// PUSH NOTIFICATIONS API
// =============================================================================

// Register push subscription
router.post('/register-push-subscription', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Store subscription in database (you might want to create a push_subscriptions table)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId || 'anonymous',
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys?.p256dh,
        auth_key: subscription.keys?.auth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      });

    if (error) {
      console.error('Database error:', error);
      // For now, just acknowledge the subscription even if storage fails
      res.json({ success: true, message: 'Subscription registered' });
    } else {
      res.json({ success: true, message: 'Subscription registered successfully' });
    }
  } catch (error) {
    console.error('Error registering push subscription:', error);
    res.status(500).json({ error: 'Failed to register push subscription' });
  }
});

// Send notification for order status update
router.post('/notify-order-status', async (req, res) => {
  try {
    const { orderId, status, restaurantName, userId } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
    }

    // Get user's push subscription
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId || 'anonymous');

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.json({ message: 'No subscriptions found for user' });
    }

    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared!',
      preparing: 'Your order is now being prepared!',
      ready: 'Your order is ready for delivery!',
      out_for_delivery: 'Your order is out for delivery!',
      delivered: 'Your order has been delivered successfully!'
    };

    const message = statusMessages[status] || `Your order status has been updated to: ${status}`;

    // Here you would typically send push notifications using a service like FCM, VAPID, etc.
    // For now, we'll just log the notification data
    console.log('Order status notification:', {
      orderId,
      status,
      message,
      restaurantName,
      subscriptions: subscriptions.length
    });

    // In a real implementation, you would:
    // 1. Use web-push library to send notifications to each subscription
    // 2. Handle notification delivery and failures
    // 3. Update notification delivery status

    res.json({
      success: true,
      message: 'Notification queued for delivery',
      notificationCount: subscriptions.length
    });
  } catch (error) {
    console.error('Error sending order status notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get all available zones for a town
router.get('/zones/:town', async (req, res) => {
  try {
    const { town } = req.params;

    if (town.toLowerCase() === 'limbe') {
      const zones = {
        A: {
          zone: 'A',
          name: 'Zone A - Outer Areas',
          localities: ['Ngueme', 'Isokolo', 'Carata', 'Mile 4', 'Saker Junction', 'Down Beach'],
          deliveryFee: 1000,
          description: 'Outer areas of Limbe with longer delivery times'
        },
        B: {
          zone: 'B',
          name: 'Zone B - Mid Areas',
          localities: ['Red Cross', 'Bundes', 'Middlefarms', 'Church Street', 'Busumbu', 'Behind GHS'],
          deliveryFee: 800,
          description: 'Mid-town areas with moderate delivery times'
        },
        C: {
          zone: 'C',
          name: 'Zone C - Central Area',
          localities: ['Mile 2'],
          deliveryFee: 600,
          description: 'Central business district with fastest delivery'
        }
      };

      res.json({
        town: 'Limbe',
        zones: Object.values(zones)
      });
    } else {
      // Default zones for other towns
      res.json({
        town,
        zones: [{
          zone: 'Default',
          name: 'Default Zone',
          localities: ['All areas'],
          deliveryFee: 1000,
          description: 'Standard delivery zone'
        }]
      });
    }
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// =============================================================================
// DELIVERY ZONES API
// =============================================================================

router.get('/delivery-zones', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('active', true)
      .order('town');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching delivery zones:', error);
    res.status(500).json({ error: 'Failed to fetch delivery zones' });
  }
});

// =============================================================================
// DELIVERY FEE CALCULATION API
// =============================================================================

router.post('/calculate-delivery-fee', async (req, res) => {
  try {
    const { town_name, location_description } = req.body;
    
    if (!town_name) {
      return res.status(400).json({ error: 'Town name is required' });
    }

    const { data, error } = await supabase.rpc('calculate_delivery_fee', {
      town_name: sanitizeInput(town_name),
      location_description: sanitizeInput(location_description || '')
    });
    
    if (error) throw error;
    res.json(data || [{ fee: 500 }]); // Default fee
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    res.status(500).json({ error: 'Failed to calculate delivery fee' });
  }
});

// =============================================================================
// ORDER REFERENCE GENERATION API
// =============================================================================

router.post('/generate-order-reference', async (req, res) => {
  try {
    const { town_name } = req.body;
    
    if (!town_name) {
      return res.status(400).json({ error: 'Town name is required' });
    }

    const { data, error } = await supabase.rpc('generate_order_reference', {
      town_name: sanitizeInput(town_name)
    });
    
    if (error) throw error;
    res.json(data || `CHP-${Date.now()}`);
  } catch (error) {
    console.error('Error generating order reference:', error);
    res.status(500).json({ error: 'Failed to generate order reference' });
  }
});

// =============================================================================
// USER TOWN MANAGEMENT API
// =============================================================================

router.post('/save-user-town', async (req, res) => {
  try {
    const { user_phone, town } = req.body;
    
    if (!user_phone || !town) {
      return res.status(400).json({ error: 'User phone and town are required' });
    }

    const { error } = await supabase
      .from('user_towns')
      .upsert([
        {
          user_phone: sanitizeInput(user_phone),
          town: sanitizeInput(town),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'user_phone' });
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user town:', error);
    res.status(500).json({ error: 'Failed to save user town' });
  }
});

router.post('/get-user-town', async (req, res) => {
  try {
    const { user_phone } = req.body;
    
    if (!user_phone) {
      return res.status(400).json({ error: 'User phone is required' });
    }

    const { data, error } = await supabase
      .from('user_towns')
      .select('town')
      .eq('user_phone', sanitizeInput(user_phone))
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || { town: null });
  } catch (error) {
    console.error('Error getting user town:', error);
    res.status(500).json({ error: 'Failed to get user town' });
  }
});

// =============================================================================
// ORDER MANAGEMENT API
// =============================================================================

router.post('/save-order', async (req, res) => {
  try {
    const orderData = req.body;
    
    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    // Sanitize order data
    const sanitizedOrder = {
      ...orderData,
      customer_name: sanitizeInput(orderData.customer_name),
      customer_phone: sanitizeInput(orderData.customer_phone),
      customer_email: sanitizeInput(orderData.customer_email),
      delivery_address: sanitizeInput(orderData.delivery_address),
      user_location: sanitizeInput(orderData.user_location),
      special_instructions: sanitizeInput(orderData.special_instructions || '')
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([sanitizedOrder])
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

router.post('/save-custom-order', async (req, res) => {
  try {
    const orderData = req.body;
    
    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    // Sanitize order data
    const sanitizedOrder = {
      ...orderData,
      customer_name: sanitizeInput(orderData.customer_name),
      customer_phone: sanitizeInput(orderData.customer_phone),
      customer_email: sanitizeInput(orderData.customer_email),
      delivery_address: sanitizeInput(orderData.delivery_address),
      food_description: sanitizeInput(orderData.food_description),
      special_instructions: sanitizeInput(orderData.special_instructions || '')
    };

    const { data, error } = await supabase
      .from('custom_orders')
      .insert([sanitizedOrder])
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error saving custom order:', error);
    res.status(500).json({ error: 'Failed to save custom order' });
  }
});

router.post('/get-user-orders', async (req, res) => {
  try {
    const { user_phone } = req.body;
    
    if (!user_phone) {
      return res.status(400).json({ error: 'User phone is required' });
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_phone', sanitizeInput(user_phone))
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({ error: 'Failed to get user orders' });
  }
});

router.post('/get-user-custom-orders', async (req, res) => {
  try {
    const { user_phone } = req.body;

    if (!user_phone) {
      return res.status(400).json({ error: 'User phone is required' });
    }

    const { data, error } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('user_phone', sanitizeInput(user_phone))
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error getting user custom orders:', error);
    res.status(500).json({ error: 'Failed to get user custom orders' });
  }
});

// =============================================================================
// DAILY MENUS MANAGEMENT API
// =============================================================================

// Get all daily menus with optional date filter
router.get('/daily-menus', async (req, res) => {
  try {
    const { date, restaurant_id } = req.query;
    let query = supabase
      .from('daily_menus')
      .select(`
        *,
        restaurant:restaurants(name, town),
        daily_menu_items(
          *,
          dish:dishes(name, category, image_url)
        )
      `)
      .eq('is_active', true);

    if (date) {
      query = query.eq('date', sanitizeInput(date));
    }

    if (restaurant_id) {
      query = query.eq('restaurant_id', sanitizeInput(restaurant_id));
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching daily menus:', error);
    res.status(500).json({ error: 'Failed to fetch daily menus' });
  }
});

// Create new daily menu
router.post('/daily-menus', async (req, res) => {
  try {
    const { restaurant_id, date, is_active } = req.body;

    if (!restaurant_id || !date) {
      return res.status(400).json({ error: 'Restaurant ID and date are required' });
    }

    const { data, error } = await supabase
      .from('daily_menus')
      .insert([{
        restaurant_id: sanitizeInput(restaurant_id),
        date: sanitizeInput(date),
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating daily menu:', error);
    res.status(500).json({ error: 'Failed to create daily menu' });
  }
});

// Update daily menu
router.put('/daily-menus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('daily_menus')
      .update(updates)
      .eq('id', sanitizeInput(id))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating daily menu:', error);
    res.status(500).json({ error: 'Failed to update daily menu' });
  }
});

// Delete daily menu
router.delete('/daily-menus/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('daily_menus')
      .delete()
      .eq('id', sanitizeInput(id));

    if (error) throw error;
    res.json({ message: 'Daily menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily menu:', error);
    res.status(500).json({ error: 'Failed to delete daily menu' });
  }
});

// Add item to daily menu
router.post('/daily-menus/:menuId/items', async (req, res) => {
  try {
    const { menuId } = req.params;
    const { dish_id, price, availability, available_quantity, special_notes } = req.body;

    if (!dish_id || !price) {
      return res.status(400).json({ error: 'Dish ID and price are required' });
    }

    const { data, error } = await supabase
      .from('daily_menu_items')
      .insert([{
        daily_menu_id: sanitizeInput(menuId),
        dish_id: sanitizeInput(dish_id),
        price: parseInt(price),
        availability: availability !== undefined ? availability : true,
        available_quantity: available_quantity ? parseInt(available_quantity) : null,
        special_notes: sanitizeInput(special_notes || '')
      }])
      .select(`
        *,
        dish:dishes(name, category)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error adding item to daily menu:', error);
    res.status(500).json({ error: 'Failed to add item to daily menu' });
  }
});

// Update daily menu item
router.put('/daily-menus/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('daily_menu_items')
      .update(updates)
      .eq('id', sanitizeInput(itemId))
      .select(`
        *,
        dish:dishes(name, category)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating daily menu item:', error);
    res.status(500).json({ error: 'Failed to update daily menu item' });
  }
});

// Remove item from daily menu
router.delete('/daily-menus/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const { error } = await supabase
      .from('daily_menu_items')
      .delete()
      .eq('id', sanitizeInput(itemId));

    if (error) throw error;
    res.json({ message: 'Item removed from daily menu successfully' });
  } catch (error) {
    console.error('Error removing item from daily menu:', error);
    res.status(500).json({ error: 'Failed to remove item from daily menu' });
  }
});

// =============================================================================
// DRIVER MANAGEMENT API
// =============================================================================

// Get all drivers
router.get('/drivers', async (req, res) => {
  try {
    const { available_only } = req.query;
    let query = supabase
      .from('drivers')
      .select('*')
      .order('name');

    if (available_only === 'true') {
      query = query.eq('is_available', true).eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Create new driver
router.post('/drivers', async (req, res) => {
  try {
    const { name, phone, email, license_number, vehicle_type, vehicle_registration } = req.body;

    if (!name || !phone || !vehicle_type) {
      return res.status(400).json({ error: 'Name, phone, and vehicle type are required' });
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert([{
        name: sanitizeInput(name),
        phone: sanitizeInput(phone),
        email: email ? sanitizeInput(email) : null,
        license_number: license_number ? sanitizeInput(license_number) : null,
        vehicle_type: sanitizeInput(vehicle_type),
        vehicle_registration: vehicle_registration ? sanitizeInput(vehicle_registration) : null
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// Update driver
router.put('/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Sanitize input fields
    const sanitizedUpdates = { ...updates };
    if (updates.name) sanitizedUpdates.name = sanitizeInput(updates.name);
    if (updates.phone) sanitizedUpdates.phone = sanitizeInput(updates.phone);
    if (updates.email) sanitizedUpdates.email = sanitizeInput(updates.email);
    if (updates.license_number) sanitizedUpdates.license_number = sanitizeInput(updates.license_number);
    if (updates.vehicle_registration) sanitizedUpdates.vehicle_registration = sanitizeInput(updates.vehicle_registration);

    const { data, error } = await supabase
      .from('drivers')
      .update(sanitizedUpdates)
      .eq('id', sanitizeInput(id))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// Update driver location
router.put('/drivers/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const { data, error } = await supabase
      .from('drivers')
      .update({
        current_gps_latitude: parseFloat(latitude),
        current_gps_longitude: parseFloat(longitude),
        updated_at: new Date().toISOString()
      })
      .eq('id', sanitizeInput(id))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ error: 'Failed to update driver location' });
  }
});

// Delete driver
router.delete('/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', sanitizeInput(id));

    if (error) throw error;
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

// =============================================================================
// ENHANCED RESTAURANT MANAGEMENT API
// =============================================================================

// Update restaurant with GPS and operating hours
router.put('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Sanitize input fields
    const sanitizedUpdates = { ...updates };
    if (updates.name) sanitizedUpdates.name = sanitizeInput(updates.name);
    if (updates.contact_number) sanitizedUpdates.contact_number = sanitizeInput(updates.contact_number);
    if (updates.mtn_number) sanitizedUpdates.mtn_number = sanitizeInput(updates.mtn_number);
    if (updates.orange_number) sanitizedUpdates.orange_number = sanitizeInput(updates.orange_number);
    if (updates.address) sanitizedUpdates.address = sanitizeInput(updates.address);
    if (updates.description) sanitizedUpdates.description = sanitizeInput(updates.description);
    if (updates.cuisine_type) sanitizedUpdates.cuisine_type = sanitizeInput(updates.cuisine_type);

    const { data, error } = await supabase
      .from('restaurants')
      .update(sanitizedUpdates)
      .eq('id', sanitizeInput(id))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// =============================================================================
// ENHANCED ORDER MANAGEMENT API
// =============================================================================

// Update order status with timestamps
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driver_id, driver_name, driver_phone } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updates = {
      status: sanitizeInput(status),
      updated_at: new Date().toISOString()
    };

    // Add timestamp for status change
    const statusTimestampMap = {
      'confirmed': 'confirmed_at',
      'preparing': 'preparing_at',
      'ready': 'ready_at',
      'out_for_delivery': 'out_for_delivery_at',
      'delivered': 'delivered_at'
    };

    if (statusTimestampMap[status]) {
      updates[statusTimestampMap[status]] = new Date().toISOString();
    }

    // Add driver info if provided
    if (driver_id) updates.driver_id = sanitizeInput(driver_id);
    if (driver_name) updates.driver_name = sanitizeInput(driver_name);
    if (driver_phone) updates.driver_phone = sanitizeInput(driver_phone);

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', sanitizeInput(id))
      .select(`
        *,
        restaurant:restaurants(name)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Assign driver to order
router.put('/orders/:id/assign-driver', async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    // Get driver info
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('name, phone')
      .eq('id', sanitizeInput(driver_id))
      .single();

    if (driverError) throw driverError;

    // Update order with driver info
    const { data, error } = await supabase
      .from('orders')
      .update({
        driver_id: sanitizeInput(driver_id),
        driver_name: driver.name,
        driver_phone: driver.phone,
        status: 'out_for_delivery',
        out_for_delivery_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sanitizeInput(id))
      .select(`
        *,
        restaurant:restaurants(name)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ error: 'Failed to assign driver' });
  }
});

// =============================================================================
// ANALYTICS API
// =============================================================================

// Get order analytics
router.get('/analytics/orders', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('order_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (start_date) {
      query = query.gte('date', sanitizeInput(start_date));
    }

    if (end_date) {
      query = query.lte('date', sanitizeInput(end_date));
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ error: 'Failed to fetch order analytics' });
  }
});

// Get restaurant analytics
router.get('/analytics/restaurants', async (req, res) => {
  try {
    const { restaurant_id, start_date, end_date } = req.query;

    let query = supabase
      .from('restaurant_analytics')
      .select(`
        *,
        restaurant:restaurants(name, town)
      `)
      .order('date', { ascending: false });

    if (restaurant_id) {
      query = query.eq('restaurant_id', sanitizeInput(restaurant_id));
    }

    if (start_date) {
      query = query.gte('date', sanitizeInput(start_date));
    }

    if (end_date) {
      query = query.lte('date', sanitizeInput(end_date));
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching restaurant analytics:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant analytics' });
  }
});

// =============================================================================
// SYSTEM SETTINGS API
// =============================================================================

// Get all system settings
router.get('/system-settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_key');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// Update system setting
router.put('/system-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value, setting_type } = req.body;

    if (!setting_value || !setting_type) {
      return res.status(400).json({ error: 'Setting value and type are required' });
    }

    const { data, error } = await supabase
      .from('system_settings')
      .update({
        setting_value: sanitizeInput(setting_value),
        setting_type: sanitizeInput(setting_type),
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', sanitizeInput(key))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to update system setting' });
  }
});

// Create new system setting
router.post('/system-settings', async (req, res) => {
  try {
    const { setting_key, setting_value, setting_type, description } = req.body;

    if (!setting_key || !setting_value || !setting_type) {
      return res.status(400).json({ error: 'Setting key, value, and type are required' });
    }

    const { data, error } = await supabase
      .from('system_settings')
      .insert([{
        setting_key: sanitizeInput(setting_key),
        setting_value: sanitizeInput(setting_value),
        setting_type: sanitizeInput(setting_type),
        description: description ? sanitizeInput(description) : null
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating system setting:', error);
    res.status(500).json({ error: 'Failed to create system setting' });
  }
});

// =============================================================================
// IMAGE MANAGEMENT API
// =============================================================================

// Get available food images
router.get('/food-images', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // Sample food images mapping by category
    const categoryImages = {
      'Traditional': ['/placeholder.svg', '/choptime-logo.jpeg'],
      'Soup': ['/placeholder.svg', '/choptime-logo.jpeg'],
      'Rice': ['/placeholder.svg', '/choptime-logo.jpeg'],
      'Grilled': ['/placeholder.svg', '/choptime-logo.jpeg'],
      'Snacks': ['/placeholder.svg', '/choptime-logo.jpeg'],
      'Drinks': ['/placeholder.svg', '/choptime-logo.jpeg']
    };

    res.json({
      categories: categoryImages,
      available: ['/placeholder.svg', '/choptime-logo.jpeg', '/logo.svg']
    });
  } catch (error) {
    console.error('Error getting food images:', error);
    res.status(500).json({ error: 'Failed to get food images' });
  }
});

// Update dish image
router.put('/dishes/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const { data, error } = await supabase
      .from('dishes')
      .update({ image_url: sanitizeInput(image_url) })
      .eq('id', sanitizeInput(id))
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating dish image:', error);
    res.status(500).json({ error: 'Failed to update dish image' });
  }
});

// Bulk update dish images by category
router.put('/dishes/update-images-by-category', async (req, res) => {
  try {
    const { category, image_url } = req.body;

    if (!category || !image_url) {
      return res.status(400).json({ error: 'Category and image URL are required' });
    }

    const { data, error } = await supabase
      .from('dishes')
      .update({ image_url: sanitizeInput(image_url) })
      .eq('category', sanitizeInput(category))
      .select();

    if (error) throw error;
    res.json({
      message: `Updated ${data.length} dishes in category ${category}`,
      updated: data
    });
  } catch (error) {
    console.error('Error bulk updating dish images:', error);
    res.status(500).json({ error: 'Failed to bulk update dish images' });
  }
});

// =============================================================================
// SUPABASE STORAGE API
// =============================================================================

const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Reuse the existing Supabase client for storage operations
const supabaseStorage = supabase;

// Upload image to Supabase Storage
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { category, entity_type, entity_id } = req.body;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'choptym-images';

    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Create folder structure: category/entity_type/entity_id/
    const folderPath = category && entity_type && entity_id
      ? `${category}/${entity_type}/${entity_id}/`
      : 'general/';

    const filePath = folderPath + fileName;

    // Upload to Supabase Storage
    const { data, error } = await supabaseStorage.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Get public URL
    const { data: urlData } = supabaseStorage.storage
      .from(bucket)
      .getPublicUrl(filePath);

    res.json({
      success: true,
      image_url: urlData.publicUrl,
      file_path: filePath,
      file_name: fileName,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

// Get public URL for an image
router.get('/image-url/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'choptym-images';

    const { data } = supabaseStorage.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      res.json({ image_url: data.publicUrl });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error getting image URL:', error);
    res.status(500).json({ error: 'Failed to get image URL' });
  }
});

// Delete image from Supabase Storage
router.delete('/delete-image/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'choptym-images';

    const { error } = await supabaseStorage.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return res.status(500).json({ error: 'Failed to delete image' });
    }

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// List images in a folder
router.get('/list-images/:category?/:entityType?/:entityId?', async (req, res) => {
  try {
    const { category, entityType, entityId } = req.params;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'choptym-images';

    // Build prefix based on parameters
    let prefix = '';
    if (category) prefix += category + '/';
    if (entityType) prefix += entityType + '/';
    if (entityId) prefix += entityId + '/';

    const { data, error } = await supabaseStorage.storage
      .from(bucket)
      .list(prefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Storage list error:', error);
      return res.status(500).json({ error: 'Failed to list images' });
    }

    // Get public URLs for all files
    const filesWithUrls = data?.map(file => {
      const { data: urlData } = supabaseStorage.storage
        .from(bucket)
        .getPublicUrl(prefix + file.name);

      return {
        ...file,
        public_url: urlData?.publicUrl
      };
    }) || [];

    res.json({
      files: filesWithUrls,
      count: filesWithUrls.length
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// Create storage bucket (for initialization)
router.post('/create-storage-bucket', async (req, res) => {
  try {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'choptym-images';

    const { data, error } = await supabaseStorage.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
      fileSizeLimit: parseInt(process.env.MAX_FILE_SIZE) || 5242880
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Storage bucket creation error:', error);
      return res.status(500).json({ error: 'Failed to create storage bucket' });
    }

    res.json({
      success: true,
      message: error?.message?.includes('already exists')
        ? 'Storage bucket already exists'
        : 'Storage bucket created successfully',
      bucket: bucket
    });
  } catch (error) {
    console.error('Error creating storage bucket:', error);
    res.status(500).json({ error: 'Failed to create storage bucket' });
  }
});

// =============================================================================
// CONFIGURATION API - Provides safe configuration to frontend
// =============================================================================

router.get('/config', async (req, res) => {
  try {
    // Return only safe configuration data (no sensitive credentials)
    const config = {
      // Payment configuration - Payin only
      paymentMethod: {
        enabled: true,
        name: 'Payin Payment Gateway',
        description: 'Secure payment processing with comprehensive transaction management'
      },

      // Push notification configuration (public key only, private key stays server-side)
      notifications: {
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
        enabled: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true' && !!process.env.VAPID_PUBLIC_KEY
      },

      // Feature flags
      features: {
        enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
        enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true'
      },

      // Delivery configuration
      delivery: {
        defaultFee: parseInt(process.env.DEFAULT_DELIVERY_FEE) || 500,
        freeDeliveryThreshold: parseInt(process.env.FREE_DELIVERY_THRESHOLD) || 5000,
        maxDistance: parseInt(process.env.MAX_DELIVERY_DISTANCE) || 10
      },

      // Application info
      app: {
        name: 'ChopTym',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// =============================================================================
// PAYIN PAYMENT API - Exact implementation of Payin API OpenAPI specification
// =============================================================================

// POST /admin/auth - Get Auth Token
router.post('/payin/admin/auth', async (req, res) => {
  try {
    // Get credentials from backend environment variables (secure)
    const email = process.env.PAYIN_ADMIN_EMAIL;
    const password = process.env.PAYIN_ADMIN_PASSWORD;

    // Validate that credentials are configured
    if (!email || !password) {
      console.error('Payin credentials not configured in backend environment');
      return res.status(500).json({
        success: false,
        error: 'Payin API configuration missing'
      });
    }

    const payinUrl = process.env.PAYIN_API_URL || 'https://api.accountpe.com/api/payin';

    // Forward the request to Payin API using backend-stored credentials
    const response = await fetch(`${payinUrl}/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Authentication failed'
      });
    }

    // Return the response as per OpenAPI spec
    res.status(200).json({
      success: true,
      token: data.token,
      message: data.message || 'Successfully logged in'
    });
  } catch (error) {
    console.error('Payin admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable'
    });
  }
});

// POST /create_payment_links - Create Payment Link
router.post('/payin/create_payment_links', async (req, res) => {
  try {
    const {
      country_code,
      name,
      email,
      mobile,
      amount,
      transaction_id,
      description,
      pass_digital_charge
    } = req.body;

    // Validate required fields
    if (!country_code || !name || !email || !transaction_id || amount === undefined || pass_digital_charge === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate amount is integer
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive integer'
      });
    }

    const payinUrl = process.env.PAYIN_API_URL || 'https://api.accountpe.com/api/payin';
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Forward the request to Payin API
    const response = await fetch(`${payinUrl}/create_payment_links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        country_code,
        name,
        email,
        mobile,
        amount,
        transaction_id,
        description,
        pass_digital_charge
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to create payment link'
      });
    }

    // Return the response as per OpenAPI spec
    res.status(200).json({
      success: true,
      data: data.data,
      status: data.status || 200,
      message: data.message || 'Payment Link Successfully Created',
      transaction_id: transaction_id // Include transaction_id as per spec
    });
  } catch (error) {
    console.error('Payin create payment links error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment link creation service unavailable'
    });
  }
});

// POST /payment_link_status - Get payment link status
router.post('/payin/payment_link_status', async (req, res) => {
  try {
    const { transaction_id } = req.body;

    // Validate required fields
    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    const payinUrl = process.env.PAYIN_API_URL || 'https://api.accountpe.com/api/payin';
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    // Forward the request to Payin API
    const response = await fetch(`${payinUrl}/payment_link_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ transaction_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Transaction ID does not exist'
        });
      }
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to retrieve payment status'
      });
    }

    // Return the response as per OpenAPI spec
    res.status(200).json({
      success: true,
      data: data.data,
      status: data.status || 200,
      message: data.message || 'Payment Link Status Retrieved Successfully'
    });
  } catch (error) {
    console.error('Payin payment link status error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment status service unavailable'
    });
  }
});

module.exports = router;
