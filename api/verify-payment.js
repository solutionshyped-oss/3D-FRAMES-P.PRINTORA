const crypto = require("crypto");
const Razorpay = require("razorpay");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      orderId,
      orderToken,
      paymentId,
      signature
    } = req.body || {};

    if (!orderId || !orderToken || !paymentId || !signature) {
      return res.status(400).json({
        error: "Missing payment verification details"
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Verify server-generated order token
    const expectedToken = crypto
      .createHmac("sha256", secret)
      .update(orderId)
      .digest("hex");

    if (orderToken !== expectedToken) {
      return res.status(400).json({
        verified: false,
        error: "Invalid order token"
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: secret
    });

    // Verify Razorpay payment signature
    const body = orderId + "|" + paymentId;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        verified: false,
        error: "Invalid payment signature"
      });
    }

    // Get the actual Razorpay order
    const order = await razorpay.orders.fetch(orderId);

    if (!order || order.id !== orderId) {
      return res.status(400).json({
        verified: false,
        error: "Order not found"
      });
    }

    // Get the actual payment
    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment || payment.order_id !== orderId) {
      return res.status(400).json({
        verified: false,
        error: "Payment does not belong to this order"
      });
    }

    // Check payment amount
    if (Number(payment.amount) !== Number(order.amount)) {
      return res.status(400).json({
        verified: false,
        error: "Payment amount mismatch"
      });
    }

    // Final payment check
    if (payment.status !== "captured") {
      return res.status(400).json({
        verified: false,
        error: "Payment has not been captured"
      });
    }

    return res.status(200).json({
      verified: true,
      order_id: order.id,
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency
    });

  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      verified: false,
      error: "Payment verification failed"
    });
  }
};
