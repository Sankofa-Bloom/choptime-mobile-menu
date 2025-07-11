# ChopTime Product Development Document

## 1. Vision
ChopTime aims to revolutionize food delivery in Cameroon by providing a seamless, reliable, and culturally relevant platform that connects customers with local restaurants, focusing on traditional dishes and efficient delivery logistics in Buea and Limbe as principal towns but plans on expanding into various other towns in cameroon.

## 2. Goals
- Enable users to easily discover and order traditional Cameroonian dishes from local restaurants.
- Provide a smart, location-based delivery pricing system.
- Empower restaurant owners with tools for menu, order, and delivery management.
- Ensure secure, scalable, and user-friendly experiences for both customers and admins.

## 3. Target Users
- **Customers:** Residents of Buea and Limbe seeking convenient access to local cuisine.
- **Restaurant Owners/Admins:** Local restaurant managers who want to digitize their menu and streamline order management.
- **Delivery Personnel:** (Future) Individuals responsible for delivering orders efficiently.

## 4. Key Features
### Customer
- Browse dishes by category and restaurant
- Smart delivery fee calculation based on location
- Custom dish ordering
- WhatsApp-based order confirmation
- Real-time order tracking (future)

### Admin
- Restaurant and dish management
- Delivery zone and pricing management
- Order management and analytics
- Admin authentication and access control

## 5. User Stories
- As a customer, I want to browse dishes by category so I can quickly find what I want.
- As a customer, I want to select my town and see only relevant restaurants.
- As a customer, I want to place a custom order for dishes not on the menu.
- As a customer, I want to confirm my order via WhatsApp for convenience.
- As an admin, I want to add/edit restaurants and dishes to keep the menu up to date.
- As an admin, I want to manage delivery zones and pricing for accurate fees.
- As an admin, I want to view and filter orders to monitor business performance.

## 6. Technical Architecture
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI, React Query
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Row Level Security)
- **Deployment:** Vercel/Netlify (frontend), Supabase (backend)
- **Integrations:** WhatsApp for order confirmation

### Database Schema (Core Tables)
- `restaurants`, `dishes`, `restaurant_menus`, `orders`, `custom_orders`, `delivery_zones`, `admin_users`, `user_towns`

### Security
- Row Level Security on all tables
- JWT-based authentication
- Input validation and SQL injection protection

## 7. Milestones & Roadmap
- **MVP Launch:**
  - Customer ordering flow (browse, cart, WhatsApp confirmation)
  - Admin dashboard (restaurant, dish, order, and delivery zone management)
  - Smart delivery fee calculation
- **Post-MVP:**
  - Real-time order tracking
  - Payment gateway integration
  - Mobile app development
  - Restaurant dashboard for order management
  - Customer reviews and loyalty program
  - Push notifications

## 8. Success Metrics
- Number of orders placed per week
- Customer retention and repeat order rate
- Number of active restaurants onboarded
- Average delivery time
- Customer and restaurant satisfaction (feedback)

## 9. Risks & Mitigations
- **Adoption by local restaurants:** Offer onboarding support and incentives.
- **Delivery logistics:** Start with limited zones, expand as capacity grows.
- **Payment integration:** Use trusted, regionally supported gateways.
- **Data security:** Enforce RLS, regular audits, and secure authentication.

## 10. Future Enhancements
- GPS-based delivery fee calculation
- In-app real-time order tracking
- Expanded coverage to more towns
- Advanced analytics for restaurants
- Multi-language support

---
This document should be updated as the product evolves and new requirements emerge. 