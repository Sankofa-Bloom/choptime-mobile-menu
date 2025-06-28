
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Store } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';
import { RestaurantFormData } from '@/types/admin';

const RestaurantManagement = () => {
  const { restaurants, createRestaurant, updateRestaurant, deleteRestaurant, loading } = useAdminData();
  const { toast } = useToast();
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    town: '',
    contact_number: '',
    mtn_number: '',
    orange_number: '',
    image_url: '',
    logo_url: '',
    active: true,
    delivery_time_min: 15,
    delivery_time_max: 45
  });

  const resetForm = () => {
    setFormData({
      name: '',
      town: '',
      contact_number: '',
      mtn_number: '',
      orange_number: '',
      image_url: '',
      logo_url: '',
      active: true,
      delivery_time_min: 15,
      delivery_time_max: 45
    });
    setEditingRestaurant(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = editingRestaurant 
      ? await updateRestaurant(editingRestaurant.id, formData)
      : await createRestaurant(formData);

    if (result.success) {
      toast({
        title: "Success",
        description: `Restaurant ${editingRestaurant ? 'updated' : 'created'} successfully`,
      });
      setIsDialogOpen(false);
      resetForm();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (restaurant: any) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      town: restaurant.town,
      contact_number: restaurant.contact_number,
      mtn_number: restaurant.mtn_number || '',
      orange_number: restaurant.orange_number || '',
      image_url: restaurant.image_url || '',
      logo_url: restaurant.logo_url || '',
      active: restaurant.active,
      delivery_time_min: restaurant.delivery_time_min,
      delivery_time_max: restaurant.delivery_time_max
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const result = await deleteRestaurant(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Restaurant deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-choptime-brown">Restaurant Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="choptime-gradient hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="town">Town *</Label>
                  <Select onValueChange={(value) => setFormData({...formData, town: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.town || "Select town"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buea">Buea</SelectItem>
                      <SelectItem value="Limbe">Limbe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact">Contact Number *</Label>
                  <Input
                    id="contact"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                    placeholder="+237 6XX XXX XXX"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mtn">MTN Money Number</Label>
                  <Input
                    id="mtn"
                    value={formData.mtn_number}
                    onChange={(e) => setFormData({...formData, mtn_number: e.target.value})}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orange">Orange Money Number</Label>
                  <Input
                    id="orange"
                    value={formData.orange_number}
                    onChange={(e) => setFormData({...formData, orange_number: e.target.value})}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_url">Restaurant Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_min">Min Delivery Time (minutes)</Label>
                  <Input
                    id="delivery_min"
                    type="number"
                    value={formData.delivery_time_min}
                    onChange={(e) => setFormData({...formData, delivery_time_min: parseInt(e.target.value)})}
                    min="5"
                    max="120"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_max">Max Delivery Time (minutes)</Label>
                  <Input
                    id="delivery_max"
                    type="number"
                    value={formData.delivery_time_max}
                    onChange={(e) => setFormData({...formData, delivery_time_max: parseInt(e.target.value)})}
                    min="10"
                    max="180"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="choptime-gradient hover:opacity-90 text-white"
                >
                  {editingRestaurant ? 'Update' : 'Create'} Restaurant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Restaurants ({restaurants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Town</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Delivery Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {restaurant.logo_url && (
                        <img 
                          src={restaurant.logo_url} 
                          alt={restaurant.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      {restaurant.name}
                    </div>
                  </TableCell>
                  <TableCell>{restaurant.town}</TableCell>
                  <TableCell>{restaurant.contact_number}</TableCell>
                  <TableCell>
                    {restaurant.delivery_time_min}-{restaurant.delivery_time_max} min
                  </TableCell>
                  <TableCell>
                    <Badge variant={restaurant.active ? "default" : "secondary"}>
                      {restaurant.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(restaurant)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(restaurant.id, restaurant.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantManagement;
