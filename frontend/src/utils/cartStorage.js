// Hàm lấy Key lưu trữ giỏ hàng động theo tài khoản đang đăng nhập
function getCartKey() {
  try {
    const session = JSON.parse(localStorage.getItem("eshop_session") || "null");
    const userId =
      session?.user?.id || session?.user?.userId || session?.user?.sub;
    if (userId) {
      return `eshop-cart-user-${userId}`;
    }
  } catch {
    // Bỏ qua lỗi parse session
  }
  return "eshop-cart-guest";
}

// 🔀 HÀM GỘP GIỎ HÀNG KHÁCH (GUEST) SANG GIỎ HÀNG USER KHI ĐĂNG NHẬP
export function mergeGuestCartToUser() {
  try {
    const guestKey = "eshop-cart-guest";
    const guestData = localStorage.getItem(guestKey);
    if (!guestData) return;

    const guestCart = JSON.parse(guestData);
    if (!Array.isArray(guestCart) || guestCart.length === 0) return;

    // Lấy giỏ hiện tại của user
    const userCart = getCart();

    // Gộp sản phẩm
    guestCart.forEach((guestItem) => {
      const existingIndex = userCart.findIndex(
        (item) =>
          String(item.id) === String(guestItem.id) &&
          String(item.variantId || "") === String(guestItem.variantId || ""),
      );

      if (existingIndex > -1) {
        userCart[existingIndex].quantity += Number(guestItem.quantity) || 1;
      } else {
        userCart.push(guestItem);
      }
    });

    // Lưu vào giỏ hàng user và xóa giỏ hàng guest
    const userKey = getCartKey();
    localStorage.setItem(userKey, JSON.stringify(userCart));
    localStorage.removeItem(guestKey);

    // Kích hoạt cập nhật lại badge số lượng trên header
    dispatchCartUpdate(userCart);
  } catch (e) {
    console.error("Lỗi gộp giỏ hàng:", e);
  }
}

function dispatchCartUpdate(cart) {
  const totalCount = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    : 0;

  window.dispatchEvent(
    new CustomEvent("eshop:cart-updated", {
      detail: { count: totalCount },
    }),
  );
}

export function canCurrentUserShop() {
  try {
    const session = JSON.parse(localStorage.getItem("eshop_session") || "null");
    return !["ADMIN", "STAFF"].includes(session?.user?.role);
  } catch {
    return true;
  }
}

export function getCart() {
  const CART_KEY = getCartKey();
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    const formatted = stored
      .filter((item) => item && item.id !== undefined)
      .map((item) => ({
        ...item,
        price: Math.max(0, Number(item.price) || 0),
        oldPrice: Math.max(0, Number(item.oldPrice ?? item.price) || 0),
        quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
        image: item.image || item.image_url || "",
        selected: item.selected !== undefined ? item.selected : true,
      }));

    // Đồng bộ lại số lượng hiển thị trên icon khi gọi getCart
    setTimeout(() => dispatchCartUpdate(formatted), 0);
    return formatted;
  } catch {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

export function saveCart(cart) {
  const CART_KEY = getCartKey();
  const safeCart = Array.isArray(cart) ? cart.filter(Boolean) : [];
  localStorage.setItem(CART_KEY, JSON.stringify(safeCart));
  dispatchCartUpdate(safeCart);
}

export function addToCart(product) {
  if (!canCurrentUserShop()) return false;
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
      selected: true,
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

export function toggleCartItemSelect(id) {
  const cart = getCart();
  const updatedCart = cart.map((item) => {
    if (String(item.id) === String(id)) {
      return {
        ...item,
        selected: item.selected !== undefined ? !item.selected : false,
      };
    }
    return item;
  });

  saveCart(updatedCart);
}
