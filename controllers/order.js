const axios = require("axios");
const orderModel = require("../model/order");
const { calculateTotalPrice } = require("../model/calculateTotalPrice");
require("dotenv").config();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL; // Ganti dengan URL actual Product Service

async function createOrder(req, res) {
  const { cartId, shippingAddress, paymentStatus } = req.body;
  const userId = req.user.userId; // userId dari JWT token

  try {
    // Menghitung total harga berdasarkan cartId
    const totalPrice = await calculateTotalPrice(cartId);

    // Membuat order di Firestore
    const orderData = {
      userId,
      cartId,
      status: "pending", // Status awal adalah pending
      totalPrice,
      shippingAddress,
      paymentStatus: paymentStatus || "pending", // Status pembayaran default adalah 'pending'
      orderDate: new Date(),
    };

    const orderId = await orderModel.createOrder(orderData); // Menyimpan pesanan ke Firestore

    // Mengurangi stok produk berdasarkan item yang dipesan
    const cartData = await orderModel.getCart(cartId); // Ambil data cart untuk mendapatkan item
    for (let item of cartData.items) {
      const { id: productId, quantity } = item;

      try {
        // Panggil Product Service untuk mengurangi stok produk
        const response = await axios.put(
          `${PRODUCT_SERVICE_URL}`,
          { productId, quantity },
          {
            headers: {
              Authorization: `Bearer ${
                req.headers["authorization"]?.split(" ")[1]
              }`,
            },
          }
        );

        if (response.status !== 200) {
          return res
            .status(400)
            .json({
              message: `Failed to update stock for product ${productId}`,
            });
        }
      } catch (error) {
        console.error(
          "Stock update error:",
          error.response?.data || error.message
        );
        return res.status(400).json({
          message: `Not enough stock available for product ${productId}. Please reduce the quantity or try later.`,
          details: error.response?.data || error.message,
        });
      }
    }

    // Menghapus cart setelah pesanan berhasil dibuat
    const deleteCartResult = await orderModel.deleteCart(cartId);

    if (!deleteCartResult) {
      return res
        .status(500)
        .json({ message: "Failed to delete cart after order" });
    }

    // Mengembalikan response dengan informasi order
    res.status(201).json({
      message: "Order created successfully",
      orderId,
      totalPrice,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
}

// Fungsi untuk memperbarui status pesanan
async function updateOrderStatus(req, res) {
  const { orderId, status } = req.body;

  try {
    await orderModel.updateOrderStatus(orderId, status);
    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error });
  }
}

// Fungsi untuk mendapatkan riwayat pesanan berdasarkan userId
async function getOrderHistory(req, res) {
  const { userId } = req.params;

  try {
    const orders = await orderModel.getOrdersByUser(userId);
    if (orders.length === 0) {
      return res.status(404).send({ message: "No orders found." });
    }
    res.status(200).send(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order history", error });
  }
}

module.exports = { createOrder, updateOrderStatus, getOrderHistory };
