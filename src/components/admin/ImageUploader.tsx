import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { convertHeicToJpeg, isHeicFile } from '@/utils/heicConverter';
import { Upload, X, Image, FileImage, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded?: (imageUrl: string) => void;
  bucket?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUploaded,
  bucket = 'gallery',
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // For HEIC files, we'll convert them, so they're valid
    if (isHeicFile(file)) {
      if (file.size > maxSize * 1024 * 1024) {
        return `Arquivo muito grande. Máximo ${maxSize}MB`;
      }
      return null;
    }

    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado: ${file.type}. Use: JPEG, PNG, WebP, HEIC`;
    }

    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${maxSize}MB`;
    }

    return null;
  };

  const generateFileName = (file: File): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  };

  const uploadFile = async (file: File) => {
    let processedFile = file;
    
    // Convert HEIC files to JPEG automatically
    if (isHeicFile(file)) {
      try {
        processedFile = await convertHeicToJpeg(file);
        toast({
          title: "Conversão automática",
          description: "Arquivo HEIC foi convertido para JPEG automaticamente",
        });
      } catch (error) {
        toast({
          title: "Erro na conversão",
          description: "Não foi possível converter o arquivo HEIC. Tente converter para JPEG antes do upload.",
          variant: "destructive",
        });
        return;
      }
    }

    const validationError = validateFile(processedFile);
    if (validationError) {
      toast({
        title: "Arquivo inválido",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const fileName = generateFileName(processedFile);
    const filePath = `${bucket}/${fileName}`;

    // Add to uploading files
    const uploadingFile: UploadingFile = {
      file: processedFile,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update upload status
      setUploadingFiles(prev => 
        prev.map(uf => 
          uf === uploadingFile 
            ? { ...uf, status: 'success', progress: 100, url: publicUrl }
            : uf
        )
      );

      // Call callback
      onImageUploaded?.(publicUrl);

      toast({
        title: "Upload concluído",
        description: "Imagem enviada com sucesso!",
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      // Update upload status
      setUploadingFiles(prev => 
        prev.map(uf => 
          uf === uploadingFile 
            ? { ...uf, status: 'error', error: 'Falha no upload' }
            : uf
        )
      );

      toast({
        title: "Erro no upload",
        description: "Falha ao enviar a imagem",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      toast({
        title: "Muitos arquivos",
        description: `Máximo de ${maxFiles} arquivos por vez`,
        variant: "destructive",
      });
      return;
    }

    fileArray.forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeUploadingFile = (file: UploadingFile) => {
    setUploadingFiles(prev => prev.filter(uf => uf !== file));
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-center text-muted-foreground">
                Arraste suas fotos aqui ou clique para selecionar
              </p>
              <p className="text-center text-xs text-muted-foreground mt-1">
                Aceita JPEG, PNG, WebP, HEIC e HEIF (máximo {maxSize}MB cada)
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Arquivos HEIC serão convertidos automaticamente para JPEG
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4"
            >
              <FileImage className="w-4 h-4 mr-2" />
              Selecionar Fotos
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Enviando arquivos:</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {uploadingFile.status === 'uploading' && (
                    <Image className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {uploadingFile.status === 'success' && (
                    <Image className="w-5 h-5 text-green-500" />
                  )}
                  {uploadingFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {uploadingFile.status === 'uploading' && (
                    <Progress value={uploadingFile.progress} className="mt-2 h-2" />
                  )}
                  
                  {uploadingFile.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">
                      {uploadingFile.error}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadingFile(uploadingFile)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};