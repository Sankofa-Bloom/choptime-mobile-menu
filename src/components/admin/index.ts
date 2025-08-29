// Admin Components Barrel Export
// Clean imports for admin dashboard components

// Main Dashboard
export { default as SimpleAdminDashboard } from './SimpleAdminDashboardClean';

// Types
export * from './types';

// Hooks
export { useAdminData } from './hooks/useAdminData';
export { useDishManagement } from './hooks/useDishManagement';

// Sections
export { default as RestaurantManagement } from './sections/RestaurantManagement';
export { default as DishManagement } from './sections/DishManagement';
export { default as OrdersManagement } from './sections/OrdersManagement';

// Components
export { default as DishCard } from './components/DishCard';
export { default as RestaurantForm } from './components/RestaurantForm';
export { default as DishForm } from './components/DishForm';

// Routes
export { default as SimpleProtectedRoute } from './SimpleProtectedRoute';
export { default as SimpleAdminLogin } from './SimpleAdminLogin';