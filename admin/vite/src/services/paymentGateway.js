/**
 * Fake Payment Gateway Service
 * Simulates payment gateway integration (Razorpay-like)
 */

// Simulate payment gateway API calls
const simulateNetworkDelay = (ms = 1500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Initialize payment with gateway
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} - Payment gateway response
 */
export const initializePayment = async (paymentData) => {
  await simulateNetworkDelay(1000);
  
  // Simulate gateway initialization
  const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const gatewayOrderId = `GATEWAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  return {
    success: true,
    orderId,
    gatewayOrderId,
    amount: paymentData.amount,
    currency: 'INR',
    key: 'rzp_test_FAKE_KEY', // Fake Razorpay key
    name: 'HostelHaven',
    description: paymentData.description || 'Hostel Fee Payment',
    prefill: {
      name: paymentData.studentName || 'Student',
      email: paymentData.email || 'student@hostelhaven.com',
      contact: paymentData.phone || '9999999999'
    },
    theme: {
      color: '#673AB7'
    }
  };
};

/**
 * Process payment with gateway
 * @param {Object} paymentData - Payment details including payment method
 * @returns {Promise<Object>} - Payment gateway response
 */
export const processPayment = async (paymentData) => {
  await simulateNetworkDelay(2000);
  
  // Simulate payment processing
  // 95% success rate for demo purposes
  const isSuccess = Math.random() > 0.05;
  
  if (isSuccess) {
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return {
      success: true,
      transactionId,
      paymentId,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: 'INR',
      status: 'captured',
      method: paymentData.paymentMethod || 'card',
      timestamp: new Date().toISOString(),
      gatewayResponse: {
        razorpay_payment_id: paymentId,
        razorpay_order_id: paymentData.orderId,
        razorpay_signature: `FAKE_SIGNATURE_${Math.random().toString(36).substr(2, 20)}`
      }
    };
  } else {
    // Simulate payment failure
    return {
      success: false,
      error: {
        code: 'PAYMENT_FAILED',
        description: 'Payment could not be processed. Please try again.',
        source: 'gateway',
        step: 'payment',
        reason: 'insufficient_funds' // or 'network_error', 'card_declined', etc.
      }
    };
  }
};

/**
 * Verify payment signature (fake verification)
 * @param {Object} paymentData - Payment data with signature
 * @returns {Promise<boolean>} - Verification result
 */
export const verifyPayment = async (paymentData) => {
  await simulateNetworkDelay(500);
  
  // In real implementation, this would verify the signature
  // For fake gateway, always return true if payment was successful
  return paymentData.success === true;
};

/**
 * Get payment methods available
 */
export const getPaymentMethods = () => {
  return [
    {
      id: 'upi',
      name: 'UPI',
      icon: '📱',
      description: 'Google Pay, PhonePe, Paytm',
      enabled: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'All major banks',
      enabled: true
    }
  ];
};

