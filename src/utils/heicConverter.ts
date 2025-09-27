import heic2any from 'heic2any';

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  // Check if the file is HEIC/HEIF
  if (!file.type.includes('heic') && !file.type.includes('heif')) {
    return file; // Return original file if not HEIC
  }

  try {
    // Convert HEIC to JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });

    // Create a new File object from the converted blob
    const convertedFile = new File(
      [convertedBlob as Blob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      {
        type: 'image/jpeg',
        lastModified: Date.now()
      }
    );

    return convertedFile;
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error('Falha ao converter arquivo HEIC. Tente converter para JPEG antes do upload.');
  }
};

export const isHeicFile = (file: File): boolean => {
  return file.type.includes('heic') || file.type.includes('heif') || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
};