import { Link, NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { getCart } from "../utils/cartStorage";
import Login from "../login/Login";


const logo = `${process.env.PUBLIC_URL}/logo/e-shop-logo.png`;

function Header() {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  console.log("showLogin:", showLogin);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    function closeMenusOutside(event) {
        if (
    categoryDropdownRef.current &&
    !categoryDropdownRef.current.contains(event.target)
   ) {
    setIsCategoryOpen(false);
   }


  }

    function closeCategoryMenuOnEscape(event) {
      if (event.key === "Escape") {
        setIsCategoryOpen(false);
        setIsNavOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenusOutside);
    document.addEventListener("keydown", closeCategoryMenuOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeMenusOutside);
      document.removeEventListener("keydown", closeCategoryMenuOnEscape);
    };
  }, []);

  useEffect(() => {
  function updateCart() {
    const cart = getCart();

    const count = cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    setCartCount(count);
  }

  updateCart();

  window.addEventListener("eshop:cart-updated", updateCart);

  return () => {
    window.removeEventListener("eshop:cart-updated", updateCart);
  };
  }, []);

  function closeMenus() {
    setIsCategoryOpen(false);
    setIsNavOpen(false);
  }
 
  const getNavLinkClassName = ({ isActive }) =>
    isActive ? "eshop-nav-link is-active" : "eshop-nav-link";

  return (
    <>
    <header className="eshop-header">
      <div className="eshop-topbar">
        <div className="container-fluid eshop-header-inner">
          <Link to="/" className="eshop-logo" aria-label="ElectroShop - Trang chủ">
            <img className="eshop-logo-image" src={logo} alt="ElectroShop" />
          </Link>

          <div className="eshop-search">
            <input
              type="text"
              placeholder="Tìm điện thoại, laptop, phụ kiện..."
            />
            <button type="button" aria-label="Tìm kiếm">
              <FontAwesomeIcon icon={["fas", "search"]} />
            </button>
          </div>

          <div className="eshop-actions">
            <Link to="/about" className="eshop-action-item">
              <FontAwesomeIcon icon={["fas", "phone-alt"]} />
              <span>Liên hệ</span>
            </Link>

            <Link to="/cart" className="eshop-action-item eshop-cart-action">
              <FontAwesomeIcon icon={["fas", "shopping-cart"]} />
              <span>Giỏ hàng</span>
              <b key={cartCount}>{cartCount}</b>
            </Link>
            <button
              type="button"
              className="eshop-user-btn"
              onClick={() => setShowLogin(true)}
            >
              <FontAwesomeIcon icon={["fas", "user-alt"]} />
              <span>Tài khoản</span>
            </button>
          </div>

          <button
            type="button"
            className="eshop-mobile-menu-btn"
            aria-label={
              isNavOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"
            }
            aria-controls="eshop-main-navigation"
            aria-expanded={isNavOpen}
            onClick={() => {
              setIsNavOpen((isOpen) => !isOpen);
              setIsCategoryOpen(false);
            }}
          >
            <FontAwesomeIcon icon={["fas", isNavOpen ? "times" : "bars"]} />
          </button>
        </div>
      </div>

      <nav
        id="eshop-main-navigation"
        className={"eshop-nav " + (isNavOpen ? "is-open" : "")}
      >
        <div className="container eshop-nav-inner">
          <div
            ref={categoryDropdownRef}
            className={
              "eshop-category-dropdown " +
              (isCategoryOpen ? "is-open" : "")
            }
          >
            <button
              type="button"
              className="eshop-category-btn"
              aria-haspopup="true"
              aria-expanded={isCategoryOpen}
              onClick={() => setIsCategoryOpen((isOpen) => !isOpen)}
            >
              <FontAwesomeIcon icon={["fas", "bars"]} />
              <span>Danh mục</span>
              <FontAwesomeIcon
                icon={["fas", "chevron-down"]}
                className="eshop-category-chevron"
              />
            </button>

            <div className="eshop-category-menu">
              <Link to="/products" onClick={closeMenus}>
                <FontAwesomeIcon icon={["fas", "th-large"]} />
                Tất cả sản phẩm
              </Link>
              <Link to="/category/dien-thoai" onClick={closeMenus}>
                <FontAwesomeIcon icon={["fas", "mobile-alt"]} />
                Điện thoại
              </Link>
              <Link to="/category/laptop" onClick={closeMenus}>
                <FontAwesomeIcon icon={["fas", "laptop"]} />
                Laptop
              </Link>
              <Link to="/category/phu-kien" onClick={closeMenus}>
                <FontAwesomeIcon icon={["fas", "headphones"]} />
                Phụ kiện
              </Link>
              <Link to="/category/linh-kien-pc" onClick={closeMenus}>
                <FontAwesomeIcon icon={["fas", "microchip"]} />
                Linh kiện PC
              </Link>
              <Link to="/category/man-hinh" onClick={closeMenus}>
                <FontAwesomeIcon icon={["fas", "desktop"]} />
                Màn hình
              </Link>
            </div>
          </div>

          <NavLink to="/" end className={getNavLinkClassName} onClick={closeMenus}>
            Trang chủ
          </NavLink>
          <NavLink to="/products" className={getNavLinkClassName} onClick={closeMenus}>
            Sản phẩm
          </NavLink>
          <NavLink
            to="/category/laptop"
            className={getNavLinkClassName}
            onClick={closeMenus}
          >
            Laptop
          </NavLink>
          <NavLink
            to="/category/dien-thoai"
            className={getNavLinkClassName}
            onClick={closeMenus}
          >
            Điện thoại
          </NavLink>
          <NavLink
            to="/category/phu-kien"
            className={getNavLinkClassName}
            onClick={closeMenus}
          >
            Phụ kiện
          </NavLink>
          <NavLink to="/about" className={getNavLinkClassName} onClick={closeMenus}>
            Giới thiệu
          </NavLink>

        </div>
      </nav>
      
    </header>
    <Login
       show={showLogin}
       onClose={() => setShowLogin(false)}
      />
    </>
  );
}

export default Header;
