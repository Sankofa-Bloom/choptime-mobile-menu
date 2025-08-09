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
import { supabase } from '@/integrations/supabase/client';

const RestaurantManagement = () => {
  const { restaurants, createRestaurant, updateRestaurant, deleteRestaurant, loading } = useAdminData();
  const { toast } = useToast();
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    town: '',
    contact_number: '',
    image_url: '',
    logo_url: '',
    active: true,
    delivery_time_min: 15,
    delivery_time_max: 45
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      town: '',
      contact_number: '',
      image_url: '',
      logo_url: '',
      active: true,
      delivery_time_min: 15,
      delivery_time_max: 45
    });
    setImageFile(null);
    setLogoFile(null);
    setEditingRestaurant(null);
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const updatedFormData = { ...formData };
      // Upload image file if provided
      if (imageFile) {
        const imagePath = `restaurants/${Date.now()}-${imageFile.name}`;
        const imageUrl = await uploadFile(imageFile, 'restaurant-images', imagePath);
        if (imageUrl) {
          updatedFormData.image_url = imageUrl;
        }
      }
      // Upload logo file if provided
      if (logoFile) {
        const logoPath = `logos/${Date.now()}-${logoFile.name}`;
        const logoUrl = await uploadFile(logoFile, 'restaurant-images', logoPath);
        if (logoUrl) {
          updatedFormData.logo_url = logoUrl;
        }
      }
      const result = editingRestaurant 
        ? await updateRestaurant(editingRestaurant.id, updatedFormData)
        : await createRestaurant(updatedFormData);
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (restaurant: any) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      town: restaurant.town,
      contact_number: restaurant.contact_number,
      image_url: restaurant.image_url || '',
      logo_url: restaurant.logo_url || '',
      active: restaurant.active,
      delivery_time_min: restaurant.delivery_time_min,
      delivery_time_max: restaurant.delivery_time_max
    });
    setImageFile(null);
    setLogoFile(null);
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
        <h2 className="text-2xl font-bold text-choptym-brown">Restaurant Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="choptym-gradient hover:opacity-90 text-white"
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
                  <Label htmlFor="image_file">Restaurant Image</Label>
                  <Input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img src={formData.image_url} alt="Current" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                  {imageFile && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Selected: {imageFile.name}</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="logo_file">Restaurant Logo</Label>
                  <Input
                    id="logo_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                  {formData.logo_url && (
                    <div className="mt-2">
                      <img src={formData.logo_url} alt="Current logo" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                  {logoFile && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Selected: {logoFile.name}</span>
                    </div>
                  )}
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
                  disabled={uploading}
                  className="choptym-gradient hover:opacity-90 text-white"
                >
                  {uploading ? 'Processing...' : editingRestaurant ? 'Update' : 'Create'} Restaurant
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
