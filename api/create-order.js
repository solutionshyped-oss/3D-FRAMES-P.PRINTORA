module.exports = async function handler(req, res) {
  // Always return JSON
  res.setHeader("Content-Type", "application/json");

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

    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return res.status(400).json({
        success: false,
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
        success: false,
        error: "Please fill all required delivery details"
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay keys are missing");

      return res.status(500).json({
        success: false,
        error: "Razorpay configuration is missing on the server"
      });
    }

    // ₹499 per item
    const pricePerItem = 499;
    const amount = pricePerItem * qty;

    const receipt = "PPRINTORA_" + Date.now();

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          "Authorization":
            "Basic " +
            Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amount * 100,
          currency: "INR",
          receipt: receipt,
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
        })
      }
    );

    const data = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay API error:", data);

      return res.status(razorpayResponse.status).json({
        success: false,
        error:
          data?.error?.description ||
          data?.error?.code ||
          "Razorpay order creation failed"
      });
    }

    return res.status(200).json({
      success: true,
      key_id: keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.id,
      order_token: data.id
    });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Server error while creating order"
    });
  }
};
