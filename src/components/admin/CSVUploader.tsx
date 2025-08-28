import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';

const CSVUploader = () => {
  const { toast } = useToast();
  const { refetch } = useAdminData();
  const [uploading, setUploading] = useState(false);

  const downloadTemplate = () => {
    const csvContent = `restaurant_name,town,contact_number,dish_name,dish_description,dish_category,price,cook_time,serves,is_popular,is_spicy,is_vegetarian
ChopTym Delights,Douala,673289043,Jollof Rice,Delicious spiced rice with vegetables,Rice,2500,30-45 min,2-3 people,true,false,false
ChopTym Delights,Douala,673289043,Pepper Soup,Spicy traditional soup,Soup,1800,25-30 min,1-2 people,false,true,false`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restaurant_menu_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate headers
      const requiredHeaders = ['restaurant_name', 'town', 'contact_number', 'dish_name', 'dish_category', 'price'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      const restaurants = new Map();
      const dishes = new Map();
      const menuItems = [];

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Create or get restaurant
        const restaurantKey = `${row.restaurant_name}-${row.town}`;
        if (!restaurants.has(restaurantKey)) {
          const restaurantData = {
            name: row.restaurant_name,
            town: row.town,
            contact_number: row.contact_number,
            active: true,
            delivery_time_min: 15,
            delivery_time_max: 45
          };
          restaurants.set(restaurantKey, restaurantData);
        }

        // Create dish
        const dishKey = row.dish_name;
        if (!dishes.has(dishKey)) {
          const dishData = {
            name: row.dish_name,
            description: row.dish_description || '',
            category: row.dish_category,
            cook_time: row.cook_time || '30-45 min',
            serves: row.serves || '1-2 people',
            is_popular: row.is_popular === 'true',
            is_spicy: row.is_spicy === 'true',
            is_vegetarian: row.is_vegetarian === 'true',
            active: true,
            admin_created: true
          };
          dishes.set(dishKey, dishData);
        }

        // Store menu item data
        menuItems.push({
          restaurant_key: restaurantKey,
          dish_name: row.dish_name,
          price: parseInt(row.price) || 0
        });
      }

      // Insert restaurants
      const restaurantResults = await Promise.all(
        Array.from(restaurants.values()).map(async (restaurant) => {
          const { data, error } = await supabase
            .from('restaurants')
            .insert([restaurant])
            .select()
            .single();
          return { data, error, name: restaurant.name, town: restaurant.town };
        })
      );

      // Insert dishes
      const dishResults = await Promise.all(
        Array.from(dishes.values()).map(async (dish) => {
          const { data, error } = await supabase
            .from('dishes')
            .insert([dish])
            .select()
            .single();
          return { data, error, name: dish.name };
        })
      );

      // Create restaurant and dish maps for menu items
      const restaurantMap = new Map();
      const dishMap = new Map();
      
      restaurantResults.forEach(result => {
        if (result.data) {
          restaurantMap.set(`${result.name}-${result.town}`, result.data.id);
        }
      });
      
      dishResults.forEach(result => {
        if (result.data) {
          dishMap.set(result.name, result.data.id);
        }
      });

      // Insert menu items
      const menuInserts = menuItems.map(item => ({
        restaurant_id: restaurantMap.get(item.restaurant_key),
        dish_id: dishMap.get(item.dish_name),
        price: item.price,
        availability: true
      })).filter(item => item.restaurant_id && item.dish_id);

      if (menuInserts.length > 0) {
        await supabase.from('restaurant_menus').insert(menuInserts);
      }

      await refetch();
      
      toast({
        title: "Upload Successful",
        description: `Processed ${restaurants.size} restaurants, ${dishes.size} dishes, and ${menuInserts.length} menu items`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process CSV file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          CSV Restaurant & Menu Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <Button
                disabled={uploading}
                className="choptym-gradient hover:opacity-90 text-white"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </span>
              </Button>
            </Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>CSV Format Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Required columns: restaurant_name, town, contact_number, dish_name, dish_category, price</li>
            <li>Optional columns: dish_description, cook_time, serves, is_popular, is_spicy, is_vegetarian</li>
            <li>Categories: Traditional, Soup, Rice, Grilled, Snacks, Drinks</li>
            <li>Boolean values: true/false for is_popular, is_spicy, is_vegetarian</li>
            <li>Prices should be in whole numbers (e.g., 2500 for 2500 FCFA)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVUploader;