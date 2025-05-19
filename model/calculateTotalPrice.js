const { getCart } = require("./order");

// Fungsi untuk menghitung totalPrice berdasarkan cartId
async function calculateTotalPrice(cartId) {
  try {
    // Mengambil cart
    const cartData = await getCart(cartId);
    const items = cartData.items; // Mengambil daftar item dalam cart
    let totalPrice = 0;

    // Menghitung total harga berdasarkan item dalam cart
    for (let item of items) {
      const { id, price, quantity } = item;
      totalPrice += parseFloat(price) * quantity; // Mengalikan harga dengan jumlah produk
    }

    return totalPrice; // Mengembalikan total harga
  } catch (error) {
    throw new Error("Error calculating total price: " + error.message);
  }
}

module.exports = { calculateTotalPrice };
