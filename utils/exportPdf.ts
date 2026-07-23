import jsPDF from 'jspdf';
import { CatalogObject } from '../types';

async function getImageDataUrl(url: string): Promise<{ dataUrl: string; format: string } | null> {
  return new Promise((resolve) => {
    // Check if it's already a base64 data URL
    if (url.startsWith('data:image/')) {
      const match = url.match(/^data:image\/(png|jpeg|jpg|webp);base64,/i);
      const format = match ? match[1].toUpperCase() : 'JPEG';
      resolve({ dataUrl: url, format: format === 'JPG' ? 'JPEG' : format });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ dataUrl, format: 'JPEG' });
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Could not convert image to canvas:', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function exportObjectToPdf(obj: CatalogObject): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner / Title
  doc.setFillColor(15, 15, 20); // Dark background
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Header text
  doc.setTextColor(220, 38, 38); // Arcane Red
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ARCANUM OBSCURUM - RELATÓRIO DE CAMPO', margin, 12);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID: ${obj.id} | Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 20);

  y = 35;

  // Title of the object
  doc.setTextColor(15, 23, 42); // Dark slate
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  const titleLines = doc.splitTextToSize(obj.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 2;

  // Metadata Grid / Badges box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);

  const dateStr = new Date(obj.dateAdded).toLocaleDateString('pt-BR');
  doc.text(`Data de Registro: ${dateStr}`, margin + 5, y + 7);
  doc.text(`Grau de Ameaça: ${obj.threatGrade || 'N/A'}`, margin + 5, y + 14);
  doc.text(`Nível de Poder: ${obj.powerLevel !== undefined ? obj.powerLevel : 'N/A'}`, margin + 5, y + 21);

  if (obj.bearer) {
    doc.text(`Portador: ${obj.bearer.name} (${obj.bearer.rank})`, margin + 90, y + 7);
  } else {
    doc.text(`Portador: Sem portador registrado`, margin + 90, y + 7);
  }

  if (obj.coordinates) {
    doc.text(`Coordenadas: LAT ${obj.coordinates.lat.toFixed(4)}, LNG ${obj.coordinates.lng.toFixed(4)}`, margin + 90, y + 14);
  } else if (obj.location) {
    doc.text(`Localização: ${obj.location}`, margin + 90, y + 14);
  }

  if (obj.tags && obj.tags.length > 0) {
    doc.text(`Tags: ${obj.tags.join(', ')}`, margin + 90, y + 21);
  }

  y += 32;

  // Add Image if available
  if (obj.imageUrl) {
    const imgData = await getImageDataUrl(obj.imageUrl);
    if (imgData) {
      try {
        const maxImgHeight = 65;
        const imgWidth = 100;
        const imgX = margin + (contentWidth - imgWidth) / 2;
        
        doc.addImage(imgData.dataUrl, imgData.format, imgX, y, imgWidth, maxImgHeight, undefined, 'FAST');
        
        doc.setDrawColor(200, 200, 200);
        doc.rect(imgX, y, imgWidth, maxImgHeight);
        y += maxImgHeight + 8;
      } catch (err) {
        console.warn('Could not add image to PDF:', err);
      }
    }
  }

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin + 10;
    }
  };

  // Section: Description
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('DESCRIÇÃO DO ARTEFATO', margin, y);
  y += 2;

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  const descLines = doc.splitTextToSize(obj.description || 'Nenhuma descrição fornecida.', contentWidth);
  checkPageBreak(descLines.length * 5);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 8;

  // Custom Fields
  if (obj.customFields && obj.customFields.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('PROPRIEDADES ADICIONAIS', margin, y);
    y += 2;

    doc.setDrawColor(220, 38, 38);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    for (const field of obj.customFields) {
      if (!field.key && !field.value) continue;
      const text = `• ${field.key}: ${field.value}`;
      const lines = doc.splitTextToSize(text, contentWidth);
      checkPageBreak(lines.length * 5);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    }
    y += 6;
  }

  // Containment Log
  if (obj.containmentLog) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text('REGISTRO DE CONTENÇÃO (ARQUIVO RESGUARDADO)', margin, y);
    y += 2;

    doc.setDrawColor(185, 28, 28);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    const logLines = doc.splitTextToSize(obj.containmentLog, contentWidth - 10);
    const boxHeight = logLines.length * 5 + 8;

    checkPageBreak(boxHeight + 5);

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(127, 29, 29);
    doc.text(logLines, margin + 5, y + 6);

    y += boxHeight + 8;
  }

  // Notes
  if (obj.notes) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('NOTAS CONFIDENCIAIS', margin, y);
    y += 2;

    doc.setDrawColor(220, 38, 38);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    const notesLines = doc.splitTextToSize(obj.notes, contentWidth);
    checkPageBreak(notesLines.length * 5);
    doc.text(notesLines, margin, y);
    y += notesLines.length * 5 + 8;
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} — Confidencial - Uso restrito a Agentes do Arcanum Obscurum`,
      margin,
      pageHeight - 8
    );
  }

  const sanitizedTitle = obj.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`arcanum_relatorio_${sanitizedTitle || obj.id}.pdf`);
}
