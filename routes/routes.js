const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const verifyToken = require('../middleware/verifyToken');  // Menambahkan middleware JWT

// Endpoint untuk membuat order baru
router.post('/orders', verifyToken, orderController.createOrder);

// Endpoint untuk memperbarui status pesanan
router.put('/orders/status', verifyToken, orderController.updateOrderStatus);

// Endpoint untuk mendapatkan riwayat pesanan berdasarkan userId
router.get('/orders/history/:userId', verifyToken, orderController.getOrderHistory);

module.exports = router;
