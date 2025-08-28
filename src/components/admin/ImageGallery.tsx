import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Grid,
  List,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { useChopTymData } from '@/hooks/useChopTymData';
import { useToast } from '@/hooks/use-toast';

interface ImageGalleryProps {
  category?: string;
  entityType?: string;
  entityId?: string;
  onImageSelect?: (image: any) => void;
  selectable?: boolean;
  showControls?: boolean;
  className?: string;
}

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

const ImageGallery: React.FC<ImageGalleryProps> = ({
  category,
  entityType,
  entityId,
  onImageSelect,
  selectable = false,
  showControls = true,
  className = ''
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const { listImages, deleteImage } = useChopTymData();
  const { toast } = useToast();

  const loadImages = async () => {
    try {
      setLoading(true);
      const result = await listImages(category, entityType, entityId);
      setImages(result.files || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load images',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [category, entityType, entityId]);

  const handleDelete = async (imageName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const filePath = `${category || 'general'}/${entityType || 'general'}/${entityId || 'general'}/${imageName}`;
      await deleteImage(filePath);

      toast({
        title: 'Success',
        description: 'Image deleted successfully'
      });

      // Reload images
      loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive'
      });
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'Image URL copied to clipboard'
    });
  };

  const handleSelectImage = (image: ImageFile) => {
    if (selectable) {
      onImageSelect?.(image);
      if (selectedImages.has(image.id)) {
        setSelectedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(image.id);
          return newSet;
        });
      } else {
        setSelectedImages(prev => new Set(prev).add(image.id));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading images...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredImages.length} of {images.length} images
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Images */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No images found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search term' : 'Upload some images to get started'}
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-2'
        }>
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className={`overflow-hidden transition-all duration-200 ${
                selectable ? 'cursor-pointer hover:shadow-lg' : ''
              } ${
                selectedImages.has(image.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSelectImage(image)}
            >
              <div className="relative">
                <img
                  src={image.public_url}
                  alt={image.name}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                {selectedImages.has(image.id) && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Badge className="bg-primary text-primary-foreground">
                      Selected
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={image.name}>
                      {image.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(image.metadata.size)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(image.created_at)}
                    </p>
                  </div>

                  {showControls && (
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(image.public_url);
                        }}
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(image.public_url, '_blank');
                        }}
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.name);
                        }}
                        className="text-destructive hover:text-destructive"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;