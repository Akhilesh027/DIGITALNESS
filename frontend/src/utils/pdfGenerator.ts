import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/data/invoiceData';
import { Proposal } from '@/data/proposalData';

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138); // dark blue
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Digitalness', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Marketing & IT Solutions', 15, 28);
  doc.text('Hyderabad, Telangana | +91 9550379505', 15, 35);

  // Invoice title
  doc.setFontSize(14);
  doc.text('INVOICE', pageWidth - 15, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, pageWidth - 15, 28, { align: 'right' });

  // Reset color
  doc.setTextColor(0, 0, 0);

  // Invoice details
  doc.setFontSize(10);
  const detailsY = 55;

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName, 15, detailsY + 7);

  // Invoice info
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', pageWidth - 80, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.createdDate), pageWidth - 15, detailsY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', pageWidth - 80, detailsY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.dueDate), pageWidth - 15, detailsY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', pageWidth - 80, detailsY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.status, pageWidth - 15, detailsY + 14, { align: 'right' });

  // Items Table
  autoTable(doc, {
    startY: detailsY + 25,
    head: [['#', 'Description', 'Qty', 'Rate (₹)', 'Amount (₹)']],
    body: invoice.items.map((item, idx) => [
      (idx + 1).toString(),
      item.description,
      item.quantity.toString(),
      formatCurrency(item.rate),
      formatCurrency(item.amount),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  const summaryX = pageWidth - 80;
  const valueX = pageWidth - 15;

  doc.setFontSize(10);
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(`₹${formatCurrency(invoice.subtotal)}`, valueX, finalY, { align: 'right' });

  doc.text('Tax (18% GST):', summaryX, finalY + 7);
  doc.text(`₹${formatCurrency(invoice.tax)}`, valueX, finalY + 7, { align: 'right' });

  if (invoice.discount > 0) {
    doc.text('Discount:', summaryX, finalY + 14);
    doc.text(`-₹${formatCurrency(invoice.discount)}`, valueX, finalY + 14, { align: 'right' });
  }

  const totalY = finalY + (invoice.discount > 0 ? 24 : 17);
  doc.setFillColor(30, 58, 138);
  doc.rect(summaryX - 5, totalY - 5, pageWidth - summaryX + 5, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryX, totalY + 3);
  doc.text(`₹${formatCurrency(invoice.total)}`, valueX, totalY + 3, { align: 'right' });

  // Paid amount
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (invoice.paidAmount > 0) {
    doc.text('Amount Paid:', summaryX, totalY + 17);
    doc.setTextColor(22, 163, 74);
    doc.text(`₹${formatCurrency(invoice.paidAmount)}`, valueX, totalY + 17, { align: 'right' });
  }

  const balance = invoice.total - invoice.paidAmount;
  if (balance > 0) {
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', summaryX, totalY + 24);
    doc.text(`₹${formatCurrency(balance)}`, valueX, totalY + 24, { align: 'right' });
  }

  // Notes
  if (invoice.notes) {
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', 15, totalY + 40);
    doc.text(invoice.notes, 15, totalY + 47);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business! | Digitalness', pageWidth / 2, footerY, { align: 'center' });
  doc.text('GSTIN: 36AABFK1234A1ZV | PAN: AABFK1234A', pageWidth / 2, footerY + 5, { align: 'center' });

  return doc;
}

export function generateWorkReportPDF(
  customerName: string,
  month: string,
  deliverables: any[],
  summary: { total: number; completed: number; inProgress: number; pending: number; onTimeRate: number }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Work Report', 15, 18);
  doc.setFontSize(12);
  doc.text(`${customerName} - ${month}`, 15, 28);
  doc.setFontSize(9);
  doc.text('Digitalness', pageWidth - 15, 18, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  // Summary cards
  const cardY = 50;
  const cardW = 42;
  const cards = [
    { label: 'Total', value: summary.total.toString(), color: [59, 130, 246] },
    { label: 'Completed', value: summary.completed.toString(), color: [22, 163, 74] },
    { label: 'In Progress', value: summary.inProgress.toString(), color: [245, 158, 11] },
    { label: 'Pending', value: summary.pending.toString(), color: [239, 68, 68] },
  ];

  cards.forEach((card, i) => {
    const x = 15 + i * (cardW + 5);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, cardY, cardW, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardW / 2, cardY + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text(card.label, x + cardW / 2, cardY + 18, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`On-Time Delivery Rate: ${summary.onTimeRate}%`, 15, cardY + 32);

  // Deliverables Table
  autoTable(doc, {
    startY: cardY + 40,
    head: [['#', 'Deliverable', 'Category', 'Assigned To', 'Due Date', 'Status']],
    body: deliverables.map((d, i) => [
      (i + 1).toString(),
      d.title,
      d.category,
      d.assignedToName || d.assignedTo,
      formatDate(d.dueDate),
      d.status,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 8 },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 5) {
        const status = data.cell.raw;
        if (status === 'Completed') data.cell.styles.textColor = [22, 163, 74];
        else if (status === 'In Progress') data.cell.styles.textColor = [245, 158, 11];
        else if (status === 'Not Started') data.cell.styles.textColor = [239, 68, 68];
        else if (status === 'Review') data.cell.styles.textColor = [59, 130, 246];
      }
    },
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | Digitalness`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ===== Proposal PDF (cleaner template) =====
export function generateProposalPDF(proposal: Proposal) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top accent bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 8, pageWidth, 2, 'F');

  // Header block
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PROPOSAL', 15, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`# ${proposal.proposalNumber}`, 15, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Digitalness', pageWidth - 15, 28, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Digital Marketing & IT Solutions', pageWidth - 15, 34, { align: 'right' });
  doc.text('Hyderabad, Telangana | +91 9550379505', pageWidth - 15, 39, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 48, pageWidth - 15, 48);

  // Client + meta panel
  let y = 58;
  doc.setTextColor(100);
  doc.setFontSize(9);
  doc.text('PREPARED FOR', 15, y);
  doc.text('STATUS', pageWidth / 2, y);
  doc.text('VALID UNTIL', pageWidth - 15, y, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(proposal.clientName, 15, y + 7);
  doc.text(proposal.status, pageWidth / 2, y + 7);
  doc.text(formatDate(proposal.validUntil), pageWidth - 15, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(proposal.clientContact, 15, y + 13);
  doc.text(`Created ${formatDate(proposal.createdOn)}`, pageWidth / 2, y + 13);
  doc.text(`Duration: ${proposal.durationDays} days`, pageWidth - 15, y + 13, { align: 'right' });

  // Services table
  autoTable(doc, {
    startY: y + 22,
    head: [['#', 'Service', 'Description', 'Price (₹)']],
    body: proposal.services.map((s, i) => [
      (i + 1).toString(),
      s.name,
      s.description,
      formatCurrency(s.price),
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - 90, finalY, 75, 14, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total', pageWidth - 85, finalY + 9);
  doc.text(`₹${formatCurrency(proposal.totalPrice)}`, pageWidth - 20, finalY + 9, { align: 'right' });

  // Deliverables
  let dy = finalY + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Deliverables', 15, dy);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);
  proposal.deliverables.forEach((d, i) => {
    dy += 6;
    doc.text(`• ${d}`, 18, dy);
  });

  // Notes
  if (proposal.notes) {
    dy += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Notes', 15, dy);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(proposal.notes, pageWidth - 30);
    doc.text(lines, 15, dy + 6);
  }

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(15, pageHeight - 22, pageWidth - 15, pageHeight - 22);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('This proposal is confidential. Pricing valid until the date above.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text('Digitalness • GSTIN 36AABFK1234A1ZV', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

// ============ Phase B: Automated monthly reports ============

export function generateMonthlyClientReportPDF(
  customerName: string,
  month: string,
  tasks: any[],
  invoices: any[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('Monthly Client Report', 15, 18);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text(`${customerName}  |  ${month}`, 15, 28);
  doc.setFontSize(9);
  doc.text('Digitalness', pageWidth - 15, 18, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'Completed').length;
  const inProg = tasks.filter((t) => t.status === 'In Progress').length;
  const overdue = tasks.filter(
    (t) => t.status !== 'Completed' && new Date(t.deadline) < new Date()
  ).length;
  const completion = total ? Math.round((done / total) * 100) : 0;

  // KPIs
  const cardY = 50, cardW = 42;
  const cards = [
    { label: 'Total Tasks', value: total.toString(), color: [59, 130, 246] },
    { label: 'Completed', value: done.toString(), color: [16, 185, 129] },
    { label: 'In Progress', value: inProg.toString(), color: [245, 158, 11] },
    { label: 'Overdue', value: overdue.toString(), color: [239, 68, 68] },
  ];
  cards.forEach((c, i) => {
    const x = 15 + i * (cardW + 5);
    doc.setFillColor(c.color[0], c.color[1], c.color[2]);
    doc.roundedRect(x, cardY, cardW, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text(c.value, x + cardW / 2, cardY + 12, { align: 'center' });
    doc.setFontSize(8);
    doc.text(c.label, x + cardW / 2, cardY + 18, { align: 'center' });
  });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(`Overall Completion: ${completion}%`, 15, cardY + 32);

  // Tasks table
  autoTable(doc, {
    startY: cardY + 40,
    head: [['Task', 'Category', 'Status', 'Deadline']],
    body: tasks.map((t) => [t.title, t.category || '-', t.status, t.deadline]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 9 },
  });

  // Financials
  const fy = (doc as any).lastAutoTable.finalY + 10;
  const totalInv = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const due = totalInv - totalPaid;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Financial Summary', 15, fy);
  autoTable(doc, {
    startY: fy + 4,
    head: [['Metric', 'Amount (₹)']],
    body: [
      ['Invoiced', `₹${totalInv.toLocaleString('en-IN')}`],
      ['Paid', `₹${totalPaid.toLocaleString('en-IN')}`],
      ['Pending', `₹${due.toLocaleString('en-IN')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10 },
  });

  // Footer
  const fh = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8); doc.setTextColor(120);
  doc.text('Digitalness  •  Auto-generated report', pageWidth / 2, fh, { align: 'center' });
  return doc;
}

export function generateAgencyMonthlyPDF(
  month: string,
  data: { revenue: number; expenses: number; tasksDone: number; tasksTotal: number; activeClients: number }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const profit = data.revenue - data.expenses;
  const margin = data.revenue ? Math.round((profit / data.revenue) * 100) : 0;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Agency Monthly P&L', 15, 20);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text(month, 15, 30);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 55,
    head: [['Metric', 'Value']],
    body: [
      ['Active Clients', data.activeClients.toString()],
      ['Tasks Completed', `${data.tasksDone} / ${data.tasksTotal}`],
      ['Revenue', `₹${data.revenue.toLocaleString('en-IN')}`],
      ['Expenses', `₹${data.expenses.toLocaleString('en-IN')}`],
      ['Profit', `₹${profit.toLocaleString('en-IN')}`],
      ['Margin', `${margin}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 11 },
  });

  return doc;
}
