
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
import { Plus, Edit, Truck } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';
import { DeliveryZone } from '@/types/admin';

const DeliveryManagement = () => {
  const { deliveryZones, createDeliveryZone, updateDeliveryZone, loading } = useAdminData();
  const { toast } = useToast();
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    town: '',
    zone_name: '',
    distance_min: 0,
    distance_max: 5,
    fee: 500,
    active: true
  });

  const resetForm = () => {
    setFormData({
      town: '',
      zone_name: '',
      distance_min: 0,
      distance_max: 5,
      fee: 500,
      active: true
    });
    setEditingZone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = editingZone 
      ? await updateDeliveryZone(editingZone.id, formData)
      : await createDeliveryZone(formData);

    if (result.success) {
      toast({
        title: "Success",
        description: `Delivery zone ${editingZone ? 'updated' : 'created'} successfully`,
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

  const handleEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      town: zone.town,
      zone_name: zone.zone_name,
      distance_min: zone.distance_min,
      distance_max: zone.distance_max,
      fee: zone.fee,
      active: zone.active
    });
    setIsDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  // Group zones by town
  const zonesByTown = deliveryZones.reduce((acc, zone) => {
    if (!acc[zone.town]) {
      acc[zone.town] = [];
    }
    acc[zone.town].push(zone);
    return acc;
  }, {} as Record<string, DeliveryZone[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-choptime-brown">Delivery Zone Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="choptime-gradient hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <Label htmlFor="zone_name">Zone Name *</Label>
                <Input
                  id="zone_name"
                  value={formData.zone_name}
                  onChange={(e) => setFormData({...formData, zone_name: e.target.value})}
                  placeholder="e.g., Town Center, Suburbs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="distance_min">Min Distance (km)</Label>
                  <Input
                    id="distance_min"
                    type="number"
                    value={formData.distance_min}
                    onChange={(e) => setFormData({...formData, distance_min: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="distance_max">Max Distance (km)</Label>
                  <Input
                    id="distance_max"
                    type="number"
                    value={formData.distance_max}
                    onChange={(e) => setFormData({...formData, distance_max: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fee">Delivery Fee (FCFA) *</Label>
                <Input
                  id="fee"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({...formData, fee: parseInt(e.target.value)})}
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                />
                <Label htmlFor="active">Active</Label>
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
                  {editingZone ? 'Update' : 'Create'} Zone
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(zonesByTown).map(([town, zones]) => (
          <Card key={town}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {town} Delivery Zones ({zones.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">
                        {zone.zone_name}
                      </TableCell>
                      <TableCell>
                        {zone.distance_min}-{zone.distance_max}km
                      </TableCell>
                      <TableCell className="font-semibold text-choptime-orange">
                        {formatPrice(zone.fee)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={zone.active ? "default" : "secondary"}>
                          {zone.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(zone)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeliveryManagement;
