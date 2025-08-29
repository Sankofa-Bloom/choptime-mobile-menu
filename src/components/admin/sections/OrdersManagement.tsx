// Orders Management Section
// Clean orders management with filtering, search, and status updates

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orderNotificationService } from '@/services/orderNotificationService';
import { Order, OrderStats, ORDER_STATUSES } from '../types';

const OrdersManagement: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    if (updatingOrderId) {
      toast({
        title: 'Please wait',
        description: 'Another update is in progress',
        variant: 'default'
      });
      return;
    }

    try {
      console.log('🔄 Updating order status:', orderId, 'to', newStatus);
      setUpdatingOrderId(orderId);

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

      console.log('📤 Sending update to database:', updateData);

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('❌ Database update error:', error);
        toast({
          title: 'Update Failed',
          description: `Could not update order status: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ Database update successful:', data);

      // Update local state immediately for instant UI feedback
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, ...updateData }
          : order
      ));

      // Update selectedOrder if it's the same order (for modal)
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
      }

      toast({
        title: '✅ Status Updated',
        description: `Order status changed to ${newStatus.replace('_', ' ').toUpperCase()}`,
      });

      // Send notification to customer (don't await to avoid blocking UI)
      sendOrderStatusNotification(orderId, newStatus).catch(error => {
        console.error('Notification error:', error);
        // Don't show error toast for notification failures
      });

      // Refresh data after a short delay to ensure consistency
      setTimeout(async () => {
        try {
          await loadOrders();
        } catch (error) {
          console.error('Background refresh error:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error in updateOrderStatus:', error);
      toast({
        title: 'Update Failed',
        description: 'An unexpected error occurred while updating the order',
        variant: 'destructive'
      });
    } finally {
      setUpdatingOrderId(null);
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

  const getOrderStats = (): OrderStats => {
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
                {ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
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
                        className={`px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        disabled={updatingOrderId === order.id}
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {updatingOrderId === order.id ? 'Updating...' :
                             status === 'pending' ? 'Pending' :
                             status === 'confirmed' ? 'Confirm Order' :
                             status === 'preparing' ? 'Start Preparing' :
                             status === 'ready' ? 'Mark Ready' :
                             status === 'out_for_delivery' ? 'Out for Delivery' :
                             status === 'delivered' ? 'Mark Delivered' :
                             status === 'cancelled' ? 'Cancel Order' : status}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        disabled={updatingOrderId === order.id}
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
          updatingOrderId={updatingOrderId}
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
  updatingOrderId?: string | null;
}> = ({ order, onClose, onStatusUpdate, updatingOrderId }) => {
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
                  className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  value={order.status}
                  onChange={(e) => onStatusUpdate(order.id, e.target.value as Order['status'])}
                  disabled={updatingOrderId === order.id}
                >
                  {ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {updatingOrderId === order.id ? 'Updating...' :
                       status === 'pending' ? 'Pending' :
                       status === 'confirmed' ? 'Confirm Order' :
                       status === 'preparing' ? 'Start Preparing' :
                       status === 'ready' ? 'Mark Ready' :
                       status === 'out_for_delivery' ? 'Out for Delivery' :
                       status === 'delivered' ? 'Mark Delivered' :
                       status === 'cancelled' ? 'Cancel Order' : status}
                    </option>
                  ))}
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

export default OrdersManagement;