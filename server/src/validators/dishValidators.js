/**
 * DISH VALIDATION RULES
 * Input validation for dish operations
 */

const { securityConfig } = require('../../config/security');

/**
 * Validate dish data for creation/update
 */
function validateDishData(data) {
  const errors = [];
  const validated = {};

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else {
    const sanitized = securityConfig.helpers.sanitizeInput(data.name);
    if (sanitized.length < 2 || sanitized.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    }
    validated.name = sanitized;
  }

  // Description validation
  if (data.description && typeof data.description === 'string') {
    const sanitized = securityConfig.helpers.sanitizeInput(data.description);
    if (sanitized.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    validated.description = sanitized;
  }

  // Price validation
  if (data.price === undefined || data.price === null) {
    errors.push('Price is required');
  } else {
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0 || price > 100000) {
      errors.push('Price must be a valid number between 0 and 100,000');
    }
    validated.price = price;
  }

  // Category validation
  if (data.category && typeof data.category === 'string') {
    const sanitized = securityConfig.helpers.sanitizeInput(data.category);
    if (sanitized.length > 50) {
      errors.push('Category must not exceed 50 characters');
    }
    validated.category = sanitized;
  }

  // Image URL validation
  if (data.image_url && typeof data.image_url === 'string') {
    const urlPattern = /^https?:\/\/.+\/.+/;
    if (!urlPattern.test(data.image_url)) {
      errors.push('Image URL must be a valid HTTP/HTTPS URL');
    } else {
      validated.image_url = data.image_url;
    }
  }

  // Active status validation
  if (data.active !== undefined) {
    if (typeof data.active !== 'boolean') {
      errors.push('Active status must be a boolean');
    } else {
      validated.active = data.active;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: validated
  };
}

/**
 * Validate dish search parameters
 */
function validateDishSearch(params) {
  const errors = [];
  const validated = {};

  // Town validation
  if (params.town && typeof params.town === 'string') {
    const sanitized = securityConfig.helpers.sanitizeInput(params.town);
    if (sanitized.length > 50) {
      errors.push('Town name must not exceed 50 characters');
    }
    validated.town = sanitized;
  }

  // Category validation
  if (params.category && typeof params.category === 'string') {
    const sanitized = securityConfig.helpers.sanitizeInput(params.category);
    if (sanitized.length > 50) {
      errors.push('Category name must not exceed 50 characters');
    }
    validated.category = sanitized;
  }

  // Search term validation
  if (params.search && typeof params.search === 'string') {
    const sanitized = securityConfig.helpers.sanitizeInput(params.search);
    if (sanitized.length > 100) {
      errors.push('Search term must not exceed 100 characters');
    }
    validated.search = sanitized;
  }

  // Pagination validation
  if (params.page) {
    const page = parseInt(params.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive integer');
    }
    validated.page = page;
  }

  if (params.limit) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    validated.limit = limit;
  }

  return {
    valid: errors.length === 0,
    errors,
    data: validated
  };
}

module.exports = {
  validateDishData,
  validateDishSearch
};