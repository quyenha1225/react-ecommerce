const CART_KEY = "eshop-cart";

export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  window.dispatchEvent(
    new CustomEvent("eshop:cart-updated", {
      detail: {
        count: cart.reduce((sum, item) => sum + item.quantity, 0),
      },
    })
  );
}

export function addToCart(product) {
  const cart = getCart();

  const index = cart.findIndex((item) => item.id === product.id);

  if (index !== -1) {
    cart[index].quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  saveCart(cart);
}

export function removeCartItem(id) {
  saveCart(getCart().filter((item) => item.id !== id));
}

export function increaseQuantity(id) {
  const cart = getCart();

  cart.forEach((item) => {
    if (item.id === id) item.quantity++;
  });

  saveCart(cart);
}

export function decreaseQuantity(id) {
  const cart = getCart();

  cart.forEach((item) => {
    if (item.id === id && item.quantity > 1) item.quantity--;
  });

  saveCart(cart);
}