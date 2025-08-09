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

module.exports = router;
