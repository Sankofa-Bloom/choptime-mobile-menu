import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useChopTymData } from '@/hooks/useChopTymData';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadResult {
  success: boolean;
  image_url: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface ImageUploadProps {
  onImageUploaded?: (imageData: ImageUploadResult) => void;
  category?: string;
  entityType?: string;
  entityId?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  category = 'general',
  entityType,
  entityId,
  maxSize = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage } = useChopTymData();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: `Please select a file with one of these types: ${allowedTypes.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: 'File too large',
        description: `Please select a file smaller than ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const metadata = {
        category,
        entity_type: entityType,
        entity_id: entityId
      };

      const result = await uploadImage(selectedFile, metadata);

      toast({
        title: 'Upload successful',
        description: 'Image has been uploaded to Supabase Storage',
      });

      onImageUploaded?.(result);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Select Image</Label>
          <Input
            id="image-upload"
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Max size: {maxSize}MB • Allowed: {allowedTypes.join(', ')}
          </p>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                {selectedFile.name} • {formatFileSize(selectedFile.size)}
              </p>
            )}
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload to Supabase Storage
              </>
            )}
          </Button>
        )}

        {/* Info */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <p className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4" />
            <strong>Supabase Storage Integration</strong>
          </p>
          <p>
            Images will be uploaded to Supabase Storage with organized folder structure:
            <code className="bg-background px-1 py-0.5 rounded text-xs ml-1">
              {category}/{entityType || 'general'}{entityId ? `/${entityId}` : ''}
            </code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;