import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportInvoiceToPdf(elementId, invoiceNumber = 'INV') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice preview element not found');
  }

  // Add temporary print class to optimize layout for rendering
  element.classList.add('pdf-rendering-mode');

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (300 DPI equivalent)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      onclone: (clonedDoc) => {
        // Ensure no scrollbars or action toolbars show in cloned doc
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.border = 'none';
          clonedEl.style.margin = '0';
          clonedEl.style.borderRadius = '0';
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Fit canvas cleanly into PDF
    const ratio = canvasWidth / pdfWidth;
    const imgHeight = canvasHeight / ratio;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, '', 'FAST');
    heightLeft -= pdfHeight;

    // Handle multi-page if needed
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, '', 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanFilename = `Invoice_${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('PDF export error:', err);
    throw err;
  } finally {
    element.classList.remove('pdf-rendering-mode');
  }
}

export function printInvoice() {
  window.print();
}
