export const convertHeicToJpeg = async (file: File): Promise<File> => {
  // Check MIME type and extension because iOS/Safari may provide an empty/odd MIME type.
  if (!isHeicFile(file)) {
    return file; // Return original file if not HEIC
  }

  try {
    // Convert HEIC to JPEG
    const heic2any = (await import('heic2any')).default;
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.7
    });

    // Create a new File object from the converted blob
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const convertedFile = new File(
      [blob as Blob], 
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
  return /heic|heif/i.test(file.type || '') || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
};