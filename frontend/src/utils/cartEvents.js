const CART_STORAGE_KEY = "eshop-cart-count";

export function getStoredCartCount() {
  const value = Number(window.localStorage.getItem(CART_STORAGE_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function addProductToCart() {
  const nextCount = getStoredCartCount() + 1;

  window.localStorage.setItem(CART_STORAGE_KEY, String(nextCount));
  window.dispatchEvent(
    new CustomEvent("eshop:cart-updated", {
      detail: { count: nextCount },
    })
  );

  return nextCount;
}
