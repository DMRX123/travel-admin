export const generateInvoiceHTML = (ride, user, driver) => {
  if (!ride) return '<html><body>No data available</body></html>';
  
  const invoiceNumber = `INV-${ride.id?.substring(0, 8).toUpperCase() || '00000000'}`;
  const date = ride.created_at ? new Date(ride.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const time = ride.created_at ? new Date(ride.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - Maa Saraswati Travels</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        .invoice {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #F97316, #EF4444);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0 0;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
          flex-wrap: wrap;
          gap: 20px;
        }
        .info-box h3 {
          margin: 0 0 10px;
          color: #F97316;
          font-size: 16px;
        }
        .info-box p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        .ride-details {
          margin-bottom: 30px;
        }
        .ride-details h3 {
          color: #F97316;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          flex-wrap: wrap;
          gap: 10px;
        }
        .detail-label {
          font-weight: bold;
          color: #333;
        }
        .detail-value {
          color: #666;
          text-align: right;
        }
        .total {
          background: #fff3e0;
          padding: 20px;
          border-radius: 12px;
          margin-top: 20px;
          text-align: right;
        }
        .total .amount {
          font-size: 32px;
          font-weight: bold;
          color: #F97316;
        }
        .footer {
          background: #f8f8f8;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
        @media (max-width: 600px) {
          .content { padding: 20px; }
          .info-section { flex-direction: column; }
          .detail-value { text-align: left; }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <h1>Maa Saraswati Travels</h1>
          <p>Taxi Service • Since 2015</p>
        </div>
        
        <div class="content">
          <div class="info-section">
            <div class="info-box">
              <h3>Invoice Details</h3>
              <p>Invoice No: ${invoiceNumber}</p>
              <p>Date: ${date}</p>
              <p>Time: ${time}</p>
            </div>
            <div class="info-box">
              <h3>Customer Details</h3>
              <p>Name: ${user?.full_name || 'Guest'}</p>
              <p>Phone: ${user?.phone || 'N/A'}</p>
            </div>
          </div>
          
          <div class="ride-details">
            <h3>Ride Details</h3>
            <div class="detail-row">
              <span class="detail-label">Pickup Location</span>
              <span class="detail-value">${ride.pickup_address || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Drop Location</span>
              <span class="detail-value">${ride.drop_address || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Vehicle Type</span>
              <span class="detail-value capitalize">${ride.vehicle_type || 'Sedan'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Distance</span>
              <span class="detail-value">${ride.distance || 0} km</span>
            </div>
            ${driver ? `
            <div class="detail-row">
              <span class="detail-label">Driver Name</span>
              <span class="detail-value">${driver.full_name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Vehicle Number</span>
              <span class="detail-value">${driver.vehicle_number || 'N/A'}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Payment Method</span>
              <span class="detail-value capitalize">${ride.payment_method || 'Cash'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value capitalize">${ride.status || 'Completed'}</span>
            </div>
          </div>
          
          <div class="total">
            <p>Total Amount</p>
            <div class="amount">₹${ride.fare || 0}</div>
            <p style="font-size: 12px; margin-top: 10px;">*GST Included where applicable</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Maa Saraswati Travels!</p>
          <p>For support: +91 98765 43210 | support@maasaraswatitravels.com</p>
          <p>This is a computer generated invoice, no signature required.</p>
        </div>
      </div>
      
      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="background: #F97316; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;">🖨️ Print Invoice</button>
      </div>
    </body>
    </html>
  `;
};

export const downloadInvoice = (ride, user, driver) => {
  if (!ride) {
    console.error('No ride data for invoice');
    return;
  }
  
  const html = generateInvoiceHTML(ride, user, driver);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${ride.id?.substring(0, 8) || 'ride'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};