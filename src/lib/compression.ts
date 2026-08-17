import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

export async function compressImage(file: File): Promise<File> {
  // If it's not an image, return the original file
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Maximum size 500KB
  const MAX_SIZE_MB = 0.5;
  const MAX_WIDTH_HEIGHT = 1920;

  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_HEIGHT,
    useWebWorker: true,
    initialQuality: 0.8,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert Blob to File to maintain filename and type
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    // Fallback to original file if compression fails
    return file;
  }
}

export async function compressPDF(file: File): Promise<File> {
  if (file.type !== 'application/pdf') {
    return file;
  }

  // Max size 2MB limit validation check
  const MAX_PDF_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_PDF_SIZE) {
    throw new Error('Ukuran file PDF melebihi batas maksimal 2MB. Silakan kompresi mandiri terlebih dahulu.');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Save the PDF without modifying it but it might reduce some metadata
    // pdf-lib's save() doesn't inherently "compress" like Ghostscript, but it can sometimes reduce size.
    // For proper compression, usually server-side tools are needed. 
    // Here we at least validate and do a basic save.
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false }); 
    
    return new File([pdfBytes as unknown as BlobPart], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return file;
  }
}

export async function compressFile(file: File): Promise<File> {
  if (file.type.startsWith('image/')) {
    return compressImage(file);
  } else if (file.type === 'application/pdf') {
    return compressPDF(file);
  }
  return file;
}
