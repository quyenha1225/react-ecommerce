import { Link, useParams } from "react-router-dom";
import Product from "./Product";
import ProductH from "./ProductH";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ScrollToTopOnMount from "../template/ScrollToTopOnMount";

const categories = [
  { name: "Tất cả sản phẩm", slug: "all" },
  { name: "Điện thoại", slug: "dien-thoai" },
  { name: "Laptop", slug: "laptop" },
  { name: "Phụ kiện", slug: "phu-kien" },
  { name: "Linh kiện PC", slug: "linh-kien-pc" },
  { name: "Màn hình", slug: "man-hinh" },
];

const brands = ["Apple", "Samsung", "Asus", "Dell", "Lenovo", "Xiaomi"];

function FilterMenuLeft() {
  return (
    <ul className="list-group list-group-flush rounded">
      <li className="list-group-item d-none d-lg-block">
        <h5 className="mt-1 mb-2">Danh mục</h5>

        <div className="d-flex flex-wrap my-2">
          {categories.map((item) => (
            <Link
              key={item.slug}
              to={item.slug === "all" ? "/products" : `/category/${item.slug}`}
              className="btn btn-sm btn-outline-dark rounded-pill me-2 mb-2"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </li>

      <li className="list-group-item">
        <h5 className="mt-1 mb-1">Thương hiệu</h5>

        <div className="d-flex flex-column">
          {brands.map((brand) => (
            <div key={brand} className="form-check">
              <input className="form-check-input" type="checkbox" />
              <label className="form-check-label">{brand}</label>
            </div>
          ))}
        </div>
      </li>

      <li className="list-group-item">
        <h5 className="mt-1 mb-2">Khoảng giá</h5>

        <div className="d-grid d-block mb-3">
          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Min"
              defaultValue="1000000"
            />
            <label>Giá thấp nhất</label>
          </div>

          <div className="form-floating mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Max"
              defaultValue="30000000"
            />
            <label>Giá cao nhất</label>
          </div>

          <button className="btn btn-dark">Áp dụng</button>
        </div>
      </li>
    </ul>
  );
}

function ProductList() {
  const [viewType, setViewType] = useState({ grid: true });
  const [showFilter, setShowFilter] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("Danh mục");

  const [selectedBrand, setSelectedBrand] = useState("Thương hiệu");

  const [selectedPrice, setSelectedPrice] = useState("Khoảng giá");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001/api"}/products`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Không tải được sản phẩm từ backend"); return response.json(); })
      .then(data => setProducts((Array.isArray(data) ? data : data.data || []).map(item => ({
        ...item,
        id: Number(item.id),
        price: Number(item.price || 0),
        rating: Number(item.rating || 0),
        percentOff: Number(item.percent_off || 0),
        sold: Number(item.sold || 0),
      }))))
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const { categoryName } = useParams();

  const currentCategory = categories.find((item) => item.slug === categoryName);
  const visibleProducts = useMemo(() => categoryName
    ? products.filter(product => product.category === categoryName)
    : products, [products, categoryName]);

  function changeViewType() {
    setViewType({
      grid: !viewType.grid,
    });
  }

  return (
    <div className="container product-page py-4 px-xl-5">
      <ScrollToTopOnMount />


      <section className="product-page-hero">
        <div>
          <span className="product-page-kicker">ElectroShop collection</span>
          <h1>{currentCategory ? currentCategory.name : "Tất cả sản phẩm"}</h1>
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

      <nav aria-label="breadcrumb" className="bg-custom-light rounded">
        <ol className="breadcrumb p-3 mb-0">
          <li className="breadcrumb-item">
            <Link className="text-decoration-none link-secondary" to="/products">
              Sản phẩm
            </Link>
          </li>

          <li className="breadcrumb-item active" aria-current="page">
            {currentCategory ? currentCategory.name : "Tất cả sản phẩm"}
          </li>
        </ol>
      </nav>

      <div className="h-scroller d-block d-lg-none mt-3">
        <nav className="nav h-underline">
          {categories.map((item) => (
            <div key={item.slug} className="h-link me-2">
              <Link
                to={item.slug === "all" ? "/products" : `/category/${item.slug}`}
                className="btn btn-sm btn-outline-dark rounded-pill"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </nav>
      </div>

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
                <FilterMenuLeft />
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
                  {currentCategory ? currentCategory.name : "Tất cả sản phẩm"}
                </h3>
                <p className="text-muted mb-0">
                  Tìm kiếm và lựa chọn sản phẩm điện tử phù hợp với nhu cầu.
                </p>
              </div>
            </div>
            <div className="filter-toolbar">
              <button
                className="filter-chip active"
                onClick={() => setShowFilter(!showFilter)}
              >
                    <FontAwesomeIcon icon={["fas","sliders-h"]}/>
                    Bộ lọc
                </button>

                <button className="filter-chip">
                    {selectedCategory}
                    <FontAwesomeIcon icon={["fas","angle-down"]}/>
                </button>

                <button className="filter-chip">
                    {selectedBrand}
                    <FontAwesomeIcon icon={["fas","angle-down"]}/>
                </button>

                <button className="filter-chip">
                    {selectedPrice}
                    <FontAwesomeIcon icon={["fas","angle-down"]}/>
                </button>

            </div>

            {showFilter && (

            <div className="filter-popup">

                <div className="filter-box">

                    <h5 className="mb-3">Danh mục</h5>

                    <div className="filter-option-wrap">

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedCategory("Điện thoại")}
                        >
                            Điện thoại
                        </button>

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedCategory("Laptop")}
                        >
                            Laptop
                        </button>

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedCategory("Phụ kiện")}
                        >
                            Phụ kiện
                        </button>

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedCategory("Linh kiện PC")}
                        >
                            Linh kiện PC
                        </button>

                    </div>

                    <hr/>

                    <h5 className="mb-3">Thương hiệu</h5>

                    <div className="filter-option-wrap">

                        {brands.map((brand)=>(
                            <button
                                key={brand}
                                className="filter-option"
                                onClick={()=>setSelectedBrand(brand)}
                            >
                                {brand}
                            </button>
                        ))}

                    </div>

                    <hr/>

                    <h5 className="mb-3">Khoảng giá</h5>

                    <div className="filter-option-wrap">

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedPrice("Dưới 5 triệu")}
                        >
                            Dưới 5 triệu
                        </button>

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedPrice("5 - 10 triệu")}
                        >
                            5 - 10 triệu
                        </button>

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedPrice("10 - 20 triệu")}
                        >
                            10 - 20 triệu
                        </button>

                        <button
                            className="filter-option"
                            onClick={()=>setSelectedPrice("Trên 20 triệu")}
                        >
                            Trên 20 triệu
                        </button>

                    </div>

                    <div className="d-flex justify-content-end mt-4">

                        <button
                            className="btn btn-light me-2"
                            onClick={()=>{
                                setSelectedCategory("Danh mục");
                                setSelectedBrand("Thương hiệu");
                                setSelectedPrice("Khoảng giá");
                            }}
                        >
                            Xóa bộ lọc
                        </button>

                        <button
                            className="btn btn-danger"
                            onClick={()=>setShowFilter(false)}
                        >
                            Áp dụng
                        </button>

                     </div>

                  </div>

                </div>

                )}

                <div className="search-toolbar">

                    <div className="input-group">

                        <input
                            className="form-control"
                            placeholder="Tìm sản phẩm..."
                        />

                        <button className="btn btn-dark">

                            <FontAwesomeIcon icon={["fas","search"]}/>

                        </button>

                    </div>

                    <button
                        className="btn btn-outline-dark ms-3"
                        onClick={changeViewType}
                    >

                        <FontAwesomeIcon
                            icon={["fas",viewType.grid ? "th-list":"th-large"]}
                        />

                    </button>

                </div>
            <div
              className={
                "row row-cols-1 row-cols-md-2 row-cols-lg-2 g-3 mb-4 flex-shrink-0 " +
                (viewType.grid ? "row-cols-xl-3" : "row-cols-xl-2")
              }
            >
              {loading && <div className="col-12 py-5 text-center">Đang tải sản phẩm từ database...</div>}
              {error && <div className="col-12 alert alert-danger">{error}</div>}
              {!loading && !error && visibleProducts.map((product) => {
                if (viewType.grid) {
                  return (
                    <Product
                      key={product.name}
                      product={product}
                      percentOff={product.percentOff}
                    />
                  );
                }

                return (
                  <ProductH
                    key={product.name}
                    product={product}
                    percentOff={product.percentOff}
                  />
                );
              })}
            </div>

            <div className="d-flex align-items-center mt-auto">
              <span className="text-muted small d-none d-md-inline">
                Hiển thị {visibleProducts.length} sản phẩm
              </span>

              <nav aria-label="Page navigation example" className="ms-auto">
                <ul className="pagination my-0">
                  <li className="page-item">
                    <a className="page-link" href="#!">
                      Trước
                    </a>
                  </li>

                  <li className="page-item">
                    <a className="page-link" href="#!">
                      1
                    </a>
                  </li>

                  <li className="page-item active">
                    <a className="page-link" href="#!">
                      2
                    </a>
                  </li>

                  <li className="page-item">
                    <a className="page-link" href="#!">
                      3
                    </a>
                  </li>

                  <li className="page-item">
                    <a className="page-link" href="#!">
                      Tiếp
                    </a>
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
