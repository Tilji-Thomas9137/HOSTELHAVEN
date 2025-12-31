import PDFDocument from 'pdfkit';

/**
 * Generate Fee Report PDF
 * @param {Array} fees - Array of fee objects with populated student
 * @param {Object} parent - Parent object
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateFeeReport = async (fees, parent) => {
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

      // Report Title
      doc
        .fillColor('#000')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('FEE REPORT', { align: 'center', underline: true })
        .moveDown(1);

      // Report Date
      doc
        .fillColor('#333')
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`, { align: 'right' })
        .moveDown(1.5);

      // Summary
      const totalDue = fees.reduce((sum, fee) => sum + fee.amount, 0);
      const totalPaid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
      const totalPending = totalDue - totalPaid;

      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Summary', { underline: true })
        .moveDown(0.8);

      doc
        .fillColor('#000')
        .fontSize(11)
        .font('Helvetica')
        .text(`Total Fee Amount: ₹${totalDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { indent: 20 })
        .text(`Total Paid: ₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { indent: 20 })
        .text(`Total Pending: ₹${totalPending.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { indent: 20 })
        .moveDown(1.5);

      // Fee Details Table
      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Fee Details', { underline: true })
        .moveDown(0.8);

      // Table Header
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [100, 100, 80, 80, 80, 100, 60];
      const rowHeight = 25;

      doc
        .fillColor('#673AB7')
        .fontSize(10)
        .font('Helvetica-Bold')
        .rect(tableLeft, tableTop, colWidths[0], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .fillColor('#000')
        .text('Child', tableLeft + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0], tableTop, colWidths[1], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Fee Type', tableLeft + colWidths[0] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1], tableTop, colWidths[2], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Total', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop, colWidths[3], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Paid', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop, colWidths[4], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Pending', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop, colWidths[5], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Due Date', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], tableTop, colWidths[6], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + 5, tableTop + 8);

      // Table Rows
      let currentY = tableTop + rowHeight;
      fees.forEach((fee, index) => {
        if (currentY > 700) {
          // New page
          doc.addPage();
          currentY = 50;
        }

        const remaining = fee.amount - (fee.paidAmount || 0);
        const feeType = (fee.feeType || '').charAt(0).toUpperCase() + (fee.feeType || '').slice(1).replace('_', ' ');

        doc
          .fontSize(9)
          .font('Helvetica')
          .rect(tableLeft, currentY, colWidths[0], rowHeight)
          .stroke()
          .text((fee.student?.name || 'N/A').substring(0, 15), tableLeft + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0], currentY, colWidths[1], rowHeight)
          .stroke()
          .text(feeType.substring(0, 12), tableLeft + colWidths[0] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight)
          .stroke()
          .text(`₹${fee.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], rowHeight)
          .stroke()
          .text(`₹${(fee.paidAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY, colWidths[4], rowHeight)
          .stroke()
          .text(`₹${remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], currentY, colWidths[5], rowHeight)
          .stroke()
          .text(new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], currentY, colWidths[6], rowHeight)
          .stroke()
          .text((fee.status || 'N/A').toUpperCase(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + 5, currentY + 8);

        currentY += rowHeight;
      });

      // Footer
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 50;

      doc
        .strokeColor('#ccc')
        .lineWidth(1)
        .moveTo(50, footerY)
        .lineTo(545, footerY)
        .stroke()
        .moveDown(1);

      doc
        .fillColor('#666')
        .fontSize(9)
        .font('Helvetica')
        .text('This is a computer-generated report. No signature required.', { align: 'center' })
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

/**
 * Generate Attendance Report PDF
 * @param {Array} attendanceRecords - Array of attendance records with populated student
 * @param {Object} parent - Parent object
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateAttendanceReport = async (attendanceRecords, parent) => {
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

      // Report Title
      doc
        .fillColor('#000')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('ATTENDANCE REPORT', { align: 'center', underline: true })
        .moveDown(1);

      // Report Date
      doc
        .fillColor('#333')
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`, { align: 'right' })
        .moveDown(1.5);

      // Summary
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
      const totalCount = attendanceRecords.length;

      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Summary', { underline: true })
        .moveDown(0.8);

      doc
        .fillColor('#000')
        .fontSize(11)
        .font('Helvetica')
        .text(`Total Records: ${totalCount}`, { indent: 20 })
        .text(`Present: ${presentCount}`, { indent: 20 })
        .text(`Absent: ${absentCount}`, { indent: 20 })
        .text(`Attendance Rate: ${totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0}%`, { indent: 20 })
        .moveDown(1.5);

      // Attendance Details Table
      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Attendance Details', { underline: true })
        .moveDown(0.8);

      // Table Header
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [100, 120, 100, 100, 80, 100];
      const rowHeight = 25;

      doc
        .fillColor('#673AB7')
        .fontSize(10)
        .font('Helvetica-Bold')
        .rect(tableLeft, tableTop, colWidths[0], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .fillColor('#000')
        .text('Date', tableLeft + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0], tableTop, colWidths[1], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Child', tableLeft + colWidths[0] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1], tableTop, colWidths[2], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('IN Time', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop, colWidths[3], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('OUT Time', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop, colWidths[4], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop, colWidths[5], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Remarks', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, tableTop + 8);

      // Table Rows
      let currentY = tableTop + rowHeight;
      attendanceRecords.forEach((record) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        const inTime = record.inTime ? new Date(record.inTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const outTime = record.outTime ? new Date(record.outTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

        doc
          .fontSize(9)
          .font('Helvetica')
          .rect(tableLeft, currentY, colWidths[0], rowHeight)
          .stroke()
          .text(new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), tableLeft + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0], currentY, colWidths[1], rowHeight)
          .stroke()
          .text((record.student?.name || 'N/A').substring(0, 18), tableLeft + colWidths[0] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight)
          .stroke()
          .text(inTime, tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], rowHeight)
          .stroke()
          .text(outTime, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY, colWidths[4], rowHeight)
          .stroke()
          .text((record.status || 'N/A').toUpperCase(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], currentY, colWidths[5], rowHeight)
          .stroke()
          .text((record.remarks || 'N/A').substring(0, 15), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, currentY + 8);

        currentY += rowHeight;
      });

      // Footer
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 50;

      doc
        .strokeColor('#ccc')
        .lineWidth(1)
        .moveTo(50, footerY)
        .lineTo(545, footerY)
        .stroke()
        .moveDown(1);

      doc
        .fillColor('#666')
        .fontSize(9)
        .font('Helvetica')
        .text('This is a computer-generated report. No signature required.', { align: 'center' })
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

/**
 * Generate Complaint Report PDF
 * @param {Array} complaints - Array of complaint objects with populated student and room
 * @param {Object} parent - Parent object
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateComplaintReport = async (complaints, parent) => {
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

      // Report Title
      doc
        .fillColor('#000')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('COMPLAINT REPORT', { align: 'center', underline: true })
        .moveDown(1);

      // Report Date
      doc
        .fillColor('#333')
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`, { align: 'right' })
        .moveDown(1.5);

      // Summary
      const requestedCount = complaints.filter(c => c.status === 'requested').length;
      const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
      const totalCount = complaints.length;

      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Summary', { underline: true })
        .moveDown(0.8);

      doc
        .fillColor('#000')
        .fontSize(11)
        .font('Helvetica')
        .text(`Total Complaints: ${totalCount}`, { indent: 20 })
        .text(`Requested: ${requestedCount}`, { indent: 20 })
        .text(`Resolved: ${resolvedCount}`, { indent: 20 })
        .moveDown(1.5);

      // Complaint Details Table
      doc
        .fillColor('#673AB7')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Complaint Details', { underline: true })
        .moveDown(0.8);

      // Table Header
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [100, 120, 150, 80, 80, 100];
      const rowHeight = 25;

      doc
        .fillColor('#673AB7')
        .fontSize(10)
        .font('Helvetica-Bold')
        .rect(tableLeft, tableTop, colWidths[0], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .fillColor('#000')
        .text('Date', tableLeft + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0], tableTop, colWidths[1], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Child', tableLeft + colWidths[0] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1], tableTop, colWidths[2], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Title', tableLeft + colWidths[0] + colWidths[1] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop, colWidths[3], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Room', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop, colWidths[4], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, tableTop + 8);

      doc
        .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop, colWidths[5], rowHeight)
        .fillAndStroke('#E8E3F3', '#673AB7')
        .text('Resolved', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, tableTop + 8);

      // Table Rows
      let currentY = tableTop + rowHeight;
      complaints.forEach((complaint) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc
          .fontSize(9)
          .font('Helvetica')
          .rect(tableLeft, currentY, colWidths[0], rowHeight)
          .stroke()
          .text(new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), tableLeft + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0], currentY, colWidths[1], rowHeight)
          .stroke()
          .text((complaint.student?.name || 'N/A').substring(0, 18), tableLeft + colWidths[0] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight)
          .stroke()
          .text((complaint.title || 'Complaint').substring(0, 22), tableLeft + colWidths[0] + colWidths[1] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], rowHeight)
          .stroke()
          .text(complaint.room?.roomNumber || 'N/A', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY, colWidths[4], rowHeight)
          .stroke()
          .text((complaint.status || 'N/A').toUpperCase(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 8);

        doc
          .rect(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], currentY, colWidths[5], rowHeight)
          .stroke()
          .text(complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, currentY + 8);

        currentY += rowHeight;
      });

      // Footer
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 50;

      doc
        .strokeColor('#ccc')
        .lineWidth(1)
        .moveTo(50, footerY)
        .lineTo(545, footerY)
        .stroke()
        .moveDown(1);

      doc
        .fillColor('#666')
        .fontSize(9)
        .font('Helvetica')
        .text('This is a computer-generated report. No signature required.', { align: 'center' })
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

