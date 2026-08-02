import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Product from "./Product";
import ProductH from "./ProductH";
import ScrollToTopOnMount from "../template/ScrollToTopOnMount";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

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
  {
    label: "Tất cả mức giá",
    min: 0,
    max: Infinity,
  },
  {
    label: "Dưới 5 triệu",
    min: 0,
    max: 5000000,
  },
  {
    label: "5 - 10 triệu",
    min: 5000000,
    max: 10000000,
  },
  {
    label: "10 - 20 triệu",
    min: 10000000,
    max: 20000000,
  },
  {
    label: "Trên 20 triệu",
    min: 20000000,
    max: Infinity,
  },
];

function getCategorySlug(category) {
  return category?.slug || category?.category_slug || "";
}

function getCategoryName(category) {
  return category?.name || category?.category_name || "Danh mục";
}

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

          {categoriesList
            .filter((category) => getCategorySlug(category) !== "all")
            .map((category) => {
              const slug = getCategorySlug(category);

              return (
                <Link
                  key={slug}
                  to={`/category/${slug}`}
                  className="btn btn-sm btn-outline-dark rounded-pill me-2 mb-2"
                >
                  {getCategoryName(category)}
                </Link>
              );
            })}
        </div>
      </li>

      <li className="list-group-item">
        <h5 className="mt-1 mb-1">Thương hiệu</h5>

        <div className="d-flex flex-column">
          {brands.map((brand) => (
            <div key={brand} className="form-check">
              <input
                id={`brand-${brand}`}
                className="form-check-input"
                type="checkbox"
                checked={selectedBrand === brand}
                onChange={() =>
                  setSelectedBrand(
                    selectedBrand === brand ? "Thương hiệu" : brand,
                  )
                }
              />

              <label
                className="form-check-label"
                htmlFor={`brand-${brand}`}
              >
                {brand}
              </label>
            </div>
          ))}
        </div>
      </li>

      <li className="list-group-item">
        <h5 className="mt-1 mb-2">Khoảng giá</h5>

        <div className="d-grid mb-3">
          <div className="form-floating mb-2">
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Min"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />

            <label>Giá thấp nhất (VNĐ)</label>
          </div>

          <div className="form-floating mb-2">
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Max"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />

            <label>Giá cao nhất (VNĐ)</label>
          </div>

          <button
            type="button"
            className="btn btn-dark"
            onClick={onApplyPrice}
          >
            Áp dụng
          </button>
        </div>
      </li>
    </ul>
  );
}

function ProductList() {
  const { categoryName } = useParams();

  const [viewType, setViewType] = useState({
    grid: true,
  });

  const [showFilter, setShowFilter] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [selectedBrand, setSelectedBrand] =
    useState("Thương hiệu");

  const [selectedPriceLabel, setSelectedPriceLabel] =
    useState("Khoảng giá");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("500000000");

  const [appliedPriceRange, setAppliedPriceRange] = useState({
    min: 0,
    max: Infinity,
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 12;
  const isProductPage = !categoryName;

  const currentCategory = useMemo(() => {
    if (!categoryName) {
      return null;
    }

    return (
      categories.find(
        (category) =>
          getCategorySlug(category).toLowerCase() ===
          String(categoryName).toLowerCase(),
      ) || null
    );
  }, [categories, categoryName]);

  const activeCategory = selectedCategory || currentCategory;

  const pageTitle = activeCategory
    ? getCategoryName(activeCategory)
    : "Tất cả sản phẩm";

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const response = await fetch(`${API_URL}/categories`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Không tải được danh mục");
        }

        const result = await response.json();

        const categoryList = Array.isArray(result)
          ? result
          : result.data || [];

        if (categoryList.length === 0) {
          return;
        }

        const formattedCategories = categoryList.map((category) => ({
          ...category,
          name:
            category.category_name ||
            category.name ||
            "Danh mục",
          slug:
            category.category_slug ||
            category.slug ||
            "",
        }));

        setCategories(formattedCategories);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("Lỗi tải danh mục:", requestError);
        }
      }
    }

    loadCategories();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    categoryName,
    selectedCategory,
    selectedBrand,
    appliedPriceRange,
    searchTerm,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
        });

        const categorySlug = getCategorySlug(activeCategory);

        if (categorySlug && categorySlug !== "all") {
          params.set("category", categorySlug);
        }

        if (selectedBrand !== "Thương hiệu") {
          params.set("brand", selectedBrand);
        }

        if (appliedPriceRange.min > 0) {
          params.set(
            "minPrice",
            String(appliedPriceRange.min),
          );
        }

        if (appliedPriceRange.max !== Infinity) {
          params.set(
            "maxPrice",
            String(appliedPriceRange.max),
          );
        }

        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }

        const response = await fetch(
          `${API_URL}/products?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            "Không tải được sản phẩm từ backend",
          );
        }

        const result = await response.json();

        const productList = Array.isArray(result)
          ? result
          : result.data || [];

        const pagination = result.pagination || {};

        const mappedProducts = productList.map((item) => ({
          ...item,
          id: item.product_id || item.id,
          name:
            item.product_name ||
            item.name ||
            "Sản phẩm",
          title:
            item.product_name ||
            item.name ||
            "Sản phẩm",
          price: Number(
            item.base_price ??
              item.price ??
              0,
          ),
          brand:
            item.brand_name ||
            item.brand ||
            "",
          img:
            item.image_url ||
            item.img ||
            "https://via.placeholder.com/300",
          rating: Number(
            item.average_rating ??
              item.rating ??
              5,
          ),
          percentOff: Number(
            item.percent_off ??
              item.percentOff ??
              0,
          ),
          sold: Number(item.sold || 0),
        }));

        setProducts(mappedProducts);
        setTotalPages(
          Math.max(
            Number(pagination.totalPages || 1),
            1,
          ),
        );
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setProducts([]);
          setTotalPages(1);
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [
    activeCategory,
    selectedBrand,
    appliedPriceRange,
    searchTerm,
    currentPage,
  ]);

  const handleApplyCustomPrice = () => {
    const parsedMin = Number(minPrice);
    const parsedMax = Number(maxPrice);

    const min =
      Number.isFinite(parsedMin) && parsedMin >= 0
        ? parsedMin
        : 0;

    const max =
      Number.isFinite(parsedMax) && parsedMax > 0
        ? parsedMax
        : Infinity;

    const normalizedMax = max < min ? min : max;

    setAppliedPriceRange({
      min,
      max: normalizedMax,
    });

    setSelectedPriceLabel(
      normalizedMax === Infinity
        ? `Từ ${min.toLocaleString("vi-VN")}đ`
        : `${min.toLocaleString(
            "vi-VN",
          )}đ - ${normalizedMax.toLocaleString(
            "vi-VN",
          )}đ`,
    );
  };

  const handleSelectPriceRange = (range) => {
    setAppliedPriceRange({
      min: range.min,
      max: range.max,
    });

    setSelectedPriceLabel(range.label);
    setMinPrice(String(range.min));

    setMaxPrice(
      range.max === Infinity
        ? ""
        : String(range.max),
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand("Thương hiệu");
    setSelectedPriceLabel("Khoảng giá");

    setAppliedPriceRange({
      min: 0,
      max: Infinity,
    });

    setMinPrice("0");
    setMaxPrice("500000000");
    setSearchTerm("");
    setSearchInput("");
    setCurrentPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  const handleCategorySelect = (category) => {
    const selectedSlug = getCategorySlug(selectedCategory);
    const clickedSlug = getCategorySlug(category);

    setSelectedCategory(
      selectedSlug === clickedSlug ? null : category,
    );
  };

  return (
    <div className="container product-page py-4 px-xl-5">
      <ScrollToTopOnMount />

      <section className="product-page-hero">
        <div>
          <span className="product-page-kicker">
            ElectroShop collection
          </span>

          <h1>{pageTitle}</h1>

          <p>
            Khám phá sản phẩm công nghệ nổi bật, sắp xếp
            gọn gàng để người dùng xem nhanh, so sánh dễ
            và thêm vào giỏ chỉ trong một nhịp.
          </p>
        </div>

        <div className="product-page-trust">
          <span>
            <FontAwesomeIcon icon={["fas", "truck"]} />
            Giao nhanh
          </span>

          <span>
            <FontAwesomeIcon
              icon={["fas", "shield-alt"]}
            />
            Bảo hành
          </span>

          <span>
            <FontAwesomeIcon
              icon={["fas", "sync-alt"]}
            />
            Đổi trả
          </span>
        </div>
      </section>

      <nav
        aria-label="breadcrumb"
        className="bg-custom-light rounded"
      >
        <ol className="breadcrumb p-3 mb-0">
          <li className="breadcrumb-item">
            <Link
              className="text-decoration-none link-secondary"
              to="/products"
            >
              Sản phẩm
            </Link>
          </li>

          <li
            className="breadcrumb-item active"
            aria-current="page"
          >
            {pageTitle}
          </li>
        </ol>
      </nav>

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

          {categories
            .filter(
              (category) =>
                getCategorySlug(category) !== "all",
            )
            .map((category) => {
              const slug = getCategorySlug(category);

              return (
                <div
                  key={slug}
                  className="h-link me-2"
                >
                  <Link
                    to={`/category/${slug}`}
                    className="btn btn-sm btn-outline-dark rounded-pill"
                  >
                    {getCategoryName(category)}
                  </Link>
                </div>
              );
            })}
        </nav>
      </div>

      <div className="row mb-3 d-block d-lg-none mt-3">
        <div className="col-12">
          <div
            id="accordionFilter"
            className="accordion shadow-sm"
          >
            <div className="accordion-item">
              <h2
                className="accordion-header"
                id="headingOne"
              >
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

      <div className="row mb-4 mt-lg-3 product-shop-layout">
        <div className="col-12">
          <div className="d-flex flex-column h-100">
            <div className="d-flex justify-content-between align-items-center mb-3 product-list-heading">
              <div>
                <h3 className="fw-bold mb-1">
                  {pageTitle}
                </h3>

                <p className="text-muted mb-0">
                  Tìm kiếm và lựa chọn sản phẩm điện tử
                  phù hợp với nhu cầu.
                </p>
              </div>
            </div>

            <div className="filter-toolbar mb-3 d-flex align-items-center flex-wrap gap-2">
              <button
                type="button"
                className={`filter-chip ${
                  showFilter ? "active" : ""
                }`}
                onClick={() =>
                  setShowFilter((previous) => !previous)
                }
              >
                <FontAwesomeIcon
                  icon={["fas", "sliders-h"]}
                />
                Bộ lọc
              </button>

              {selectedCategory && (
                <span className="filter-chip active">
                  {getCategoryName(selectedCategory)}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCategory(null)
                    }
                  >
                    ✕
                  </button>
                </span>
              )}

              {selectedBrand !== "Thương hiệu" && (
                <span className="filter-chip active">
                  {selectedBrand}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedBrand("Thương hiệu")
                    }
                  >
                    ✕
                  </button>
                </span>
              )}

              {selectedPriceLabel !== "Khoảng giá" && (
                <span className="filter-chip active">
                  {selectedPriceLabel}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPriceLabel(
                        "Khoảng giá",
                      );

                      setAppliedPriceRange({
                        min: 0,
                        max: Infinity,
                      });

                      setMinPrice("0");
                      setMaxPrice("500000000");
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            {showFilter && (
              <div className="filter-popup mb-4 p-3 border rounded bg-light">
                <div className="filter-box">
                  {isProductPage && (
                    <>
                      <h5 className="mb-3">
                        Danh mục
                      </h5>

                      <div className="filter-option-wrap d-flex flex-wrap gap-2 mb-4">
                        {categories.map((category) => {
                          const slug =
                            getCategorySlug(category);

                          const isSelected =
                            getCategorySlug(
                              selectedCategory,
                            ) === slug;

                          return (
                            <button
                              key={slug}
                              type="button"
                              className={`btn btn-sm ${
                                isSelected
                                  ? "btn-dark"
                                  : "btn-outline-dark"
                              }`}
                              onClick={() =>
                                handleCategorySelect(
                                  category,
                                )
                              }
                            >
                              {getCategoryName(category)}
                            </button>
                          );
                        })}
                      </div>

                      <hr />
                    </>
                  )}

                  <h5 className="mb-3">
                    Thương hiệu
                  </h5>

                  <div className="filter-option-wrap d-flex flex-wrap gap-2 mb-3">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        className={`btn btn-sm ${
                          selectedBrand === brand
                            ? "btn-dark"
                            : "btn-outline-dark"
                        }`}
                        onClick={() =>
                          setSelectedBrand(
                            selectedBrand === brand
                              ? "Thương hiệu"
                              : brand,
                          )
                        }
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  <hr />

                  <h5 className="mb-3">
                    Khoảng giá
                  </h5>

                  <div className="filter-option-wrap d-flex flex-wrap gap-2 mb-3">
                    {priceRanges.map((range) => (
                      <button
                        key={range.label}
                        type="button"
                        className={`btn btn-sm ${
                          selectedPriceLabel ===
                          range.label
                            ? "btn-dark"
                            : "btn-outline-dark"
                        }`}
                        onClick={() =>
                          handleSelectPriceRange(range)
                        }
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>

                  <div className="row g-2 mt-2">
                    <div className="col-md-6">
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="Giá thấp nhất"
                        value={minPrice}
                        onChange={(event) =>
                          setMinPrice(event.target.value)
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="Giá cao nhất"
                        value={maxPrice}
                        onChange={(event) =>
                          setMaxPrice(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={handleResetFilters}
                    >
                      Xóa bộ lọc
                    </button>

                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={handleApplyCustomPrice}
                    >
                      Áp dụng giá
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() =>
                        setShowFilter(false)
                      }
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="search-toolbar d-flex align-items-center mb-4">
              <form
                onSubmit={handleSearchSubmit}
                className="input-group"
              >
                <input
                  type="search"
                  className="form-control"
                  placeholder="Tìm sản phẩm..."
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                />

                <button
                  type="submit"
                  className="btn btn-dark"
                >
                  <FontAwesomeIcon
                    icon={["fas", "search"]}
                  />
                </button>
              </form>

              <button
                type="button"
                className="btn btn-outline-dark ms-3"
                onClick={() =>
                  setViewType((previous) => ({
                    grid: !previous.grid,
                  }))
                }
                title="Đổi giao diện hiển thị"
              >
                <FontAwesomeIcon
                  icon={[
                    "fas",
                    viewType.grid
                      ? "th-list"
                      : "th-large",
                  ]}
                />
              </button>
            </div>

            <div
              className={
                "row row-cols-1 row-cols-md-2 row-cols-lg-2 g-3 mb-4 flex-shrink-0 " +
                (viewType.grid
                  ? "row-cols-xl-3"
                  : "row-cols-xl-2")
              }
            >
              {loading && (
                <div className="col-12 py-5 text-center">
                  <div
                    className="spinner-border text-dark me-2"
                    role="status"
                  />

                  Đang tải sản phẩm từ database...
                </div>
              )}

              {!loading && error && (
                <div className="col-12">
                  <div className="alert alert-danger">
                    Lỗi kết nối Backend: {error}
                  </div>
                </div>
              )}

              {!loading &&
                !error &&
                products.length === 0 && (
                  <div className="col-12 py-5 text-center text-muted">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </div>
                )}

              {!loading &&
                !error &&
                products.map((product, index) => {
                  const productKey =
                    product.id ||
                    product.product_id ||
                    index;

                  return viewType.grid ? (
                    <Product
                      key={productKey}
                      product={product}
                      percentOff={
                        product.percentOff
                      }
                    />
                  ) : (
                    <ProductH
                      key={productKey}
                      product={product}
                      percentOff={
                        product.percentOff
                      }
                    />
                  );
                })}
            </div>

            {!loading && !error && totalPages > 0 && (
              <div className="d-flex align-items-center mt-auto">
                <span className="text-muted small d-none d-md-inline">
                  Trang {currentPage} / {totalPages}{" "}
                  (Hiển thị {products.length} sản phẩm)
                </span>

                <nav
                  aria-label="Page navigation"
                  className="ms-auto"
                >
                  <ul className="pagination my-0">
                    <li
                      className={`page-item ${
                        currentPage === 1
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((previous) =>
                            Math.max(
                              previous - 1,
                              1,
                            ),
                          )
                        }
                      >
                        Trước
                      </button>
                    </li>

                    {Array.from(
                      {
                        length: totalPages,
                      },
                      (_, index) => index + 1,
                    ).map((pageNumber) => (
                      <li
                        key={pageNumber}
                        className={`page-item ${
                          currentPage === pageNumber
                            ? "active"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() =>
                            setCurrentPage(pageNumber)
                          }
                        >
                          {pageNumber}
                        </button>
                      </li>
                    ))}

                    <li
                      className={`page-item ${
                        currentPage === totalPages
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        disabled={
                          currentPage === totalPages
                        }
                        onClick={() =>
                          setCurrentPage((previous) =>
                            Math.min(
                              previous + 1,
                              totalPages,
                            ),
                          )
                        }
                      >
                        Tiếp
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductList;