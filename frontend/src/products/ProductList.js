import { Link, useParams } from "react-router-dom";
import Product from "./Product";
import ProductH from "./ProductH";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ScrollToTopOnMount from "../template/ScrollToTopOnMount";

const defaultCategories = [
  { name: "Tất cả sản phẩm", slug: "all" },
  { name: "Điện thoại", slug: "dien-thoai" },
  { name: "Laptop", slug: "laptop" },
  { name: "Phụ kiện", slug: "phu-kien" },
  { name: "Linh kiện PC", slug: "linh-kien-pc" },
  { name: "Màn hình", slug: "man-hinh" },
];

const brands = [
  "Apple",
  "Samsung",
  "Asus",
  "Dell",
  "Lenovo",
  "Xiaomi",
  "Acer",
  "HP",
  "MSI",
  "Anker",
  "Logitech",
  "Sony",
];

const priceRanges = [
  { label: "Tất cả mức giá", min: 0, max: Infinity },
  { label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: Infinity },
];

function FilterMenuLeft({
  categoriesList,
  selectedBrand,
  setSelectedBrand,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  onApplyPrice,
}) {
  return (
    <ul className="list-group list-group-flush rounded">
      <li className="list-group-item d-none d-lg-block">
        <h5 className="mt-1 mb-2">Danh mục</h5>
        <div className="d-flex flex-wrap my-2">
          <Link
            to="/products"
            className="btn btn-sm btn-outline-dark rounded-pill me-2 mb-2"
          >
            Tất cả sản phẩm
          </Link>
          {categoriesList.map((item) => (
            <Link
              key={item.slug || item.category_slug}
              to={
                item.slug === "all" || item.category_slug === "all"
                  ? "/products"
                  : `/category/${item.slug || item.category_slug}`
              }
              className="btn btn-sm btn-outline-dark rounded-pill me-2 mb-2"
            >
              {item.name || item.category_name}
            </Link>
          ))}
        </div>
      </li>

      <li className="list-group-item">
        <h5 className="mt-1 mb-1">Thương hiệu</h5>
        <div className="d-flex flex-column">
          {brands.map((brand) => (
            <div key={brand} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`brand-${brand}`}
                checked={selectedBrand === brand}
                onChange={() =>
                  setSelectedBrand(
                    selectedBrand === brand ? "Thương hiệu" : brand,
                  )
                }
              />
              <label className="form-check-label" htmlFor={`brand-${brand}`}>
                {brand}
              </label>
            </div>
          ))}
        </div>
      </li>

      <li className="list-group-item">
        <h5 className="mt-1 mb-2">Khoảng giá</h5>
        <div className="d-grid d-block mb-3">
          <div className="form-floating mb-2">
            <input
              type="number"
              className="form-control"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <label>Giá thấp nhất (VNĐ)</label>
          </div>

          <div className="form-floating mb-2">
            <input
              type="number"
              className="form-control"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <label>Giá cao nhất (VNĐ)</label>
          </div>

          <button className="btn btn-dark" onClick={onApplyPrice}>
            Áp dụng
          </button>
        </div>
      </li>
    </ul>
  );
}

function ProductList() {
  const [viewType, setViewType] = useState({ grid: true });
  const [showFilter, setShowFilter] = useState(false);

  // State Danh mục (Động từ API + Fallback)
  const [categories, setCategories] = useState(defaultCategories);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // State bộ lọc
  const [selectedBrand, setSelectedBrand] = useState("Thương hiệu");
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("Khoảng giá");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // State giá nhập thủ công
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("500000000");
  const [appliedPriceRange, setAppliedPriceRange] = useState({
    min: 0,
    max: Infinity,
  });

  // State dữ liệu API và phân trang backend
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  const { categoryName } = useParams();

  // Reset về trang 1 khi thay đổi bộ lọc hoặc danh mục
  useEffect(() => {
    setCurrentPage(1);
  }, [
    categoryName,
    selectedCategory,
    selectedBrand,
    appliedPriceRange,
    searchTerm,
  ]);

  // 1. TẢI DANH MỤC TỪ BACKEND
  useEffect(() => {
    fetch("http://localhost:3001/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const catList = Array.isArray(data) ? data : data.data || [];
        if (catList.length > 0) {
          const formattedCats = catList.map((c) => ({
            ...c,
            name: c.category_name || c.name,
            slug: c.category_slug || c.slug,
          }));
          setCategories(formattedCats);
        }
      })
      .catch((err) => console.error("Lỗi tải danh mục:", err));
  }, []);

  const currentCategory = categories.find(
    (item) =>
      String(item.slug).toLowerCase() === String(categoryName).toLowerCase(),
  );

  // 2. TẢI DỮ LIỆU SẢN PHẨM CÓ GỬI KÈM THAM SỐ LỌC LÊN BACKEND
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const activeCat = selectedCategory || currentCategory;
    const catSlug = activeCat
      ? activeCat.slug || activeCat.category_slug
      : "all";
    const brandParam = selectedBrand !== "Thương hiệu" ? selectedBrand : "";
    const minParam = appliedPriceRange.min > 0 ? appliedPriceRange.min : "";
    const maxParam =
      appliedPriceRange.max !== Infinity ? appliedPriceRange.max : "";

    let url = `${process.env.REACT_APP_API_URL || "http://localhost:3001/api"}/products?page=${currentPage}&limit=${limit}`;

    if (catSlug && catSlug !== "all")
      url += `&category=${encodeURIComponent(catSlug)}`;
    if (brandParam) url += `&brand=${encodeURIComponent(brandParam)}`;
    if (minParam !== "") url += `&minPrice=${minParam}`;
    if (maxParam !== "") url += `&maxPrice=${maxParam}`;
    if (searchTerm.trim() !== "")
      url += `&search=${encodeURIComponent(searchTerm.trim())}`;

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được sản phẩm từ backend");
        return response.json();
      })
      .then((data) => {
        const rawList = Array.isArray(data) ? data : data.data || [];
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }

        const mappedProducts = rawList.map((item) => {
          return {
            ...item,
            id: item.product_id || item.id,
            name: item.product_name || item.name || "Sản phẩm",
            title: item.product_name || item.name || "Sản phẩm",
            price: Number(item.base_price || item.price || 0),
            brand: item.brand_name || item.brand || "",
            img:
              item.image_url || item.img || "https://via.placeholder.com/300",
            rating: Number(item.average_rating || item.rating || 5),
            percentOff: Number(item.percent_off || 0),
            sold: Number(item.sold || 0),
          };
        });

        setProducts(mappedProducts);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [
    currentPage,
    selectedCategory,
    currentCategory,
    selectedBrand,
    appliedPriceRange,
    searchTerm,
  ]);

  const handleApplyCustomPrice = () => {
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Infinity;
    setAppliedPriceRange({ min, max });
    setSelectedPriceLabel(
      `${min.toLocaleString("vi-VN")}đ - ${max.toLocaleString("vi-VN")}đ`,
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand("Thương hiệu");
    setSelectedPriceLabel("Khoảng giá");
    setAppliedPriceRange({ min: 0, max: Infinity });
    setMinPrice("0");
    setMaxPrice("500000000");
    setSearchTerm("");
    setSearchInput("");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  return (
    <div className="container product-page py-4 px-xl-5">
      <ScrollToTopOnMount />

      {/* Banner / Header */}
      <section className="product-page-hero">
        <div>
          <span className="product-page-kicker">ElectroShop collection</span>
          <h1>
            {selectedCategory
              ? selectedCategory.name || selectedCategory.category_name
              : currentCategory
                ? currentCategory.name
                : "Tất cả sản phẩm"}
          </h1>
          <p>
            Khám phá sản phẩm công nghệ nổi bật, sắp xếp gọn gàng để người dùng
            xem nhanh, so sánh dễ và thêm vào giỏ chỉ trong một nhịp.
          </p>
        </div>

        <div className="product-page-trust">
          <span>
            <FontAwesomeIcon icon={["fas", "truck"]} />
            Giao nhanh
          </span>
          <span>
            <FontAwesomeIcon icon={["fas", "shield-alt"]} />
            Bảo hành
          </span>
          <span>
            <FontAwesomeIcon icon={["fas", "sync-alt"]} />
            Đổi trả
          </span>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="bg-custom-light rounded">
        <ol className="breadcrumb p-3 mb-0">
          <li className="breadcrumb-item">
            <Link
              className="text-decoration-none link-secondary"
              to="/products"
            >
              Sản phẩm
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {selectedCategory
              ? selectedCategory.name || selectedCategory.category_name
              : currentCategory
                ? currentCategory.name
                : "Tất cả sản phẩm"}
          </li>
        </ol>
      </nav>

      {/* Horizontal Category Scroller (Mobile) */}
      <div className="h-scroller d-block d-lg-none mt-3">
        <nav className="nav h-underline">
          <div className="h-link me-2">
            <Link
              to="/products"
              className="btn btn-sm btn-outline-dark rounded-pill"
              onClick={() => setSelectedCategory(null)}
            >
              Tất cả
            </Link>
          </div>
          {categories.map((item) => (
            <div key={item.slug || item.category_slug} className="h-link me-2">
              <Link
                to={
                  item.slug === "all"
                    ? "/products"
                    : `/category/${item.slug || item.category_slug}`
                }
                className="btn btn-sm btn-outline-dark rounded-pill"
              >
                {item.name || item.category_name}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Accordion Filter (Mobile) */}
      <div className="row mb-3 d-block d-lg-none mt-3">
        <div className="col-12">
          <div id="accordionFilter" className="accordion shadow-sm">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingOne">
                <button
                  className="accordion-button fw-bold collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseFilter"
                  aria-expanded="false"
                  aria-controls="collapseFilter"
                >
                  Bộ lọc sản phẩm
                </button>
              </h2>
            </div>

            <div
              id="collapseFilter"
              className="accordion-collapse collapse"
              data-bs-parent="#accordionFilter"
            >
              <div className="accordion-body p-0">
                <FilterMenuLeft
                  categoriesList={categories}
                  selectedBrand={selectedBrand}
                  setSelectedBrand={setSelectedBrand}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  onApplyPrice={handleApplyCustomPrice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Chính */}
      <div className="row mb-4 mt-lg-3 product-shop-layout">
        <div className="col-12">
          <div className="d-flex flex-column h-100">
            {/* Title Block */}
            <div className="d-flex justify-content-between align-items-center mb-3 product-list-heading">
              <div>
                <h3 className="fw-bold mb-1">
                  {selectedCategory
                    ? selectedCategory.name || selectedCategory.category_name
                    : currentCategory
                      ? currentCategory.name
                      : "Tất cả sản phẩm"}
                </h3>
                <p className="text-muted mb-0">
                  Tìm kiếm và lựa chọn sản phẩm điện tử phù hợp với nhu cầu.
                </p>
              </div>
            </div>

            {/* Quick Filter Bar */}
            <div className="filter-toolbar mb-3 d-flex flex-wrap gap-2 position-relative">
              <button
                className={`filter-chip ${showFilter ? "active" : ""}`}
                onClick={() => setShowFilter(!showFilter)}
              >
                <FontAwesomeIcon icon={["fas", "sliders-h"]} />
                Bộ lọc
              </button>

              {/* DROPDOWN CHỌN DANH MỤC */}
              <div className="position-relative d-inline-block">
                <button
                  className={`filter-chip ${selectedCategory ? "active" : ""}`}
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  {selectedCategory
                    ? selectedCategory.name || selectedCategory.category_name
                    : currentCategory
                      ? currentCategory.name
                      : "Danh mục"}
                  <FontAwesomeIcon
                    icon={["fas", "angle-down"]}
                    className="ms-1"
                  />
                </button>

                {showCategoryDropdown && (
                  <ul
                    className="dropdown-menu show position-absolute mt-1 shadow-lg rounded-3 border-0 p-2"
                    style={{
                      zIndex: 1050,
                      minWidth: "220px",
                      top: "100%",
                      left: 0,
                    }}
                  >
                    <li>
                      <button
                        className={`dropdown-item rounded py-2 ${
                          !selectedCategory ? "fw-bold text-danger" : ""
                        }`}
                        onClick={() => {
                          setSelectedCategory(null);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        Tất cả danh mục
                      </button>
                    </li>
                    <hr className="dropdown-divider my-1" />
                    {categories.map((cat) => (
                      <li key={cat.slug || cat.category_id}>
                        <button
                          className={`dropdown-item rounded py-2 ${
                            selectedCategory?.slug === cat.slug ||
                            selectedCategory?.category_id === cat.category_id
                              ? "active bg-danger text-white"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {cat.name || cat.category_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button className="filter-chip">
                {selectedBrand}
                <FontAwesomeIcon icon={["fas", "angle-down"]} />
              </button>

              <button className="filter-chip">
                {selectedPriceLabel}
                <FontAwesomeIcon icon={["fas", "angle-down"]} />
              </button>

              {(selectedCategory ||
                selectedBrand !== "Thương hiệu" ||
                selectedPriceLabel !== "Khoảng giá" ||
                searchTerm) && (
                <button
                  className="btn btn-sm btn-outline-danger ms-auto rounded-pill"
                  onClick={handleResetFilters}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Modal/Popup Lọc Nhanh */}
            {showFilter && (
              <div className="filter-popup mb-4 p-3 border rounded bg-light">
                <div className="filter-box">
                  <h5 className="mb-3">Thương hiệu</h5>
                  <div className="filter-option-wrap d-flex flex-wrap gap-2 mb-3">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        className={`btn btn-sm ${
                          selectedBrand === brand
                            ? "btn-dark"
                            : "btn-outline-dark"
                        }`}
                        onClick={() =>
                          setSelectedBrand(
                            selectedBrand === brand ? "Thương hiệu" : brand,
                          )
                        }
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  <hr />

                  <h5 className="mb-3">Khoảng giá</h5>
                  <div className="filter-option-wrap d-flex flex-wrap gap-2 mb-3">
                    {priceRanges.map((range) => (
                      <button
                        key={range.label}
                        className={`btn btn-sm ${
                          selectedPriceLabel === range.label
                            ? "btn-dark"
                            : "btn-outline-dark"
                        }`}
                        onClick={() => {
                          setAppliedPriceRange({
                            min: range.min,
                            max: range.max,
                          });
                          setSelectedPriceLabel(range.label);
                        }}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button
                      className="btn btn-light me-2"
                      onClick={handleResetFilters}
                    >
                      Xóa bộ lọc
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowFilter(false)}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Thanh tìm kiếm & Đổi kiểu hiển thị */}
            <div className="search-toolbar d-flex align-items-center mb-4">
              <form onSubmit={handleSearchSubmit} className="input-group">
                <input
                  className="form-control"
                  placeholder="Tìm sản phẩm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className="btn btn-dark">
                  <FontAwesomeIcon icon={["fas", "search"]} />
                </button>
              </form>

              <button
                className="btn btn-outline-dark ms-3"
                onClick={() => setViewType({ grid: !viewType.grid })}
                title="Đổi giao diện hiển thị"
              >
                <FontAwesomeIcon
                  icon={["fas", viewType.grid ? "th-list" : "th-large"]}
                />
              </button>
            </div>

            {/* Danh sách Sản phẩm */}
            <div
              className={
                "row row-cols-1 row-cols-md-2 row-cols-lg-2 g-3 mb-4 flex-shrink-0 " +
                (viewType.grid ? "row-cols-xl-3" : "row-cols-xl-2")
              }
            >
              {loading && (
                <div className="col-12 py-5 text-center">
                  <div
                    className="spinner-border text-dark me-2"
                    role="status"
                  ></div>
                  Đang tải sản phẩm từ database...
                </div>
              )}

              {error && (
                <div className="col-12 alert alert-danger">
                  Lỗi kết nối Backend: {error}
                </div>
              )}

              {!loading && !error && products.length === 0 && (
                <div className="col-12 py-5 text-center text-muted">
                  Không tìm thấy sản phẩm nào phù hợp.
                </div>
              )}

              {!loading &&
                !error &&
                products.map((product, index) => {
                  const itemKey = product.id || index;
                  return viewType.grid ? (
                    <Product
                      key={itemKey}
                      product={product}
                      percentOff={product.percentOff}
                    />
                  ) : (
                    <ProductH
                      key={itemKey}
                      product={product}
                      percentOff={product.percentOff}
                    />
                  );
                })}
            </div>

            {/* Phân trang động */}
            <div className="d-flex align-items-center mt-auto">
              <span className="text-muted small d-none d-md-inline">
                Trang {currentPage} / {totalPages} (Hiển thị {products.length}{" "}
                sản phẩm)
              </span>

              <nav aria-label="Page navigation" className="ms-auto">
                <ul className="pagination my-0">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                    >
                      Trước
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (num) => (
                      <li
                        key={num}
                        className={`page-item ${currentPage === num ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(num)}
                        >
                          {num}
                        </button>
                      </li>
                    ),
                  )}

                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                    >
                      Tiếp
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductList;
