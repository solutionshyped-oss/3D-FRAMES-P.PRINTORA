const Razorpay = require("razorpay");

module.exports = async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed"
      });
    }

    // Get customer/order information
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

    // Validate quantity
    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({
        success: false,
        error: "Invalid quantity"
      });
    }

    // Validate delivery information
    if (
      !customer_name ||
      !customer_phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        error: "Please fill all required delivery details"
      });
    }

    // Read Razorpay credentials from Vercel Environment Variables
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    // SAFE DEBUG LOG
    // This does NOT print the complete secret.
    console.log("RAZORPAY DEBUG:", {
      keyIdPrefix: keyId ? keyId.substring(0, 12) : "MISSING",
      keyIdLength: keyId ? keyId.length : 0,
      secretPrefix: keySecret ? keySecret.substring(0, 8) : "MISSING",
      secretLength: keySecret ? keySecret.length : 0
    });

    // Check environment variables
    if (!keyId || !keySecret) {
      console.error("Razorpay environment variables are missing");

      return res.status(500).json({
        success: false,
        error: "Razorpay configuration is missing on the server"
      });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    // Product price
    const pricePerItem = 499;

    // Total in rupees
    const amount = pricePerItem * qty;

    // Create Razorpay order
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

    console.log("Creating Razorpay order:", {
      amount: options.amount,
      currency: options.currency,
      quantity: qty
    });

    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created:", order.id);

    // Send order information back to checkout
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
      error:
        error?.error?.description ||
        error?.message ||
        "Failed to create Razorpay order"
    });
  }
};
