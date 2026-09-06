const Razorpay = require("razorpay");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed"
      });
    }

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

    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({
        success: false,
        error: "Invalid quantity"
      });
    }

    if (!customer_name || !customer_phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        error: "Please fill all required delivery details"
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay environment variables are missing");

      return res.status(500).json({
        success: false,
        error: "Razorpay configuration is missing on the server"
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const pricePerItem = 499;
    const amount = pricePerItem * qty;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `PPRINTORA_${Date.now()}`,
      notes: {
        product: String(product || ""),
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
      key_id: keyId,
      amount: amount,
      currency: "INR",
      order_id: order.id,
      order_token: order.id
    });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create Razorpay order"
    });
  }
};
