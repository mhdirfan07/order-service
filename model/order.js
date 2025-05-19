const db = require("../firebaseConfig"); // Mengimpor instance Firestore
const admin = require("firebase-admin");
// Fungsi untuk membuat order baru
async function createOrder(orderData) {
  const orderRef = db.collection("orders").doc();
  await orderRef.set({
    ...orderData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return orderRef.id; // Mengembalikan ID order yang baru dibuat
}

// Fungsi untuk memperbarui status pesanan
async function updateOrderStatus(orderId, status) {
  const orderRef = db.collection("orders").doc(orderId);
  await orderRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Fungsi untuk mendapatkan order berdasarkan userId
async function getOrdersByUser(userId) {
  const ordersRef = db.collection("orders");
  const snapshot = await ordersRef.where("userId", "==", userId).get();
  let orders = [];
  snapshot.forEach((doc) => {
    orders.push(doc.data());
  });
  return orders;
}

// Fungsi untuk mendapatkan cart dan menghitung total harga
async function getCart(cartId) {
  try {
    // Mengambil cart berdasarkan cartId
    const cartRef = db.collection("carts").doc(cartId);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      throw new Error("Cart not found");
    }

    const cartData = cartDoc.data();
    return cartData; // Mengembalikan data cart (termasuk items)
  } catch (error) {
    throw new Error("Error fetching cart: " + error.message);
  }
}

// Fungsi untuk menghapus cart berdasarkan cartId
async function deleteCart(cartId) {
  try {
    // Mengambil referensi ke cart berdasarkan cartId
    const cartRef = db.collection("carts").doc(cartId);
    await cartRef.delete(); // Menghapus cart dari Firestore
    return true;
  } catch (error) {
    console.error("Error deleting cart:", error);
    return false; // Jika ada error saat menghapus cart
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrdersByUser,
  getCart,
  deleteCart
};
