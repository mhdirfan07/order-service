async function calculateTotalPrice(cartData) {
  let totalPrice = 0;
    totalPrice += parseFloat(cartData.price) * cartData.quantity;

  return totalPrice;
}

module.exports = { calculateTotalPrice };
