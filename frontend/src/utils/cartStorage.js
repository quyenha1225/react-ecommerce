const CART_KEY = "eshop-cart";

export function getCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(item => item && item.id !== undefined).map(item => ({
      ...item,
      price: Math.max(0, Number(item.price) || 0),
      oldPrice: Math.max(0, Number(item.oldPrice ?? item.price) || 0),
      quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
      image: item.image || item.image_url || "",
    }));
  } catch {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

export function saveCart(cart) {
  const safeCart = Array.isArray(cart) ? cart.filter(Boolean) : [];
  localStorage.setItem(CART_KEY, JSON.stringify(safeCart));

  window.dispatchEvent(
    new CustomEvent("eshop:cart-updated", {
      detail: {
        count: safeCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      },
    })
  );
}

export function addToCart(product) {
  if (!product || product.id === undefined || !product.name) return false;
  const cart = getCart();
  const productId = String(product.id);
  const index = cart.findIndex((item) => String(item.id) === productId);

  if (index !== -1) {
    cart[index].quantity += 1;
  } else {
    cart.push({
      ...product,
      price: Math.max(0, Number(product.price) || 0),
      oldPrice: Math.max(0, Number(product.oldPrice ?? product.price) || 0),
      image: product.image || product.image_url || "",
      quantity: 1,
    });
  }

  saveCart(cart);
  return true;
}

export function removeCartItem(id) {
  saveCart(getCart().filter((item) => String(item.id) !== String(id)));
}

export function increaseQuantity(id) {
  const cart = getCart();

  cart.forEach((item) => {
    if (String(item.id) === String(id)) item.quantity++;
  });

  saveCart(cart);
}

export function decreaseQuantity(id) {
  const cart = getCart();

  cart.forEach((item) => {
    if (String(item.id) === String(id) && item.quantity > 1) item.quantity--;
  });

  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}
