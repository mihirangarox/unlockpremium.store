import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  customerName: string;
  subscriptionType: string;
  planDuration: string;
  startDate: string;
  renewalDate: string;
  amount: string;
  status: string;
  whatsapp?: string;
  email?: string;
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF();
  
  // Header / Branding
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text("CRMSync", 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Professional Subscription Services", 20, 32);
  
  // Admin details (Mocked - could be from settings)
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("UnlockPremium Store", 140, 20);
  doc.text("London, United Kingdom", 140, 25);
  doc.text("support@unlockpremium.store", 140, 30);

  // Line
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 40, 190, 40);

  // Invoice Title & Date
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text("INVOICE", 20, 55);
  
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 55);
  doc.text(`Invoice #: INV-${Date.now().toString().slice(-6)}`, 140, 60);

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 20, 75);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, 20, 82);
  if (data.email) doc.text(data.email, 20, 87);
  if (data.whatsapp) doc.text(data.whatsapp, 20, 92);

  // Table
  autoTable(doc, {
    startY: 105,
    head: [['Description', 'Duration', 'Activation', 'Renewal', 'Total']],
    body: [
      [
        data.subscriptionType, 
        data.planDuration, 
        data.startDate, 
        data.renewalDate, 
        data.amount
      ]
    ],
    headStyles: { fillColor: [79, 70, 229], fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 }
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFont("helvetica", "bold");
  doc.text("Payment Status:", 120, finalY);
  doc.setFont("helvetica", "normal");
  if (data.status === 'Paid') {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(245, 158, 11);
  }
  doc.text(data.status, 160, finalY);

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 120, finalY + 8);
  doc.setFontSize(14);
  doc.text(data.amount, 160, finalY + 8);

  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for choosing UnlockPremium!", 105, 270, { align: 'center' });
  doc.text("Please contact support for any billing inquiries.", 105, 275, { align: 'center' });

  doc.save(`Invoice_${data.customerName.replace(/\s+/g, '_')}.pdf`);
};
