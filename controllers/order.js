const axios = require("axios");
const orderModel = require("../model/order");
const { calculateTotalPrice } = require("../model/calculateTotalPrice");
require("dotenv").config();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL; // Ganti dengan URL actual Product Service

async function createOrder(req, res) {
  const { cartId, shippingAddress, paymentStatus } = req.body;
  const userId = req.user.userId; // userId dari JWT token

  try {
    // Ambil data cart berdasarkan cartId dan userId
    const cartData = await orderModel.getCart(cartId, userId);
    console.log("cartData:", cartData);

    // Hitung total harga berdasarkan items dalam cart
    const totalPrice = await calculateTotalPrice(cartData);

    // Data order yang akan disimpan
    const orderData = {
      ...cartData,
      totalPrice,
      shippingAddress,
      paymentStatus: paymentStatus || "pending",
      OrderStatus: "pending", // Status awal pesanan
      orderDate: new Date(),
    };

    // Simpan order di Firestore
    const orderId = await orderModel.createOrder(orderData, userId);

    // Kurangi stok produk per item dalam cart
    const { id: productId, quantity } = cartData;

    try {
      const response = await axios.put(
        `${PRODUCT_SERVICE_URL}`, // Pastikan endpoint benar
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
        return res.status(400).json({
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

    // Hapus cart setelah order berhasil dibuat
    const deleteCartResult = await orderModel.deleteCart(cartId, userId);
    if (!deleteCartResult) {
      return res
        .status(500)
        .json({ message: "Failed to delete cart after order" });
    }

    // Respon sukses dengan info order
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
