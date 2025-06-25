
# ChopTime - Enhanced Cameroonian Food Delivery MVP 🇨🇲

A beautiful, mobile-first Progressive Web App (PWA) for authentic Cameroonian food delivery with multi-restaurant vendor system, town-based filtering, and complete backend integration.

## 🌟 New Features

### 🏪 Multi-Restaurant Vendor System
- Restaurants can register and manage their own profiles
- Custom pricing per dish by location (e.g., Eru = 2,500 XAF in Buea, 3,000 XAF in Yaoundé)
- Menu item availability management
- Restaurant profile image upload

### 🌍 Town-Based Filtering
- Users select their town on first visit
- Dishes shown only from restaurants in selected town  
- Restaurant selection filtered by user's town
- Persistent town selection with phone number

### 🍽️ Enhanced Menu Management
- Master dish catalog with categories
- Image upload support for dishes and restaurants
- Dish tags: Popular, Spicy, Vegetarian
- Rich dish descriptions with cook time and serving info

### 🛒 Order Management System
- Orders saved to database with full details
- User order history tracking
- Restaurant order management (future admin feature)
- Phone number-based user recognition

## 🎨 Design System

### Brand Colors
- **Terracotta Orange**: `#D57A1F` - Primary brand color
- **Earthy Brown**: `#5A2D0C` - Text and accents  
- **Soft Beige**: `#FDF1E0` - Background color

### Visual Elements
- African-inspired patterns and textures
- Warm, friendly animations
- Cultural iconography
- Mobile-optimized layouts

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for backend)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd choptime-mobile-menu

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup (Supabase)
1. Create a Supabase project
2. Run the provided SQL migrations to set up tables
3. Configure storage buckets for image upload
4. Update environment variables with your Supabase credentials

### Build for Production
```bash
# Build the app
npm run build

# Preview production build  
npm run preview
```

## 📱 PWA Features

### Installation
- Automatic install prompts on supported devices
- Add to home screen functionality
- App-like experience

### Offline Support
- Service worker caches essential resources
- Basic offline functionality
- Background sync capabilities

## 🗄️ Database Structure

### Core Tables

#### `restaurants`
```sql
- id (UUID, Primary Key)
- name (Text, Required)
- town (Text, Required) 
- image_url (Text, Optional)
- contact_number (Text, Required)
- mtn_number (Text, Optional)
- orange_number (Text, Optional)
- auth_id (UUID, References auth.users)
- created_at, updated_at (Timestamps)
```

#### `dishes` 
```sql
- id (UUID, Primary Key)
- name (Text, Required, Unique)
- description (Text, Optional)
- category (Enum: Traditional, Soup, Rice, Grilled, Snacks, Drinks)
- image_url (Text, Optional)
- is_popular, is_spicy, is_vegetarian (Boolean)
- cook_time, serves (Text)
- created_at (Timestamp)
```

#### `restaurant_menus`
```sql
- id (UUID, Primary Key)
- restaurant_id (UUID, References restaurants)
- dish_id (UUID, References dishes)
- price (Integer, FCFA)
- availability (Boolean)
- created_at (Timestamp)
- UNIQUE(restaurant_id, dish_id)
```

#### `orders`
```sql
- id (UUID, Primary Key)
- user_name, user_phone, user_location (Text, Required)
- dish_name, restaurant_name (Text, Required)
- restaurant_id, dish_id (UUID, References)
- quantity, price, total_amount (Integer)
- status (Enum: pending, confirmed, preparing, ready, delivered, cancelled)
- created_at, updated_at (Timestamps)
```

#### `user_towns`
```sql
- id (UUID, Primary Key)
- user_phone (Text, Required, Unique)
- town (Text, Required)
- created_at, updated_at (Timestamps)
```

## 🔧 API Integration

### Supabase Integration
- Real-time data fetching with React hooks
- Row Level Security (RLS) policies
- Image storage with public buckets
- Automatic data synchronization

### Key Hooks

#### `useChopTimeData(selectedTown)`
```typescript
const {
  dishes,           // All available dishes
  restaurants,      // Restaurants in selected town
  restaurantMenus,  // Menu items with pricing
  loading,          // Loading state
  error,            // Error state
  saveUserTown,     // Save user's town preference
  getUserTown,      // Get user's saved town
  saveOrder,        // Save order to database
  getUserOrders,    // Get user's order history
  refetch          // Refetch all data
} = useChopTimeData(selectedTown);
```

## 🎯 User Flow

### New User Experience
1. **Town Selection**: User selects their location on first visit
2. **Menu Browsing**: Dishes filtered by restaurants in user's town
3. **Restaurant Selection**: When adding to cart, user chooses from available restaurants
4. **Order Placement**: Order details saved to database + WhatsApp integration
5. **Return Visits**: Town and phone number remembered for faster ordering

### Restaurant Owner Experience (Future)
1. **Registration**: Restaurant owners can register via authentication
2. **Menu Management**: Add/remove dishes, set prices, toggle availability
3. **Order Management**: View and manage incoming orders
4. **Profile Management**: Upload restaurant images, update contact info

## 📷 Image Upload

### Supported Formats
- JPG, PNG, WebP
- Maximum size: 2MB
- Automatic compression and optimization

### Storage Structure
```
restaurant-images/
  ├── restaurant-{id}/
  │   └── profile.jpg
dish-images/
  ├── dish-{id}/
  │   └── main.jpg
```

## 🌐 Deployment

### Netlify Deployment
1. Build your project: `npm run build`
2. Connect your Git repository to Netlify
3. Set environment variables for Supabase
4. Deploy automatically on commits

### Vercel Deployment  
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Configure environment variables
4. Deploy with automatic builds

### Environment Variables
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 📋 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── TownSelector.tsx     # Town selection modal
│   ├── RestaurantSelectionModal.tsx
│   └── PaymentDetails.tsx
├── hooks/               # Custom React hooks
│   └── useChopTimeData.ts   # Main data fetching hook
├── types/               # TypeScript type definitions
│   └── restaurant.ts       # Core data types
├── pages/               # Main pages
│   └── Index.tsx           # Enhanced main page
├── integrations/        # External service integrations
│   └── supabase/           # Supabase client and types
└── lib/                 # Utility functions

public/
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
└── pwa-icon-*.png     # PWA icons (multiple sizes)
```

## 🔧 Technical Details

### Technologies Used
- **Frontend**: React 18 with TypeScript, Vite
- **Styling**: Tailwind CSS with custom ChopTime theme
- **UI Components**: Shadcn/UI component library
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React hooks with custom data layer
- **PWA**: Service worker with manifest

### Browser Support
- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Mobile Support
- iOS Safari 14+
- Android Chrome 88+
- Samsung Internet 15+

## 📱 WhatsApp Integration

### Enhanced Message Format
```
🍽️ *ChopTime Order*

👤 *Customer:* John Doe
📱 *Phone:* +237 6XX XXX XXX
📍 *Delivery Address:* Bastos, Yaoundé
🏙️ *Town:* Yaoundé
💳 *Payment:* MTN Mobile Money

🏪 *Mama Africa Kitchen*
📞 Contact: +237 6 70 41 64 49
💳 MTN Money: +237 6 70 41 64 49
• Eru with Fufu x2 - 6,000 FCFA
• Pepper Soup x1 - 2,100 FCFA

💰 *Total: 8,100 FCFA*

Thank you for choosing ChopTime! 🇨🇲
```

## 🎯 SEO & Performance

### SEO Features
- Semantic HTML structure
- Meta tags and Open Graph
- Proper headings hierarchy
- Alt text for images
- Structured data ready

### Performance Optimizations
- Image lazy loading with Supabase CDN
- Code splitting with Vite
- Service worker caching
- Minimal bundle size
- Optimized database queries

## 🐛 Troubleshooting

### Common Issues

**PWA not installing**
- Check manifest.json is accessible
- Verify HTTPS (required for PWA)
- Check service worker registration

**Database connection issues**
- Verify Supabase credentials
- Check RLS policies
- Ensure tables are created

**Image upload failures**
- Check storage bucket permissions
- Verify file size limits (2MB max)
- Ensure proper file formats

**Town selection not saving**
- Check user_towns table exists
- Verify phone number format
- Check localStorage permissions

## 🔮 Future Enhancements

### Phase 2 Features
- Restaurant owner dashboard
- Real-time order tracking
- Push notifications
- Advanced filtering (price, rating, cuisine type)
- User reviews and ratings
- Loyalty program

### Phase 3 Features
- Multiple payment gateways
- Delivery tracking with maps
- Restaurant analytics
- Multi-language support
- Social media integration

## 📞 Support

For technical support and customization requests:
- **Email**: choptime237@gmail.com
- **WhatsApp**: +237 6 70 41 64 49
- **Documentation**: [Project Wiki](link-to-wiki)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Cameroonian culinary traditions
- African design inspiration
- Supabase for backend infrastructure
- Open source community
- Traditional food photography

---

**Made with ❤️ for Cameroon**

*Bringing authentic flavors to your doorstep, one order at a time.*

## 🚀 Recent Changes (v2.0)

- ✅ Multi-restaurant vendor system implemented
- ✅ Town-based filtering with persistent selection
- ✅ Enhanced menu management with categories and tags
- ✅ Order saving and user history tracking
- ✅ Image upload support for restaurants and dishes
- ✅ Improved mobile-first responsive design
- ✅ Database integration with Supabase
- ✅ Enhanced WhatsApp order formatting
- ✅ PWA optimization and offline support

### Breaking Changes
- New database schema requires migration
- Updated API structure for restaurant selection
- Enhanced order flow with town selection requirement

### Migration Guide
1. Run provided SQL migrations in Supabase
2. Update environment variables
3. Test town selection and restaurant filtering
4. Verify order saving functionality
5. Test image upload capabilities
