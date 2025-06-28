
# ChopTime - Cameroon Food Delivery Platform

ChopTime is a comprehensive food delivery platform specifically designed for Cameroon, focusing on traditional dishes and local restaurants in Buea and Limbe.

## Features

### 🍽️ Customer Features
- Browse dishes by category (Traditional, Soup, Rice, Grilled, Snacks, Drinks)
- Select restaurants by town (Buea, Limbe)
- Smart delivery pricing based on location zones
- Custom dish ordering for special requests
- WhatsApp-based order confirmation
- Real-time order tracking

### 🏪 Admin Features
- Restaurant management (add/edit/delete restaurants)
- Dish management with categories and properties
- Dynamic pricing per restaurant
- Delivery zone management with distance-based pricing
- Order management and analytics
- Admin authentication system

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Shadcn/UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Deployment**: Ready for Vercel/Netlify

## Database Schema

### Core Tables
- `restaurants` - Restaurant information and settings
- `dishes` - Available dishes with properties
- `restaurant_menus` - Links dishes to restaurants with pricing
- `orders` - Regular orders from menu items
- `custom_orders` - Custom dish requests
- `delivery_zones` - Zone-based delivery pricing
- `admin_users` - Admin authentication
- `user_towns` - User town preferences

### Key Features
- Row Level Security (RLS) for data protection
- Distance-based delivery fee calculation
- Order reference generation per town
- Admin-only access controls

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account

### 1. Clone Repository
```bash
git clone <repository-url>
cd choptime
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
The database migrations are included. Run them in your Supabase SQL editor:

1. Navigate to your Supabase project dashboard
2. Go to SQL Editor
3. Run the migration files in order

### 4. Create Admin User
Insert an admin user manually in Supabase:
```sql
-- First create auth user in Supabase Auth dashboard
-- Then insert admin record:
INSERT INTO public.admin_users (email, password_hash, role, active)
VALUES ('admin@choptime.com', 'your_hashed_password', 'admin', true);
```

### 5. Run Development Server
```bash
npm run dev
```

## Deployment

### Supabase Configuration
1. Set up Row Level Security policies
2. Configure authentication providers
3. Set up realtime subscriptions if needed

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy to Vercel/Netlify
3. Set environment variables in deployment platform

## Admin Panel Access

### URL Structure
- Public site: `/`
- Admin login: `/dash/login`
- Admin dashboard: `/dash/chp-ctrl`

⚠️ **Security Note**: The admin panel routes are hidden and not linked from the public site.

### Admin Functions
1. **Restaurant Management**
   - Add/edit restaurant details
   - Set delivery times and contact info
   - Upload logos and images
   - Toggle active status

2. **Dish Management**
   - Create dishes with categories
   - Set properties (popular, spicy, vegetarian)
   - Upload dish images
   - Manage availability

3. **Delivery Zone Management**
   - Set distance-based pricing
   - Create delivery zones per town
   - Automatic fee calculation

4. **Order Management**
   - View all orders (regular & custom)
   - Filter by status and search
   - Order analytics dashboard

## Delivery Logic

### Zone-Based Pricing
The system uses intelligent zone-based pricing:
- Each town has multiple delivery zones
- Zones are defined by distance ranges (0-2km, 2-5km, etc.)
- Automatic fee calculation based on address keywords
- Fallback to minimum zone fee if no match

### Default Zones
**Buea:**
- Town Center (0-2km): 500 FCFA
- Suburbs (2-5km): 800 FCFA  
- Outskirts (5km+): 1200 FCFA

**Limbe:**
- Mile 1-2 (0-3km): 600 FCFA
- Mile 3-4 (3-6km): 900 FCFA
- Down Beach & Beyond (6km+): 1400 FCFA

## Order Flow

1. **Customer Journey**
   - Select town (Buea/Limbe)
   - Browse dishes by category
   - Choose restaurant for each dish
   - Add to cart with quantities
   - Fill delivery details
   - Generate WhatsApp order
   - Order saved to database

2. **Order Processing**
   - Automatic order reference generation
   - Delivery fee calculation
   - Order saved with pending status
   - WhatsApp message formatted and sent
   - Admin can view and manage in dashboard

## API Functions

### Supabase Functions
- `generate_order_reference(town_name)` - Creates unique order IDs
- `calculate_delivery_fee(town_name, location_description)` - Smart fee calculation
- `get_order_stats()` - Admin dashboard analytics

## Customization

### Adding New Towns
1. Update `TownSelector.tsx` component
2. Add delivery zones for the new town
3. Update order reference generation function

### Adding New Categories
1. Update the dish category enum in database
2. Update `DishManagement.tsx` categories array
3. Update filtering logic if needed

### Custom Styling
- Modify Tailwind configuration in `tailwind.config.ts`
- Update CSS custom properties in `index.css`
- ChopTime brand colors are defined as custom Tailwind classes

## Security Considerations

- Row Level Security enabled on all tables
- Admin routes are hidden and not guessable
- JWT-based authentication through Supabase
- Input validation on all forms
- SQL injection protection through Supabase

## Performance

- Optimized queries with proper indexing
- Image optimization recommendations
- Lazy loading for large datasets
- Efficient state management with React hooks

## Support & Maintenance

### Monitoring
- Check Supabase logs for errors
- Monitor order submission rates
- Track delivery zone effectiveness

### Backup
- Supabase handles automatic backups
- Export order data regularly for analytics
- Keep admin credentials secure

## Future Enhancements

- Mobile app development
- Real-time order tracking
- Payment gateway integration
- GPS-based delivery fee calculation
- Restaurant dashboard for order management
- Customer review system
- Loyalty program
- Push notifications

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow TypeScript best practices
4. Test thoroughly before submitting
5. Update documentation for new features

## License

Proprietary - All rights reserved by ChopTime
