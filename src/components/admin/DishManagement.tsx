import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Utensils, Upload, Image as ImageIcon } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { useChopTymData } from '@/hooks/useChopTymData';
import { useToast } from '@/hooks/use-toast';
import { DishFormData } from '@/types/admin';
import { Dish } from '@/types/restaurant';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';

interface ImageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
  public_url: string;
}

const DISH_CATEGORIES: Array<'Traditional' | 'Soup' | 'Rice' | 'Grilled' | 'Snacks' | 'Drinks'> = [
  'Traditional', 'Soup', 'Rice', 'Grilled', 'Snacks', 'Drinks'
];

const DishManagement = () => {
  const { dishes, createDish, updateDish, deleteDish, loading } = useAdminData();
  const { uploadImage } = useChopTymData();
  const { toast } = useToast();
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [activeTab, setActiveTab] = useState('dishes');

  const [formData, setFormData] = useState<DishFormData>({
    name: '',
    description: '',
    category: 'Traditional',
    image_url: '',
    is_popular: false,
    is_spicy: false,
    is_vegetarian: false,
    cook_time: '30-45 min',
    serves: '1-2 people',
    active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Traditional',
      image_url: '',
      is_popular: false,
      is_spicy: false,
      is_vegetarian: false,
      cook_time: '30-45 min',
      serves: '1-2 people',
      active: true
    });
    setSelectedImage(null);
    setEditingDish(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedFormData = { ...formData };

      // If an image was selected from the gallery, use it
      if (selectedImage) {
        updatedFormData.image_url = selectedImage.public_url;
      }

      const result = editingDish
        ? await updateDish(editingDish.id, updatedFormData)
        : await createDish(updatedFormData);

      if (result.success) {
        toast({
          title: "Success",
          description: `Dish ${editingDish ? 'updated' : 'created'} successfully`,
        });
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast({
          title: "Error",
          description: result.message || `Failed to ${editingDish ? 'update' : 'create'} dish`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingDish ? 'update' : 'create'} dish`,
        variant: "destructive",
      });
    }
  };

  const handleImageUploaded = (imageData: { image_url: string }) => {
    setFormData(prev => ({ ...prev, image_url: imageData.image_url }));
    toast({
      title: "Image uploaded",
      description: "Image has been uploaded and set for this dish",
    });
  };

  const handleImageSelect = (image: ImageFile) => {
    setSelectedImage(image);
    setFormData(prev => ({ ...prev, image_url: image.public_url }));
    toast({
      title: "Image selected",
      description: "Image has been selected from gallery",
    });
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || '',
      category: dish.category,
      image_url: dish.image_url || '',
      is_popular: dish.is_popular,
      is_spicy: dish.is_spicy,
      is_vegetarian: dish.is_vegetarian,
      cook_time: dish.cook_time,
      serves: dish.serves,
      active: dish.active
    });
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const result = await deleteDish(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Dish deleted successfully",
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

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData, 
      category: value as 'Traditional' | 'Soup' | 'Rice' | 'Grilled' | 'Snacks' | 'Drinks'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-choptym-brown">Dish Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dishes" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Manage Dishes
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Manage Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dishes" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">Manage your restaurant dishes</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="choptym-gradient hover:opacity-90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Dish
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDish ? 'Edit Dish' : 'Add New Dish'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Dish Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={handleCategoryChange} value={formData.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISH_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the dish..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Dish Image</Label>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload New</TabsTrigger>
                      <TabsTrigger value="gallery">Select from Gallery</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-2">
                      <ImageUpload
                        onImageUploaded={handleImageUploaded}
                        category="dishes"
                        entityType="dish"
                        entityId={editingDish?.id || 'new'}
                        className="w-full"
                      />
                    </TabsContent>

                    <TabsContent value="gallery" className="space-y-2">
                      <ImageGallery
                        category="dishes"
                        entityType="dish"
                        onImageSelect={handleImageSelect}
                        selectable={true}
                        showControls={true}
                        className="max-h-96 overflow-y-auto"
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {formData.image_url && (
                  <div>
                    <Label>Current Image</Label>
                    <div className="mt-2 relative">
                      <img
                        src={formData.image_url}
                        alt="Current dish"
                        className="w-24 h-24 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cook_time">Cook Time</Label>
                  <Input
                    id="cook_time"
                    value={formData.cook_time}
                    onChange={(e) => setFormData({...formData, cook_time: e.target.value})}
                    placeholder="e.g., 30-45 min"
                  />
                </div>
                <div>
                  <Label htmlFor="serves">Serves</Label>
                  <Input
                    id="serves"
                    value={formData.serves}
                    onChange={(e) => setFormData({...formData, serves: e.target.value})}
                    placeholder="e.g., 1-2 people"
                  />
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_popular">Popular</Label>
                  <Switch
                    id="is_popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({...formData, is_popular: checked})}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_spicy">Spicy</Label>
                  <Switch
                    id="is_spicy"
                    checked={formData.is_spicy}
                    onCheckedChange={(checked) => setFormData({...formData, is_spicy: checked})}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="is_vegetarian">Vegetarian</Label>
                  <Switch
                    id="is_vegetarian"
                    checked={formData.is_vegetarian}
                    onCheckedChange={(checked) => setFormData({...formData, is_vegetarian: checked})}
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
                  className="choptym-gradient hover:opacity-90 text-white"
                >
                  {editingDish ? 'Update' : 'Create'} Dish
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Dishes ({dishes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Cook Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {dish.image_url && (
                        <img 
                          src={dish.image_url} 
                          alt={dish.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      {dish.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{dish.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {dish.is_popular && (
                        <Badge className="bg-choptym-orange text-white text-xs">Popular</Badge>
                      )}
                      {dish.is_spicy && (
                        <Badge variant="destructive" className="text-xs">Spicy</Badge>
                      )}
                      {dish.is_vegetarian && (
                        <Badge className="bg-green-500 text-white text-xs">Vegetarian</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{dish.cook_time}</TableCell>
                  <TableCell>
                    <Badge variant={dish.active ? "default" : "secondary"}>
                      {dish.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(dish)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(dish.id, dish.name)}
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
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Upload New Images</h3>
              <ImageUpload
                onImageUploaded={(data) => {
                  toast({
                    title: "Image uploaded",
                    description: "Image has been uploaded to Supabase Storage",
                  });
                }}
                category="dishes"
                entityType="dish"
                className="w-full"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Image Gallery</h3>
              <ImageGallery
                category="dishes"
                entityType="dish"
                showControls={true}
                className="max-h-96 overflow-y-auto"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DishManagement;
