import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  User, 
  DollarSign,
  Truck,
  Star,
  Edit,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Navigation
} from 'lucide-react';
import { Order } from '@/types/restaurant';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './NotificationSystem';
import DataSearchFilters from './DataSearchFilters';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface OrderFilters {
  search: string;
  status?: string;
  payment_status?: string;
  restaurant_id?: string;
  date_from?: string;
  date_to?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface OrderUpdateData {
  status?: string;
  payment_status?: string;
  estimated_delivery_time?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  special_instructions?: string;
  preparation_time?: number;
}

// =============================================================================
// COMPREHENSIVE ORDER MANAGEMENT COMPONENT
// =============================================================================

const ComprehensiveOrderManagement: React.FC = () => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [updateData, setUpdateData] = useState<OrderUpdateData>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const { addNotification } = useNotifications();

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  /**
   * Fetch all orders with real-time updates
   */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants(name, town, contact_number),
          dishes(name, category)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      applyFilters(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification, applyFilters]);

  /**
   * Apply filters to orders
   */
  const applyFilters = useCallback((ordersToFilter: Order[]) => {
    let filtered = [...ordersToFilter];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(order => 
        order.user_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.user_phone?.includes(filters.search) ||
        order.dish_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.restaurant_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.order_reference?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Payment status filter
    if (filters.payment_status && filters.payment_status !== 'all') {
      filtered = filtered.filter(order => order.payment_status === filters.payment_status);
    }

    // Restaurant filter
    if (filters.restaurant_id && filters.restaurant_id !== 'all') {
      filtered = filtered.filter(order => order.restaurant_id === filters.restaurant_id);
    }

    // Date range filter
    if (filters.date_from) {
      filtered = filtered.filter(order => 
        order.created_at && order.created_at >= filters.date_from!
      );
    }
    if (filters.date_to) {
      filtered = filtered.filter(order => 
        order.created_at && order.created_at <= filters.date_to! + 'T23:59:59'
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Order] || '';
      const bValue = b[filters.sortBy as keyof Order] || '';
      
      if (filters.sortOrder === 'desc') {
        return String(bValue).localeCompare(String(aValue));
      }
      return String(aValue).localeCompare(String(bValue));
    });

    setFilteredOrders(filtered);
  }, [filters]);

  // =============================================================================
  // ORDER MANAGEMENT FUNCTIONS
  // =============================================================================

  /**
   * Update order status
   */
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);

      const updateFields: {
        status: string;
        confirmed_at?: string;
        preparing_at?: string;
        ready_at?: string;
        out_for_delivery_at?: string;
        delivered_at?: string;
      } = { status: newStatus };
      
      // Add timestamp for status changes
      switch (newStatus) {
        case 'confirmed':
          updateFields.confirmed_at = new Date().toISOString();
          break;
        case 'preparing':
          updateFields.preparing_at = new Date().toISOString();
          break;
        case 'ready':
          updateFields.ready_at = new Date().toISOString();
          break;
        case 'out_for_delivery':
          updateFields.out_for_delivery_at = new Date().toISOString();
          break;
        case 'delivered':
          updateFields.delivered_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateFields)
        .eq('id', orderId);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Order Updated',
        message: `Order status changed to ${newStatus}`,
        duration: 4000
      });

      await fetchOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update payment status
   */
  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Payment Updated',
        message: `Payment status changed to ${newPaymentStatus}`,
        duration: 4000
      });

      await fetchOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update order with multiple fields
   */
  const updateOrderDetails = async () => {
    if (!editingOrder) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', editingOrder.id);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Order Updated',
        message: 'Order details updated successfully',
        duration: 4000
      });

      setShowEditModal(false);
      setEditingOrder(null);
      setUpdateData({});
      await fetchOrders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  /**
   * Get status badge variant
   */
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'preparing': return 'default';
      case 'ready': return 'default';
      case 'out_for_delivery': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  /**
   * Get payment status badge variant
   */
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return `₵${amount.toFixed(2)}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    applyFilters(orders);
  }, [orders, applyFilters]);

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render order card
   */
  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Order header */}
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-choptym-orange" />
              <span className="font-medium text-gray-900">
                {order.order_reference || `Order #${order.id?.slice(-6)}`}
              </span>
              <Badge variant={getStatusBadgeVariant(order.status || 'pending')}>
                {order.status || 'pending'}
              </Badge>
              <Badge variant={getPaymentStatusBadgeVariant(order.payment_status || 'pending')}>
                {order.payment_status || 'pending'}
              </Badge>
            </div>

            {/* Customer info */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{order.user_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{order.user_phone}</span>
              </div>
            </div>

            {/* Order details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{order.dish_name}</span>
                <span className="text-gray-500">x{order.quantity}</span>
              </div>
              <div className="text-sm text-gray-600">
                {order.restaurant_name}
              </div>
            </div>

            {/* Location and delivery */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{order.user_location}</span>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Ordered: {formatDate(order.created_at || '')}</span>
              {order.estimated_delivery_time && (
                <span>• Est. delivery: {order.estimated_delivery_time}</span>
              )}
            </div>
          </div>

          {/* Amount and actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="font-semibold text-green-600">
                {formatCurrency(order.total_amount)}
              </div>
              {order.delivery_fee && (
                <div className="text-xs text-gray-500">
                  + {formatCurrency(order.delivery_fee)} delivery
                </div>
              )}
            </div>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowDetailsModal(true);
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingOrder(order);
                  setUpdateData({
                    status: order.status,
                    payment_status: order.payment_status,
                    estimated_delivery_time: order.estimated_delivery_time,
                    driver_name: order.driver_name,
                    driver_phone: order.driver_phone,
                    special_instructions: order.special_instructions,
                    preparation_time: order.preparation_time
                  });
                  setShowEditModal(true);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>

            {/* Quick status actions */}
            <div className="flex gap-1">
              {order.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id!, 'confirmed')}
                  disabled={loading}
                  className="text-xs"
                >
                  Confirm
                </Button>
              )}
              {order.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id!, 'preparing')}
                  disabled={loading}
                  className="text-xs"
                >
                  Prepare
                </Button>
              )}
              {order.status === 'preparing' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id!, 'ready')}
                  disabled={loading}
                  className="text-xs"
                >
                  Ready
                </Button>
              )}
              {order.status === 'ready' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id!, 'out_for_delivery')}
                  disabled={loading}
                  className="text-xs"
                >
                  Dispatch
                </Button>
              )}
              {order.status === 'out_for_delivery' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id!, 'delivered')}
                  disabled={loading}
                  className="text-xs"
                >
                  Delivered
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  /**
   * Render edit modal
   */
  const renderEditModal = () => (
    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Order Details
          </DialogTitle>
        </DialogHeader>

        {editingOrder && (
          <div className="space-y-4">
            {/* Order status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select
                  value={updateData.status || editingOrder.status}
                  onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select
                  value={updateData.payment_status || editingOrder.payment_status}
                  onValueChange={(value) => setUpdateData(prev => ({ ...prev, payment_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Delivery details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_delivery_time">Estimated Delivery Time</Label>
                <Input
                  type="datetime-local"
                  value={updateData.estimated_delivery_time || editingOrder.estimated_delivery_time || ''}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, estimated_delivery_time: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="preparation_time">Preparation Time (minutes)</Label>
                <Input
                  type="number"
                  value={updateData.preparation_time || editingOrder.preparation_time || ''}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) }))}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            {/* Driver details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driver_name">Driver Name</Label>
                <Input
                  value={updateData.driver_name || editingOrder.driver_name || ''}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, driver_name: e.target.value }))}
                  placeholder="Driver name"
                />
              </div>

              <div>
                <Label htmlFor="driver_phone">Driver Phone</Label>
                <Input
                  value={updateData.driver_phone || editingOrder.driver_phone || ''}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, driver_phone: e.target.value }))}
                  placeholder="Driver phone number"
                />
              </div>
            </div>

            {/* Special instructions */}
            <div>
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                value={updateData.special_instructions || editingOrder.special_instructions || ''}
                onChange={(e) => setUpdateData(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder="Any special delivery instructions..."
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={updateOrderDetails}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Order'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  /**
   * Render details modal
   */
  const renderDetailsModal = () => (
    <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Order Details
          </DialogTitle>
        </DialogHeader>

        {selectedOrder && (
          <div className="space-y-6">
            {/* Order summary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Reference:</strong> {selectedOrder.order_reference || 'N/A'}</div>
                  <div><strong>Status:</strong> 
                    <Badge variant={getStatusBadgeVariant(selectedOrder.status || 'pending')} className="ml-2">
                      {selectedOrder.status || 'pending'}
                    </Badge>
                  </div>
                  <div><strong>Payment:</strong> 
                    <Badge variant={getPaymentStatusBadgeVariant(selectedOrder.payment_status || 'pending')} className="ml-2">
                      {selectedOrder.payment_status || 'pending'}
                    </Badge>
                  </div>
                  <div><strong>Method:</strong> {selectedOrder.payment_method || 'N/A'}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {selectedOrder.user_name}</div>
                  <div><strong>Phone:</strong> {selectedOrder.user_phone}</div>
                  <div><strong>Location:</strong> {selectedOrder.user_location}</div>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{selectedOrder.dish_name}</div>
                    <div className="text-sm text-gray-600">{selectedOrder.restaurant_name}</div>
                  </div>
                  <div className="text-right">
                    <div>Qty: {selectedOrder.quantity}</div>
                    <div className="font-semibold">{formatCurrency(selectedOrder.price * selectedOrder.quantity)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing breakdown */}
            <div>
              <h3 className="font-semibold mb-2">Pricing Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedOrder.price * selectedOrder.quantity)}</span>
                </div>
                {selectedOrder.delivery_fee && (
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Delivery information */}
            {(selectedOrder.driver_name || selectedOrder.estimated_delivery_time) && (
              <div>
                <h3 className="font-semibold mb-2">Delivery Information</h3>
                <div className="space-y-1 text-sm">
                  {selectedOrder.driver_name && (
                    <div><strong>Driver:</strong> {selectedOrder.driver_name}</div>
                  )}
                  {selectedOrder.driver_phone && (
                    <div><strong>Driver Phone:</strong> {selectedOrder.driver_phone}</div>
                  )}
                  {selectedOrder.estimated_delivery_time && (
                    <div><strong>Estimated Delivery:</strong> {selectedOrder.estimated_delivery_time}</div>
                  )}
                  {selectedOrder.preparation_time && (
                    <div><strong>Preparation Time:</strong> {selectedOrder.preparation_time} minutes</div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-2">Order Timeline</h3>
              <div className="space-y-2 text-sm">
                {selectedOrder.created_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Ordered: {formatDate(selectedOrder.created_at)}</span>
                  </div>
                )}
                {selectedOrder.confirmed_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Confirmed: {formatDate(selectedOrder.confirmed_at)}</span>
                  </div>
                )}
                {selectedOrder.preparing_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Preparing: {formatDate(selectedOrder.preparing_at)}</span>
                  </div>
                )}
                {selectedOrder.ready_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Ready: {formatDate(selectedOrder.ready_at)}</span>
                  </div>
                )}
                {selectedOrder.out_for_delivery_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Out for Delivery: {formatDate(selectedOrder.out_for_delivery_at)}</span>
                  </div>
                )}
                {selectedOrder.delivered_at && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Delivered: {formatDate(selectedOrder.delivered_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Special instructions */}
            {selectedOrder.special_instructions && (
              <div>
                <h3 className="font-semibold mb-2">Special Instructions</h3>
                <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                  {selectedOrder.special_instructions}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, phone, dish..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={filters.payment_status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, payment_status: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_from">Date From</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredOrders.length}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredOrders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status || '')).length}
                </div>
                <div className="text-sm text-gray-600">Active Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredOrders.filter(o => o.status === 'delivered').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredOrders.filter(o => o.payment_status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Paid Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(filteredOrders.reduce((sum, o) => sum + o.total_amount, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-choptym-orange mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {filters.search || filters.status || filters.payment_status
                  ? 'No orders match your current filters.'
                  : 'No orders have been placed yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </div>

      {/* Modals */}
      {renderEditModal()}
      {renderDetailsModal()}
    </div>
  );
};

export default ComprehensiveOrderManagement;