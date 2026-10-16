import { PDFDocument } from 'pdf-lib';

export const createSimplePdf = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  page.drawText('MariKit PDF Tool', { x: 50, y: 350, size: 20 });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};