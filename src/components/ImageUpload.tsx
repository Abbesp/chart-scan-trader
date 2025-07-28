import { useState, useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImageUploaded: (file: File, imageUrl: string) => void;
  uploadedImage?: string;
  onRemoveImage: () => void;
}

export const ImageUpload = ({ onImageUploaded, uploadedImage, onRemoveImage }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    onImageUploaded(file, imageUrl);
    toast.success('Chart uploaded successfully!');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  if (uploadedImage) {
    return (
      <Card className="relative">
        <img 
          src={uploadedImage} 
          alt="Uploaded chart" 
          className="w-full h-auto rounded-lg"
        />
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2"
          onClick={onRemoveImage}
        >
          <X className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-2 border-dashed transition-all duration-300 ${
        isDragging 
          ? 'border-primary bg-primary/5 shadow-neon' 
          : 'border-border hover:border-primary/50'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
    >
      <div className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-gradient-primary">
            <Upload className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload Chart Screenshot</h3>
            <p className="text-muted-foreground">
              Drag and drop your trading chart or click to browse
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-primary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
            
            <Button variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Take Screenshot
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, WebP up to 10MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </Card>
  );
};