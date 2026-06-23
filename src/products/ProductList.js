import { Link, useParams } from "react-router-dom";
import Product from "./Product";
import ProductH from "./ProductH";
import { useState } from "react";
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
  const { categoryName } = useParams();

  const currentCategory = categories.find((item) => item.slug === categoryName);

  function changeViewType() {
    setViewType({
      grid: !viewType.grid,
    });
  }

  return (
    <div className="container product-page py-4 px-xl-5">
      <ScrollToTopOnMount />

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

      <div className="row mb-4 mt-lg-3">
        <div className="d-none d-lg-block col-lg-3">
          <div className="border rounded shadow-sm bg-white">
            <FilterMenuLeft />
          </div>
        </div>

        <div className="col-lg-9">
          <div className="d-flex flex-column h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="fw-bold mb-1">
                  {currentCategory ? currentCategory.name : "Tất cả sản phẩm"}
                </h3>
                <p className="text-muted mb-0">
                  Tìm kiếm và lựa chọn sản phẩm điện tử phù hợp với nhu cầu.
                </p>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-lg-3 d-none d-lg-block">
                <select className="form-select" defaultValue="">
                  <option value="">Tất cả mẫu</option>
                  <option value="1">iPhone</option>
                  <option value="2">Samsung Galaxy</option>
                  <option value="3">Laptop Gaming</option>
                </select>
              </div>

              <div className="col-lg-9 col-xl-5 offset-xl-4 d-flex flex-row">
                <div className="input-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Tìm sản phẩm..."
                    aria-label="search input"
                  />

                  <button className="btn btn-outline-dark">
                    <FontAwesomeIcon icon={["fas", "search"]} />
                  </button>
                </div>

                <button
                  className="btn btn-outline-dark ms-2 d-none d-lg-inline"
                  onClick={changeViewType}
                >
                  <FontAwesomeIcon
                    icon={["fas", viewType.grid ? "th-list" : "th-large"]}
                  />
                </button>
              </div>
            </div>

            <div
              className={
                "row row-cols-1 row-cols-md-2 row-cols-lg-2 g-3 mb-4 flex-shrink-0 " +
                (viewType.grid ? "row-cols-xl-3" : "row-cols-xl-2")
              }
            >
              {Array.from({ length: 10 }, (_, i) => {
                if (viewType.grid) {
                  return (
                    <Product key={i} percentOff={i % 2 === 0 ? 15 : null} />
                  );
                }

                return (
                  <ProductH key={i} percentOff={i % 4 === 0 ? 15 : null} />
                );
              })}
            </div>

            <div className="d-flex align-items-center mt-auto">
              <span className="text-muted small d-none d-md-inline">
                Hiển thị 10 trên 100 sản phẩm
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