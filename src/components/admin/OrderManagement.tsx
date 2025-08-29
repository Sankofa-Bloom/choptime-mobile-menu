import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ChopTymLoader from '@/components/ui/ChopTymLoader';
import { Order, CustomOrder } from '@/types/restaurant';
import { toast } from '@/components/ui/use-toast';
import notificationService from '@/utils/notificationService';

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch regular orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ordersError) {
        setOrders(ordersData || []);
      }

      // Fetch custom orders
      const { data: customOrdersData, error: customOrdersError } = await supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!customOrdersError) {
        setCustomOrders(customOrdersData || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-emerald-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Combine and filter orders
  const allOrders = [
    ...orders.map(order => ({ ...order, type: 'regular' })),
    ...customOrders.map(order => ({ ...order, type: 'custom' }))
  ].filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_phone.includes(searchTerm) ||
      (order.order_reference && order.order_reference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

  const handleStatusChange = async (
    order: { id: string; type: 'regular' | 'custom' },
    newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  ) => {
    try {
      const table = order.type === 'regular' ? 'orders' : 'custom_orders';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', order.id);
      if (error) throw error;

      // Send push notification to customer
      try {
        const restaurantName = order.restaurant_name || 'ChopTym';
        await notificationService.notifyOrderStatusUpdate(
          order.id,
          newStatus,
          restaurantName
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      // Also send notification via backend API
      try {
        await fetch('/api/notify-order-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            status: newStatus,
            restaurantName: order.restaurant_name || 'ChopTym',
            userId: order.user_email || 'anonymous' // Use email as user ID if available
          })
        });
      } catch (apiError) {
        console.error('Failed to send backend notification:', apiError);
      }

      toast({
        title: 'Status Updated',
        description: `Order status updated to ${newStatus}.`,
      });
      fetchOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-choptym-brown">Order Management</h2>
        <Button 
          onClick={fetchOrders}
          variant="outline"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Orders'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or order ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Orders ({allOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allOrders.map((order) => (
                <TableRow key={`${order.type}-${order.id}`}>
                  <TableCell className="font-mono text-sm">
                    {order.order_reference || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{order.user_name}</div>
                      <div className="text-sm text-muted-foreground">{order.user_phone}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-32">
                        {order.user_location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.type === 'regular' ? 'default' : 'secondary'}>
                      {order.type === 'regular' ? 'Menu' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {'dish_name' in order ? order.dish_name : order.custom_dish_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {order.quantity}
                      </div>
                      {order.type === 'custom' && 'special_instructions' in order && order.special_instructions && (
                        <div className="text-xs text-muted-foreground">
                          📝 {order.special_instructions}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{order.restaurant_name}</TableCell>
                  <TableCell className="font-semibold text-choptym-orange">
                    {formatPrice(order.total_amount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`text-white ${getStatusColor(order.status || 'pending')}`}
                    >
                      {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.created_at ? formatDate(order.created_at) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {allOrders.length === 0 && (
            <div className="text-center py-8">
              {loading ? (
                <ChopTymLoader 
                  size="md"
                  message="Loading orders..."
                  subMessage="Fetching order data"
                />
              ) : (
                <div className="text-muted-foreground">No orders found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
