const db = require("../firebaseConfig");
const admin = require("firebase-admin");

async function createOrder(orderData, userId) {
  const orderRef = db.collection('users').doc(userId).collection('orders').doc();
  await orderRef.set({
    ...orderData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return orderRef.id;
}

async function updateOrderStatus(orderId, userId, status) {
  const orderRef = db.collection('users').doc(userId).collection('orders').doc(orderId);
  await orderRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function getOrdersByUser(userId) {
  const ordersRef = db.collection('users').doc(userId).collection('orders');
  const snapshot = await ordersRef.get();
  let orders = [];
  snapshot.forEach(doc => {
    orders.push({ id: doc.id, ...doc.data() });
  });
  return orders;
}

async function getCart(cartId, userId) {
  const cartRef = db.collection('users').doc(userId).collection('cart').doc(cartId);
  const cartDoc = await cartRef.get();
  if (!cartDoc.exists) throw new Error('Cart not found');
  return cartDoc.data();
}

async function deleteCart(cartId, userId) {
  try {
    const cartRef = db.collection('users').doc(userId).collection('cart').doc(cartId);
    await cartRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting cart:", error);
    return false;
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrdersByUser,
  getCart,
  deleteCart
};
