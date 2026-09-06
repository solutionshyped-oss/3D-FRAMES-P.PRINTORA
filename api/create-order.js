const Razorpay = require("razorpay");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      product,
      quantity,
      customer_name,
      customer_phone,
      address,
      city,
      state,
      pincode,
      landmark
    } = req.body || {};

    const qty = Number(quantity);

    // Basic validation
    if (!product || !qty || qty < 1 || qty > 10) {
      return res.status(400).json({
        error: "Invalid order details"
      });
    }

    if (
      !customer_name ||
      !customer_phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        error: "Please provide all delivery details"
      });
    }

    // P.PRINTORA product price
    const PRICE = 499;
    const amount = PRICE * qty;

    // Razorpay configuration
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create Razorpay order
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "PP_" + Date.now(),

      notes: {
        product: String(product),
        quantity: String(qty),
        customer_name: String(customer_name),
        customer_phone: String(customer_phone),
        address: String(address),
        city: String(city),
        state: String(state),
        pincode: String(pincode),
        landmark: String(landmark || "")
      }
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error("Razorpay order creation error:", error);

    return res.status(500).json({
      error: "Failed to create Razorpay order"
    });
  }
};
