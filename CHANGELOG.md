
# Changelog

All notable changes to ChopTime will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-01-25

### 🎉 Major Release: Multi-Restaurant Vendor System

This release transforms ChopTime from a simple menu display into a comprehensive multi-restaurant platform while maintaining the original simple, mobile-first design.

### Added

#### 🏪 Multi-Restaurant Vendor System
- **Restaurant Registration**: Backend support for restaurant owners to register and manage profiles
- **Custom Pricing**: Each restaurant can set different prices for the same dish based on location
- **Menu Management**: Restaurants can toggle availability of dishes independently
- **Profile Images**: Support for restaurant profile image upload via Supabase Storage
- **Town-Based Operations**: Restaurants operate within specific towns (Douala, Yaoundé, Buea, etc.)

#### 🌍 Town-Based User Filtering
- **Town Selection Modal**: Users must select their town on first visit
- **Persistent Town Storage**: User's town preference saved with phone number
- **Filtered Restaurant Display**: Only restaurants in user's town appear in selection
- **Location-Based Pricing**: Prices vary by town (e.g., Buea: 2,500 FCFA, Yaoundé: 3,000 FCFA)
- **Quick Town Switching**: Users can change their town selection easily

#### 🍽️ Enhanced Menu Management
- **Master Dish Catalog**: Centralized dishes table with rich metadata
- **Dish Categories**: Traditional, Soup, Rice, Grilled, Snacks, Drinks
- **Smart Tags**: Popular, Spicy, Vegetarian indicators with icons
- **Rich Descriptions**: Detailed dish descriptions with cook time and serving info
- **Image Upload**: Support for dish images (JPG/PNG/WebP, max 2MB)
- **Availability Toggle**: Real-time dish availability per restaurant

#### 🛒 Order Management System
- **Database Order Storage**: All orders saved to Supabase with complete details
- **User Recognition**: Phone number-based user identification
- **Order History**: Track previous orders for returning customers
- **Status Tracking**: Order lifecycle (pending → confirmed → preparing → ready → delivered)
- **Restaurant Integration**: Orders linked to specific restaurants for future admin features

#### 🎨 UI/UX Enhancements
- **Enhanced Cards**: Dish cards show availability, pricing, and restaurant count
- **Smart Pricing Display**: "From X FCFA" when multiple restaurants available
- **Loading States**: Skeleton loading and error handling throughout
- **Town Indicator**: Header shows current selected town
- **Disabled States**: Graceful handling when dishes unavailable in user's town

### Changed

#### 📊 Data Architecture Overhaul
- **New Database Schema**: 5 core tables with proper relationships and RLS
- **Type System Update**: TypeScript types aligned with new database structure
- **API Integration**: Complete Supabase integration replacing mock data
- **Data Fetching**: Custom `useChopTimeData` hook for centralized data management

#### 🔧 Technical Improvements
- **Performance**: Optimized queries with proper indexing and relationships
- **Security**: Row Level Security (RLS) policies for all tables
- **Storage**: Dedicated buckets for restaurant and dish images
- **Caching**: Improved data caching and synchronization

#### 📱 Enhanced User Flow
1. **Town Selection**: Mandatory on first visit, persistent thereafter
2. **Menu Browsing**: Only dishes available in user's town displayed
3. **Restaurant Selection**: Filtered list based on dish availability and town
4. **Order Processing**: Enhanced order details with town information
5. **Return Experience**: Recognized users skip town selection

### Database Schema

#### New Tables
```sql
-- Restaurants with town-based operations
restaurants: {
  id, name, town, image_url, contact_number, 
  mtn_number, orange_number, auth_id, timestamps
}

-- Master dish catalog
dishes: {
  id, name, description, category, image_url,
  is_popular, is_spicy, is_vegetarian, 
  cook_time, serves, created_at
}

-- Restaurant-specific pricing and availability
restaurant_menus: {
  id, restaurant_id, dish_id, price, 
  availability, created_at
}

-- Complete order tracking
orders: {
  id, user_name, user_phone, user_location,
  dish_name, restaurant_name, restaurant_id, dish_id,
  quantity, price, total_amount, status, timestamps
}

-- User town preferences
user_towns: {
  id, user_phone, town, timestamps
}
```

#### Storage Buckets
- `restaurant-images`: Public bucket for restaurant profile images
- `dish-images`: Public bucket for dish images

### Technical Details

#### New Components
- `TownSelector.tsx`: Modal for town selection on first visit
- `useChopTimeData.ts`: Centralized data fetching and management hook
- Enhanced `RestaurantSelectionModal.tsx`: Now shows town-filtered restaurants

#### Updated Components  
- `Index.tsx`: Complete rewrite with backend integration (656 → 400+ lines)
- `types/restaurant.ts`: New type definitions matching database schema
- `PaymentDetails.tsx`: Enhanced with new restaurant data structure

#### Dependencies Added
- `@supabase/supabase-js`: Backend integration
- Enhanced TypeScript definitions

### Fixed
- **Restaurant Selection**: Now properly filters by user's selected town
- **Pricing Display**: Accurate pricing based on restaurant-dish combinations  
- **Order Persistence**: Orders now saved reliably to database
- **Town Persistence**: User's town selection remembered across sessions
- **Error Handling**: Graceful degradation when data unavailable

### Performance
- **Query Optimization**: Efficient joins and filtering at database level
- **Image Optimization**: Supabase CDN for fast image loading
- **Caching Strategy**: Smart data caching with automatic invalidation
- **Bundle Size**: Maintained minimal bundle size despite new features

### Security
- **RLS Policies**: Comprehensive Row Level Security across all tables
- **Input Validation**: Proper validation for all user inputs
- **Image Upload**: Secure file upload with size and type restrictions
- **Data Privacy**: User data properly scoped and protected

## [1.0.0] - 2024-01-20

### Initial Release

#### Added
- **Mobile-First Design**: Responsive layout optimized for smartphones
- **Traditional Menu**: Authentic Cameroonian dishes (Eru, Ndolé, Achu, etc.)
- **WhatsApp Integration**: Seamless order placement via WhatsApp
- **PWA Support**: Installable web app with offline capabilities
- **Cart Management**: Dynamic shopping cart with quantity controls
- **Payment Options**: MTN Money, Orange Money, Pay on Delivery
- **Cultural Design**: African-inspired colors and patterns

#### Technical Foundation
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Shadcn/UI components
- Lucide React icons
- Service worker for PWA functionality

#### Core Features
- Restaurant selection modal
- Menu item browsing
- Shopping cart functionality
- Order form with delivery details
- WhatsApp message generation
- PWA install prompts

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes, major feature additions
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, small improvements

## Support

For questions about changes or upgrades:
- **Email**: choptime237@gmail.com  
- **WhatsApp**: +237 6 70 41 64 49
