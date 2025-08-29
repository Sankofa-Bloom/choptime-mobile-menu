import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Save, X, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orderNotificationService } from '@/services/orderNotificationService';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  town: string;
  address: string;
  contact_number: string;
  cuisine_type: string;
  active: boolean;
  delivery_time_min: number;
  delivery_time_max: number;
  rating: number;
  gps_latitude: number;
  gps_longitude: number;
  created_at: string;
}

interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  active: boolean;
  admin_created: boolean;
  created_at: string;
}

interface RestaurantMenu {
  id?: string;
  restaurant_id: string;
  dish_id?: string;
  price: number;
  availability: boolean;
  restaurant?: {
    id: string;
    name: string;
    town: string;
  };
}

interface RestaurantMenuItem {
  restaurant_id: string;
  price: number;
  availability: boolean;
  restaurant?: {
    id: string;
    name: string;
    town: string;
  };
}

interface Order {
  id: string;
  user_name: string;
  user_phone: string;
  user_email?: string;
  user_location: string;
  dish_name: string;
  restaurant_name: string;
  restaurant_id?: string;
  dish_id?: string;
  quantity: number;
  price: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  order_reference?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  delivery_fee?: number;
  driver_name?: string;
  driver_phone?: string;
  special_instructions?: string;
}

// DishCard Component for displaying dish information with restaurant count
const DishCard: React.FC<{
  dish: Dish;
  restaurants: Restaurant[];
  onEdit: (dish: Dish) => void;
  onDelete: (id: string) => void;
}> = ({ dish, restaurants, onEdit, onDelete }) => {
  const [restaurantCount, setRestaurantCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    const fetchRestaurantCount = async () => {
      try {
        const { count, error } = await supabase
          .from('restaurant_menus')
          .select('*', { count: 'exact', head: true })
          .eq('dish_id', dish.id);

        if (!error) {
          setRestaurantCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching restaurant count:', error);
      } finally {
        setLoadingCount(false);
      }
    };

    fetchRestaurantCount();
  }, [dish.id]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold">{dish.name}</h3>
              <Badge variant={dish.active ? 'default' : 'secondary'}>
                {dish.active ? 'Active' : 'Inactive'}
              </Badge>
              {dish.category && (
                <Badge variant="outline">
                  {dish.category === 'Traditional' && '🍽️'}
                  {dish.category === 'Soup' && '🥣'}
                  {dish.category === 'Rice' && '🍚'}
                  {dish.category === 'Grilled' && '🔥'}
                  {dish.category === 'Snacks' && '🍿'}
                  {dish.category === 'Drinks' && '🥤'}
                  {dish.category}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mb-2">{dish.description}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>📂 Category: {dish.category}</p>
              <p>🏪 Served at: {loadingCount ? '...' : `${restaurantCount} restaurant${restaurantCount !== 1 ? 's' : ''}`}</p>
              {dish.admin_created && <p>👨‍💼 Admin Created</p>}
              <p className="text-xs text-gray-400">
                Created: {new Date(dish.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(dish)}
              title="Edit dish and manage restaurants"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(dish.id)}
              title="Delete dish from all restaurants"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// OrdersManagement Component
const OrdersManagement: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Move this to a custom hook later if needed
  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast({
          title: 'Error',
          description: 'Failed to load orders',
          variant: 'destructive'
        });
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error in loadOrders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast({
          title: 'Error',
          description: 'Failed to load orders',
          variant: 'destructive'
        });
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error in loadOrders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set timestamp based on status
      const now = new Date().toISOString();
      switch (newStatus) {
        case 'confirmed':
          updateData.confirmed_at = now;
          break;
        case 'preparing':
          updateData.preparing_at = now;
          break;
        case 'ready':
          updateData.ready_at = now;
          break;
        case 'out_for_delivery':
          updateData.out_for_delivery_at = now;
          break;
        case 'delivered':
          updateData.delivered_at = now;
          break;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update order status',
          variant: 'destructive'
        });
        return;
      }

      // Send notification to customer
      await sendOrderStatusNotification(orderId, newStatus);

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, ...updateData }
          : order
      ));

      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
      });

      // Refresh data to get latest timestamps
      await loadOrders();

    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const sendOrderStatusNotification = async (orderId: string, status: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Use the notification service to send notifications
      await orderNotificationService.notifyOrderStatusChange({
        orderId: order.id,
        customerPhone: order.user_phone,
        customerEmail: order.user_email,
        customerName: order.user_name,
        dishName: order.dish_name,
        restaurantName: order.restaurant_name,
        newStatus: status,
        orderReference: order.order_reference
      });

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchTerm === '' ||
      order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_phone.includes(searchTerm) ||
      order.dish_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.order_reference && order.order_reference.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
    return stats;
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.preparing}</div>
            <div className="text-sm text-gray-600">Preparing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
            <div className="text-sm text-gray-600">Ready</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.out_for_delivery}</div>
            <div className="text-sm text-gray-600">Out for Delivery</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.delivered}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <Input
                placeholder="Search by customer name, phone, dish, or order reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No orders found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          Payment: {order.payment_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Customer:</p>
                          <p className="font-medium">{order.user_name}</p>
                          <p className="text-gray-500">{order.user_phone}</p>
                          {order.user_email && <p className="text-gray-500">{order.user_email}</p>}
                        </div>

                        <div>
                          <p className="text-gray-600">Order:</p>
                          <p className="font-medium">{order.dish_name}</p>
                          <p className="text-gray-500">Qty: {order.quantity}</p>
                          <p className="text-gray-500">Restaurant: {order.restaurant_name}</p>
                        </div>

                        <div>
                          <p className="text-gray-600">Payment:</p>
                          <p className="font-medium">${(order.total_amount / 100).toFixed(2)}</p>
                          <p className="text-gray-500">{order.payment_method || 'N/A'}</p>
                          {order.order_reference && (
                            <p className="text-gray-500 text-xs">Ref: {order.order_reference}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        <p>Ordered: {new Date(order.created_at).toLocaleString()}</p>
                        {order.confirmed_at && <p>Confirmed: {new Date(order.confirmed_at).toLocaleString()}</p>}
                        {order.delivered_at && <p>Delivered: {new Date(order.delivered_at).toLocaleString()}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm Order</option>
                        <option value="preparing">Start Preparing</option>
                        <option value="ready">Mark Ready</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Mark Delivered</option>
                        <option value="cancelled">Cancel Order</option>
                      </select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={updateOrderStatus}
        />
      )}
    </div>
  );
};

// OrderDetailsModal Component
const OrderDetailsModal: React.FC<{
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
}> = ({ order, onClose, onStatusUpdate }) => {
  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Order Details #{order.id.slice(-8).toUpperCase()}
            </h2>
            <Button variant="outline" onClick={onClose}>
              ✕ Close
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Status</h3>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(order.status)}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={order.status}
                  onChange={(e) => onStatusUpdate(order.id, e.target.value as Order['status'])}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirm Order</option>
                  <option value="preparing">Start Preparing</option>
                  <option value="ready">Mark Ready</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Mark Delivered</option>
                  <option value="cancelled">Cancel Order</option>
                </select>
              </div>

              {/* Status Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium">Status Timeline</h4>
                <div className="space-y-1 text-sm">
                  <div className={`flex items-center gap-2 ${order.created_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>•</span>
                    <span>Order Placed: {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${order.confirmed_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>•</span>
                    <span>Confirmed: {order.confirmed_at ? new Date(order.confirmed_at).toLocaleString() : 'Not confirmed'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${order.preparing_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>•</span>
                    <span>Preparing: {order.preparing_at ? new Date(order.preparing_at).toLocaleString() : 'Not started'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${order.ready_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>•</span>
                    <span>Ready: {order.ready_at ? new Date(order.ready_at).toLocaleString() : 'Not ready'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${order.out_for_delivery_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>•</span>
                    <span>Out for Delivery: {order.out_for_delivery_at ? new Date(order.out_for_delivery_at).toLocaleString() : 'Not dispatched'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${order.delivered_at ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>•</span>
                    <span>Delivered: {order.delivered_at ? new Date(order.delivered_at).toLocaleString() : 'Not delivered'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Order Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {order.user_name}</p>
                <p><strong>Phone:</strong> {order.user_phone}</p>
                {order.user_email && <p><strong>Email:</strong> {order.user_email}</p>}
                <p><strong>Location:</strong> {order.user_location}</p>
              </div>

              <h3 className="text-lg font-semibold">Order Information</h3>
              <div className="space-y-2">
                <p><strong>Dish:</strong> {order.dish_name}</p>
                <p><strong>Restaurant:</strong> {order.restaurant_name}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Price per item:</strong> ${(order.price / 100).toFixed(2)}</p>
                <p><strong>Delivery Fee:</strong> ${((order.delivery_fee || 0) / 100).toFixed(2)}</p>
                <p><strong>Total Amount:</strong> ${(order.total_amount / 100).toFixed(2)}</p>
              </div>

              {/* Payment Information */}
              <h3 className="text-lg font-semibold">Payment Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </div>
                {order.payment_method && <p><strong>Method:</strong> {order.payment_method}</p>}
                {order.payment_reference && <p><strong>Reference:</strong> {order.payment_reference}</p>}
                {order.order_reference && <p><strong>Order Ref:</strong> {order.order_reference}</p>}
              </div>

              {/* Delivery Information */}
              {(order.driver_name || order.special_instructions) && (
                <>
                  <h3 className="text-lg font-semibold">Delivery Information</h3>
                  <div className="space-y-2">
                    {order.driver_name && <p><strong>Driver:</strong> {order.driver_name}</p>}
                    {order.driver_phone && <p><strong>Driver Phone:</strong> {order.driver_phone}</p>}
                    {order.special_instructions && <p><strong>Instructions:</strong> {order.special_instructions}</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleAdminDashboard: React.FC = () => {
  const { admin, isAuthenticated, logout, initializeFromStorage } = useSimpleAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);

  // Restaurant form state
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    town: '',
    address: '',
    contact_number: '',
    cuisine_type: '',
    active: true,
    delivery_time_min: 15,
    delivery_time_max: 45,
    rating: 4.5,
    gps_latitude: 0.00000000,
    gps_longitude: 0.00000000
  } as Restaurant & { gps_latitude: number; gps_longitude: number });

  // Dish form state
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    category: 'Traditional',
    image_url: '',
    active: true,
    admin_created: true
  } as Dish);

  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [loadingMenuData, setLoadingMenuData] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      initializeFromStorage();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantsError) {
        console.error('Error loading restaurants:', restaurantsError);
        toast({
          title: 'Error',
          description: 'Failed to load restaurants',
          variant: 'destructive'
        });
      } else {
        setRestaurants(restaurantsData || []);
      }

      // Load dishes
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (dishesError) {
        console.error('Error loading dishes:', dishesError);
      } else {
        setDishes(dishesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Ensure all required fields have valid values
      const restaurantData = {
        ...restaurantForm,
        delivery_time_min: restaurantForm.delivery_time_min || 15,
        delivery_time_max: restaurantForm.delivery_time_max || 45,
        gps_latitude: restaurantForm.gps_latitude || 0.00000000,
        gps_longitude: restaurantForm.gps_longitude || 0.00000000,
        rating: restaurantForm.rating || 4.5
      };

      if (editingRestaurant) {
        // Update restaurant
        const { error } = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', editingRestaurant.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Restaurant updated successfully'
        });
      } else {
        // Create restaurant
        const { error } = await supabase
          .from('restaurants')
          .insert([restaurantData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Restaurant created successfully'
        });
      }

      resetRestaurantForm();
      loadData();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast({
        title: 'Error',
        description: 'Failed to save restaurant',
        variant: 'destructive'
      });
    }
  };

  const handleDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one restaurant is selected
    if (menuItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one restaurant that serves this dish',
        variant: 'destructive'
      });
      return;
    }

    // Validate that all menu items have valid prices
    const invalidItems = menuItems.filter(item => item.price <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: 'Error',
        description: 'All restaurants must have a valid price (greater than 0)',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Ensure all required fields have valid values
      const dishData = {
        ...dishForm,
        active: dishForm.active ?? true,
        admin_created: dishForm.admin_created ?? true
      };

      let dishId: string;

      if (editingDish) {
        // Update existing dish
        const { error } = await supabase
          .from('dishes')
          .update(dishData)
          .eq('id', editingDish.id);

        if (error) throw error;
        dishId = editingDish.id;

        toast({
          title: 'Success',
          description: 'Dish updated successfully'
        });
      } else {
        // Create new dish
        const { data: newDish, error } = await supabase
          .from('dishes')
          .insert([dishData])
          .select()
          .single();

        if (error) throw error;
        dishId = newDish.id;

        toast({
          title: 'Success',
          description: 'Dish created successfully'
        });
      }

      // Handle restaurant-menu relationships
      await handleMenuItemsUpdate(dishId);

      resetDishForm();
      loadData();
    } catch (error) {
      console.error('Error saving dish:', error);
      toast({
        title: 'Error',
        description: 'Failed to save dish',
        variant: 'destructive'
      });
    }
  };

  const handleMenuItemsUpdate = async (dishId: string) => {
    try {
      // Get existing menu items for this dish
      const { data: existingMenuItems, error: fetchError } = await supabase
        .from('restaurant_menus')
        .select('id, restaurant_id')
        .eq('dish_id', dishId);

      if (fetchError) {
        console.error('Error fetching existing menu items:', fetchError);
        return;
      }

      const existingRestaurantIds = new Set(existingMenuItems?.map(item => item.restaurant_id) || []);
      const newRestaurantIds = new Set(menuItems.map(item => item.restaurant_id));

      // Delete menu items for restaurants that are no longer selected
      const toDelete = existingMenuItems?.filter(item => !newRestaurantIds.has(item.restaurant_id)) || [];
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('restaurant_menus')
          .delete()
          .in('id', toDelete.map(item => item.id));

        if (deleteError) {
          console.error('Error deleting old menu items:', deleteError);
        }
      }

      // Update existing menu items and add new ones
      for (const menuItem of menuItems) {
        const existingItem = existingMenuItems?.find(item => item.restaurant_id === menuItem.restaurant_id);

        const menuData = {
          restaurant_id: menuItem.restaurant_id,
          dish_id: dishId,
          price: menuItem.price,
          availability: menuItem.availability
        };

        if (existingItem) {
          // Update existing menu item
          const { error: updateError } = await supabase
            .from('restaurant_menus')
            .update(menuData)
            .eq('id', existingItem.id);

          if (updateError) {
            console.error('Error updating menu item:', updateError);
          }
        } else {
          // Create new menu item
          const { error: insertError } = await supabase
            .from('restaurant_menus')
            .insert([menuData]);

          if (insertError) {
            console.error('Error creating menu item:', insertError);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleMenuItemsUpdate:', error);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Restaurant deleted successfully'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete restaurant',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;

    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Dish deleted successfully'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting dish:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dish',
        variant: 'destructive'
      });
    }
  };

  const resetRestaurantForm = () => {
    setRestaurantForm({
      name: '',
      description: '',
      town: '',
      address: '',
      contact_number: '',
      cuisine_type: '',
      active: true,
      delivery_time_min: 15,
      delivery_time_max: 45,
      rating: 4.5,
      gps_latitude: 0.00000000,
      gps_longitude: 0.00000000
    } as Restaurant & { gps_latitude: number; gps_longitude: number });
    setEditingRestaurant(null);
    setShowRestaurantForm(false);
  };

  const resetDishForm = () => {
    setDishForm({
      name: '',
      description: '',
      category: 'Traditional',
      image_url: '',
      active: true,
      admin_created: true
    } as Dish);
    setMenuItems([]);
    setEditingDish(null);
    setShowDishForm(false);
  };

  const editRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setRestaurantForm({
      name: restaurant.name || '',
      description: restaurant.description || '',
      town: restaurant.town || '',
      address: restaurant.address || '',
      contact_number: restaurant.contact_number || '',
      cuisine_type: restaurant.cuisine_type || '',
      active: restaurant.active ?? true,
      delivery_time_min: restaurant.delivery_time_min || 15,
      delivery_time_max: restaurant.delivery_time_max || 45,
      rating: restaurant.rating || 4.5,
      gps_latitude: restaurant.gps_latitude || 0.00000000,
      gps_longitude: restaurant.gps_longitude || 0.00000000
    });
    setShowRestaurantForm(true);
  };

  const editDish = async (dish: Dish) => {
    setEditingDish(dish);
    setLoadingMenuData(true);

    setDishForm({
      name: dish.name || '',
      description: dish.description || '',
      category: dish.category || 'Traditional',
      image_url: dish.image_url || '',
      active: dish.active ?? true,
      admin_created: dish.admin_created ?? true
    });

    try {
      // Find all restaurant-menu entries for this dish
      const { data: menuData, error } = await supabase
        .from('restaurant_menus')
        .select(`
          id,
          restaurant_id,
          price,
          availability,
          restaurants (
            id,
            name,
            town
          )
        `)
        .eq('dish_id', dish.id);

      if (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems([]);
      } else if (menuData && menuData.length > 0) {
        // Convert the data to our expected format
        const formattedMenuItems: RestaurantMenuItem[] = menuData.map(item => ({
          restaurant_id: item.restaurant_id,
          price: item.price || 0,
          availability: item.availability ?? true,
          restaurant: item.restaurants ? {
            id: item.restaurants.id,
            name: item.restaurants.name,
            town: item.restaurants.town
          } : undefined
        }));
        setMenuItems(formattedMenuItems);
      } else {
        // No menu entries found
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error in editDish:', error);
      setMenuItems([]);
    } finally {
      setLoadingMenuData(false);
    }

    setShowDishForm(true);
  };

  const addRestaurantToDish = (restaurantId: string) => {
    // Check if restaurant is already added
    const exists = menuItems.some(item => item.restaurant_id === restaurantId);
    if (exists) {
      toast({
        title: 'Warning',
        description: 'This restaurant already serves this dish',
        variant: 'default'
      });
      return;
    }

    // Find restaurant details
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;

    const newMenuItem: RestaurantMenuItem = {
      restaurant_id: restaurantId,
      price: 0,
      availability: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        town: restaurant.town
      }
    };

    setMenuItems(prev => [...prev, newMenuItem]);
  };

  const removeRestaurantFromDish = (restaurantId: string) => {
    setMenuItems(prev => prev.filter(item => item.restaurant_id !== restaurantId));
  };

  const updateMenuItemPrice = (restaurantId: string, price: number) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.restaurant_id === restaurantId
          ? { ...item, price }
          : item
      )
    );
  };

  const updateMenuItemAvailability = (restaurantId: string, availability: boolean) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.restaurant_id === restaurantId
          ? { ...item, availability }
          : item
      )
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Please log in to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ChopTym Admin Dashboard</h1>
            <p className="text-gray-600">Manage restaurants, dishes, and orders</p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">🏪</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Restaurants</p>
                  <p className="text-2xl font-bold">{restaurants.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Dishes</p>
                  <p className="text-2xl font-bold">{dishes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Restaurants</p>
                  <p className="text-2xl font-bold">
                    {restaurants.filter(r => r.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="dishes">Dishes</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Restaurants</CardTitle>
                  <Button onClick={() => setShowRestaurantForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Restaurant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showRestaurantForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>
                        {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRestaurantSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Restaurant Name"
                            value={restaurantForm.name}
                            onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                            required
                          />
                          <Input
                            placeholder="Town"
                            value={restaurantForm.town}
                            onChange={(e) => setRestaurantForm({...restaurantForm, town: e.target.value})}
                            required
                          />
                        </div>
                        <Input
                          placeholder="Description"
                          value={restaurantForm.description}
                          onChange={(e) => setRestaurantForm({...restaurantForm, description: e.target.value})}
                          required
                        />
                        <Input
                          placeholder="Address"
                          value={restaurantForm.address}
                          onChange={(e) => setRestaurantForm({...restaurantForm, address: e.target.value})}
                          required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Contact Number"
                            value={restaurantForm.contact_number}
                            onChange={(e) => setRestaurantForm({...restaurantForm, contact_number: e.target.value})}
                            required
                          />
                          <Input
                            placeholder="Cuisine Type"
                            value={restaurantForm.cuisine_type}
                            onChange={(e) => setRestaurantForm({...restaurantForm, cuisine_type: e.target.value})}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Delivery Time Min (minutes)"
                            type="number"
                            value={restaurantForm.delivery_time_min || ''}
                            onChange={(e) => setRestaurantForm({...restaurantForm, delivery_time_min: e.target.value ? parseInt(e.target.value) : 15})}
                            required
                          />
                          <Input
                            placeholder="Delivery Time Max (minutes)"
                            type="number"
                            value={restaurantForm.delivery_time_max || ''}
                            onChange={(e) => setRestaurantForm({...restaurantForm, delivery_time_max: e.target.value ? parseInt(e.target.value) : 45})}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Latitude"
                            type="number"
                            step="0.00000001"
                            value={restaurantForm.gps_latitude || ''}
                            onChange={(e) => setRestaurantForm({...restaurantForm, gps_latitude: e.target.value ? parseFloat(e.target.value) : 0.00000000})}
                          />
                          <Input
                            placeholder="Longitude"
                            type="number"
                            step="0.00000001"
                            value={restaurantForm.gps_longitude || ''}
                            onChange={(e) => setRestaurantForm({...restaurantForm, gps_longitude: e.target.value ? parseFloat(e.target.value) : 0.00000000})}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={resetRestaurantForm}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            {editingRestaurant ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {restaurants.map((restaurant) => (
                    <Card key={restaurant.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                              <Badge variant={restaurant.active ? 'default' : 'secondary'}>
                                {restaurant.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-2">{restaurant.description}</p>
                            <div className="text-sm text-gray-500 space-y-1">
                              <p>🏙️ {restaurant.town}</p>
                              <p>📍 {restaurant.address}</p>
                              <p>📞 {restaurant.contact_number}</p>
                              <p>🍽️ {restaurant.cuisine_type}</p>
                              <p>⏱️ Delivery: {restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</p>
                              <p>⭐ Rating: {restaurant.rating}/5</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editRestaurant(restaurant)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRestaurant(restaurant.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dishes Tab */}
          <TabsContent value="dishes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Dishes</CardTitle>
                  <Button onClick={() => setShowDishForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Dish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showDishForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>
                        {editingDish ? 'Edit Dish' : 'Add New Dish'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingMenuData && editingDish && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-700 flex items-center">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
                            Loading restaurant and pricing information...
                          </p>
                        </div>
                      )}
                      <form onSubmit={handleDishSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-700">Basic Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dish Name
                              </label>
                              <Input
                                placeholder="Enter dish name"
                                value={dishForm.name}
                                onChange={(e) => setDishForm({...dishForm, name: e.target.value})}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                value={dishForm.category}
                                onChange={(e) => setDishForm({...dishForm, category: e.target.value})}
                                required
                              >
                                <option value="Traditional">🍽️ Traditional</option>
                                <option value="Soup">🥣 Soup</option>
                                <option value="Rice">🍚 Rice</option>
                                <option value="Grilled">🔥 Grilled</option>
                                <option value="Snacks">🍿 Snacks</option>
                                <option value="Drinks">🥤 Drinks</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <Input
                              placeholder="Describe the dish"
                              value={dishForm.description}
                              onChange={(e) => setDishForm({...dishForm, description: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Image URL (Optional)
                            </label>
                            <Input
                              placeholder="https://example.com/dish-image.jpg"
                              value={dishForm.image_url}
                              onChange={(e) => setDishForm({...dishForm, image_url: e.target.value})}
                            />
                          </div>
                        </div>

                        {/* Restaurant & Pricing Management */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-700">Restaurant & Pricing</h4>
                            <div className="text-sm text-gray-600">
                              {menuItems.length} restaurant{menuItems.length !== 1 ? 's' : ''} serve{editingDish ? 's' : ''} this dish
                            </div>
                          </div>

                          {/* Add Restaurant Dropdown */}
                          <div className="flex gap-2">
                            <select
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              onChange={(e) => {
                                if (e.target.value) {
                                  addRestaurantToDish(e.target.value);
                                  e.target.value = ''; // Reset selection
                                }
                              }}
                              value=""
                            >
                              <option value="">➕ Add Restaurant</option>
                              {restaurants
                                .filter(restaurant => !menuItems.some(item => item.restaurant_id === restaurant.id))
                                .map((restaurant) => (
                                  <option key={restaurant.id} value={restaurant.id}>
                                    {restaurant.name} - {restaurant.town}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Restaurant Menu Items */}
                          <div className="space-y-3">
                            {menuItems.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <p>🏪 No restaurants selected</p>
                                <p className="text-sm">Use the dropdown above to add restaurants that serve this dish</p>
                              </div>
                            ) : (
                              menuItems.map((menuItem, index) => (
                                <Card key={menuItem.restaurant_id} className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-gray-900">
                                            {menuItem.restaurant?.name || 'Unknown Restaurant'}
                                          </h5>
                                          <p className="text-sm text-gray-500">
                                            📍 {menuItem.restaurant?.town || 'Unknown Location'}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="w-24">
                                            <label className="block text-xs text-gray-600 mb-1">
                                              Price (¢)
                                            </label>
                                            <Input
                                              type="number"
                                              placeholder="500"
                                              value={menuItem.price || ''}
                                              onChange={(e) => updateMenuItemPrice(
                                                menuItem.restaurant_id,
                                                e.target.value ? parseInt(e.target.value) : 0
                                              )}
                                              className="h-8 text-sm"
                                            />
                                          </div>
                                          <div className="w-20">
                                            <label className="block text-xs text-gray-600 mb-1">
                                              Available
                                            </label>
                                            <input
                                              type="checkbox"
                                              checked={menuItem.availability}
                                              onChange={(e) => updateMenuItemAvailability(
                                                menuItem.restaurant_id,
                                                e.target.checked
                                              )}
                                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      {menuItem.price > 0 && (
                                        <p className="text-xs text-green-600 mt-1">
                                          💰 Display price: ${(menuItem.price / 100).toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeRestaurantFromDish(menuItem.restaurant_id)}
                                      className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </Card>
                              ))
                            )}
                          </div>

                          {editingDish && menuItems.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <p className="text-sm text-blue-700">
                                💡 <strong>Multi-Restaurant Management:</strong> This dish is served by {menuItems.length} restaurant{menuItems.length !== 1 ? 's' : ''}.
                                You can set different prices and availability for each restaurant.
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={resetDishForm}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            {editingDish ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {dishes.map((dish) => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      restaurants={restaurants}
                      onEdit={editDish}
                      onDelete={handleDeleteDish}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimpleAdminDashboard;