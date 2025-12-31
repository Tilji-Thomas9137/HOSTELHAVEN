import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF receipt for payment
 * @param {Object} payment - Payment object with populated student and fee
 * @param {Object} student - Student object
 * @param {Object} fee - Fee object (optional)
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generatePaymentReceipt = async (payment, student, fee = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc
        .fillColor('#673AB7')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('HostelHaven', { align: 'center' })
        .moveDown(0.5);

      doc
        .fillColor('#666')
        .fontSize(12)
        .font('Helvetica')
        .text('Smart Hostel Management System', { align: 'center' })
        .moveDown(1);

      // Receipt Title
      doc
        .fillColor('#000')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PAYMENT RECEIPT', { align: 'center', underline: true })
        .moveDown(1.5);

      // Receipt Number
      doc
        .fillColor('#333')
        .fontSize(10)
        .font('Helvetica')
        .text(`Receipt No: ${payment.transactionId || payment._id}`, { align: 'right' })
        .moveDown(0.5);

      doc
        .text(`Date: ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`, { align: 'right' })
        .moveDown(2);

      // Student Information Section
      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Student Information', { underline: true })
        .moveDown(0.8);

      doc
        .fillColor('#000')
        .fontSize(11)
        .font('Helvetica')
        .text(`Name: ${student.name || 'N/A'}`, { indent: 20 })
        .text(`Student ID: ${student.studentId || 'N/A'}`, { indent: 20 })
        .text(`Course: ${student.course || 'N/A'}`, { indent: 20 });
      
      // Calculate or display batch year
      let batchYearDisplay = null;
      if (student.batchYear && student.batchYear.trim() !== '') {
        // Use explicitly set batch year
        batchYearDisplay = student.batchYear;
      } else if (student.year) {
        // Calculate batch year from current year and student year
        const currentYear = new Date().getFullYear();
        const yearMapping = {
          '1st Year': currentYear,
          '2nd Year': currentYear - 1,
          '3rd Year': currentYear - 2,
          '4th Year': currentYear - 3,
        };
        batchYearDisplay = yearMapping[student.year] || null;
      }
      
      // Only show batch year if we have a value
      if (batchYearDisplay) {
        doc.text(`Batch Year: ${batchYearDisplay}`, { indent: 20 });
      }

      if (student.room) {
        doc.text(`Room Number: ${student.room.roomNumber || 'N/A'}`, { indent: 20 });
        if (student.room.block) {
          doc.text(`Block: ${student.room.block}`, { indent: 20 });
        }
      }

      doc.moveDown(1.5);

      // Payment Details Section
      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Payment Details', { underline: true })
        .moveDown(0.8);

      doc
        .fillColor('#000')
        .fontSize(11)
        .font('Helvetica')
        .text(`Payment Type: ${(payment.paymentType || 'N/A').charAt(0).toUpperCase() + (payment.paymentType || 'N/A').slice(1).replace('_', ' ')}`, { indent: 20 })
        .text(`Payment Method: ${payment.paymentMethod === 'upi' ? 'UPI' : payment.paymentMethod === 'netbanking' ? 'Net Banking' : (payment.paymentMethod || 'N/A').charAt(0).toUpperCase() + (payment.paymentMethod || 'N/A').slice(1).replace('_', ' ')}`, { indent: 20 })
        .text(`Transaction ID: ${payment.transactionId || 'N/A'}`, { indent: 20 })
        .moveDown(1);

      // Amount Box
      doc
        .rect(50, doc.y, 495, 80)
        .strokeColor('#673AB7')
        .lineWidth(2)
        .stroke()
        .moveDown(0.5);

      doc
        .fillColor('#333')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Amount Paid:', 70, doc.y - 50, { continued: true })
        .fillColor('#673AB7')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(`₹${(payment.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { align: 'right' });

      doc
        .fillColor('#666')
        .fontSize(10)
        .font('Helvetica')
        .text(`Status: ${(payment.status || 'completed').charAt(0).toUpperCase() + (payment.status || 'completed').slice(1)}`, 70, doc.y - 20);

      doc.moveDown(2);

      // Fee Details (if available)
      if (fee) {
        doc
          .fillColor('#673AB7')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Fee Information', { underline: true })
          .moveDown(0.8);

        doc
          .fillColor('#000')
          .fontSize(11)
          .font('Helvetica')
          .text(`Fee Type: ${(fee.feeType || 'N/A').charAt(0).toUpperCase() + (fee.feeType || 'N/A').slice(1).replace('_', ' ')}`, { indent: 20 })
          .text(`Total Fee Amount: ₹${(fee.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { indent: 20 })
          .text(`Paid Amount: ₹${(fee.paidAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { indent: 20 })
          .text(`Remaining Amount: ₹${((fee.amount || 0) - (fee.paidAmount || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { indent: 20 });

        if (fee.dueDate) {
          doc.text(`Due Date: ${new Date(fee.dueDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`, { indent: 20 });
        }

        doc.moveDown(1.5);
      }

      // Notes (if available)
      if (payment.notes) {
        doc
          .fillColor('#333')
          .fontSize(10)
          .font('Helvetica')
          .text(`Notes: ${payment.notes}`, { indent: 20 })
          .moveDown(1);
      }

      // Footer
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      const footerY = pageHeight - 100;

      doc
        .strokeColor('#ccc')
        .lineWidth(1)
        .moveTo(50, footerY)
        .lineTo(pageWidth - 50, footerY)
        .stroke()
        .moveDown(1);

      doc
        .fillColor('#666')
        .fontSize(9)
        .font('Helvetica')
        .text('This is a computer-generated receipt. No signature required.', { align: 'center' })
        .moveDown(0.5)
        .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' })
        .moveDown(0.5)
        .text('© HostelHaven - Smart Hostel Management System', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

