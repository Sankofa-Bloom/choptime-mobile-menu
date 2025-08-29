/**
 * DISHES API ROUTES
 * Handles all dish-related operations
 */

const express = require('express');
const { supabase } = require('../config/database');
const { validateDishData } = require('../validators/dishValidators');
const { sanitizeInput } = require('../utils/security');
const { cache, invalidateCache } = require('../middleware/cache');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for dish operations
const dishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many dish requests from this IP, please try again later.'
});

// Apply rate limiting to all dish routes
router.use(dishLimiter);

// Cache dish data for 5 minutes
const dishCache = cache({ ttl: 300 });

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * GET /api/dishes
 * Get all active dishes
 */
router.get('/dishes', dishCache, async (req, res) => {
  try {
    const { town, category, search, page = 1, limit = 50 } = req.query;

    let query = supabase
      .from('dishes')
      .select('*')
      .eq('active', true)
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    if (town) {
      query = query.eq('town', sanitizeInput(town));
    }

    if (category) {
      query = query.eq('category', sanitizeInput(category));
    }

    if (search) {
      query = query.ilike('name', `%${sanitizeInput(search)}%`);
    }

    const { data, error, count } = await query.order('name');

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dishes',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dishes/:id
 * Get dish by ID
 */
router.get('/dishes/:id', dishCache, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dish ID'
      });
    }

    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', parseInt(id))
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Dish not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching dish:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dish',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dishes/categories
 * Get all dish categories
 */
router.get('/dishes/categories', dishCache, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .select('category')
      .eq('active', true)
      .not('category', 'is', null);

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))].sort();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// ADMIN ROUTES (Protected)
// =============================================================================

/**
 * POST /api/dishes
 * Create new dish (Admin only)
 */
router.post('/dishes', async (req, res) => {
  try {
    const dishData = req.body;

    // Validate input
    const validation = validateDishData(dishData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(dishData.name),
      description: sanitizeInput(dishData.description),
      price: parseFloat(dishData.price),
      category: sanitizeInput(dishData.category),
      image_url: sanitizeInput(dishData.image_url),
      active: dishData.active !== undefined ? dishData.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('dishes')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    await invalidateCache('/api/dishes*');

    res.status(201).json({
      success: true,
      data,
      message: 'Dish created successfully'
    });
  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dish',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/dishes/:id
 * Update dish (Admin only)
 */
router.put('/dishes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dish ID'
      });
    }

    // Validate updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    // Sanitize updates
    const sanitizedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string') {
        sanitizedUpdates[key] = sanitizeInput(value);
      } else {
        sanitizedUpdates[key] = value;
      }
    }

    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('dishes')
      .update(sanitizedUpdates)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Dish not found'
        });
      }
      throw error;
    }

    // Invalidate cache
    await invalidateCache('/api/dishes*');

    res.json({
      success: true,
      data,
      message: 'Dish updated successfully'
    });
  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dish',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/dishes/:id
 * Soft delete dish (Admin only)
 */
router.delete('/dishes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dish ID'
      });
    }

    const { data, error } = await supabase
      .from('dishes')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Dish not found'
        });
      }
      throw error;
    }

    // Invalidate cache
    await invalidateCache('/api/dishes*');

    res.json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete dish',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;