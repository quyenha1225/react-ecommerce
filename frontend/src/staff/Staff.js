import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Staff() {
    // =============================
    // Navigation
    // =============================

    const [tab, setTab] = useState("dashboard");

    // =============================
    // Current User
    // Sau này lấy từ API
    // =============================

    const currentUser = {
        fullName: "",
        role: "",
        avatar: "",
    };

    // =============================
    // Dashboard Data
    // Sau này lấy từ API
    // =============================

    const dashboardCards = [
        {
            title: "Đơn hôm nay",
            value: "--",
            percent: "+0%",
            icon: "receipt",
            color: "#2563eb",
        },
        {
            title: "Doanh thu",
            value: "--",
            percent: "+0%",
            icon: "sack-dollar",
            color: "#22c55e",
        },
        {
            title: "Khách hàng",
            value: "--",
            percent: "+0%",
            icon: "users",
            color: "#f59e0b",
        },
        {
            title: "Sắp hết kho",
            value: "--",
            percent: "+0%",
            icon: "triangle-exclamation",
            color: "#ef4444",
        },
    ];
    const recentOrders = [
        {},
        {},
        {},
        {},
        {},
    ];

    const lowStockProducts = [
        {},
        {},
        {},
        {},
    ];

    const recentActivities = [
        {},
        {},
        {},
        {},
    ];
    const orders = Array.from(
        { length: 10 },
        (_, index) => ({

            id: index + 1

        })
    );
    const products = Array.from(
        { length: 12 },
        (_, index) => ({
            id: index + 1,
        })
    );
    return (
        <div className="staff-page">

            {/* ================= SIDEBAR ================= */}

            <aside className="staff-sidebar">

                <div className="staff-sidebar-logo">

                    <h2>ElectroShop</h2>

                    <span>STAFF PANEL</span>

                </div>

                <div className="staff-sidebar-menu">

                    <button
                        className={tab === "dashboard" ? "active" : ""}
                        onClick={() => setTab("dashboard")}
                    >
                        <FontAwesomeIcon icon={["fas", "table-columns"]} />
                        <span>Dashboard</span>
                    </button>

                    <button
                        className={tab === "orders" ? "active" : ""}
                        onClick={() => setTab("orders")}
                    >
                        <FontAwesomeIcon icon={["fas", "receipt"]} />
                        <span>Đơn hàng</span>
                    </button>

                    <button
                        className={tab === "products" ? "active" : ""}
                        onClick={() => setTab("products")}
                    >
                        <FontAwesomeIcon icon={["fas", "box-open"]} />
                        <span>Sản phẩm</span>
                    </button>

                    <button
                        className={tab === "customers" ? "active" : ""}
                        onClick={() => setTab("customers")}
                    >
                        <FontAwesomeIcon icon={["fas", "users"]} />
                        <span>Khách hàng</span>
                    </button>

                    <button
                        className={tab === "reports" ? "active" : ""}
                        onClick={() => setTab("reports")}
                    >
                        <FontAwesomeIcon icon={["fas", "chart-line"]} />
                        <span>Thống kê</span>
                    </button>

                </div>

                <div className="staff-sidebar-footer">

                    <button
                        onClick={() => setTab("profile")}
                    >
                        <FontAwesomeIcon icon={["fas", "user"]} />
                        <span>Tài khoản</span>
                    </button>

                    <button>

                        <FontAwesomeIcon
                            icon={["fas", "right-from-bracket"]}
                        />

                        <span>Đăng xuất</span>

                    </button>

                </div>

            </aside>

            {/* ================= MAIN ================= */}

            <section className="staff-main">

                {/* HEADER */}

                <header className="staff-header">

                    <div className="staff-search">

                        <FontAwesomeIcon
                            icon={["fas", "magnifying-glass"]}
                        />

                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                        />

                    </div>

                    <div className="staff-header-right">

                        <button>

                            <FontAwesomeIcon
                                icon={["fas", "bell"]}
                            />

                        </button>

                        <button>

                            <FontAwesomeIcon
                                icon={["fas", "gear"]}
                            />

                        </button>

                        <div className="staff-user">

                            <div className="staff-avatar">

                                {currentUser.avatar ? (
                                    <img
                                        src={currentUser.avatar}
                                        alt=""
                                    />
                                ) : (
                                    <FontAwesomeIcon
                                        icon={["fas", "user"]}
                                    />
                                )}

                            </div>

                            <div>

                                <strong>

                                    {currentUser.fullName || "Đang đăng nhập..."}

                                </strong>

                                <small>

                                    {currentUser.role || ""}

                                </small>

                            </div>

                        </div>

                    </div>

                </header>

                {/* CONTENT */}

                <main className="staff-content">

                    {tab === "dashboard" && (

                        <div className="staff-dashboard">

                            {/* Header */}

                            <div className="staff-dashboard-header">

                                <div>

                                    <h1 className="staff-dashboard-title">

                                        Tổng quan hệ thống

                                    </h1>

                                    <p className="staff-dashboard-subtitle">

                                        Chào mừng đến trang quản lý ElectroShop.

                                    </p>

                                </div>

                                <div className="staff-dashboard-actions">

                                    <button className="staff-btn-secondary">

                                        <FontAwesomeIcon
                                            icon={["fas", "calendar-days"]}
                                        />

                                        Hôm nay

                                    </button>

                                    <button className="staff-btn-primary">

                                        <FontAwesomeIcon
                                            icon={["fas", "download"]}
                                        />

                                        Xuất báo cáo

                                    </button>

                                </div>

                            </div>
                            <div className="staff-welcome">

                                <div>

                                    <h2>

                                        Xin chào 👋

                                    </h2>

                                    <p>

                                        Chúc bạn có một ngày làm việc hiệu quả.

                                    </p>

                                </div>

                            </div>

                            {/* Cards */}

                            <div className="staff-dashboard-cards">

                                {dashboardCards.map((card) => (

                                    <div
                                        key={card.title}
                                        className="staff-card"
                                    >

                                        <div className="staff-card-top">

                                            <div
                                                className="staff-card-icon"
                                                style={{
                                                    background: card.color,
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={[
                                                        "fas",
                                                        card.icon,
                                                    ]}
                                                />
                                            </div>

                                            <span className="staff-card-percent">

                                                {card.percent}

                                            </span>

                                        </div>

                                        <div className="staff-card-body">

                                            <p>

                                                {card.title}

                                            </p>

                                            <h2>

                                                {card.value}

                                            </h2>

                                        </div>

                                    </div>

                                ))}

                            </div>

                            {/* Bottom */}

                            <div className="staff-dashboard-bottom">

                                <div className="staff-orders-panel">

                                    <div className="staff-panel-header">

                                        <h3>

                                            Đơn hàng mới

                                        </h3>

                                        <button>

                                            Xem tất cả

                                        </button>

                                    </div>

                                    <table className="staff-table">

                                        <thead>

                                            <tr>

                                                <th>Mã đơn</th>

                                                <th>Khách hàng</th>

                                                <th>Tổng tiền</th>

                                                <th>Trạng thái</th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {recentOrders.map((item, index) => (

                                                <tr key={index}>

                                                    <td>DH00{index + 1}</td>

                                                    <td>────────────</td>

                                                    <td>────────</td>

                                                    <td>

                                                        <span className="staff-status">

                                                            Chờ xử lý

                                                        </span>

                                                    </td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                                <div className="staff-stock-panel">

                                    <div className="staff-panel-header">

                                        <h3>

                                            Sắp hết kho

                                        </h3>

                                    </div>

                                    <div className="staff-stock-list">

                                        {lowStockProducts.map((item, index) => (

                                            <div
                                                key={index}
                                                className="staff-stock-item"
                                            >

                                                <div>

                                                    <strong>

                                                        Sản phẩm

                                                    </strong>

                                                    <p>

                                                        Danh mục

                                                    </p>

                                                </div>

                                                <span>

                                                    --

                                                </span>

                                            </div>

                                        ))}

                                    </div>

                                </div>

                            </div>
                            <div className="staff-activity-panel">

                                <div className="staff-panel-header">

                                    <h3>

                                        Hoạt động gần đây

                                    </h3>

                                </div>

                                <div className="staff-activity-list">

                                    {recentActivities.map((item, index) => (

                                        <div
                                            key={index}
                                            className="staff-activity-item"
                                        >

                                            <div className="staff-activity-dot">

                                            </div>

                                            <div>

                                                <strong>

                                                    Hoạt động

                                                </strong>

                                                <p>

                                                    ----------

                                                </p>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </div>
                            <div className="staff-chart-panel">

                                <div className="staff-panel-header">

                                    <h3>

                                        Doanh thu theo tháng

                                    </h3>

                                    <button>

                                        Xem chi tiết

                                    </button>

                                </div>

                                <div className="staff-chart">

                                    <div className="chart-placeholder">

                                        <FontAwesomeIcon
                                            icon={["fas", "chart-line"]}
                                        />

                                        <p>

                                            Chart sẽ được kết nối sau

                                        </p>

                                    </div>

                                </div>
                                <div className="staff-action-panel">

                                    <div className="staff-panel-header">

                                        <h3>

                                            Thao tác nhanh

                                        </h3>

                                    </div>

                                    <div className="staff-actions">

                                        <button>

                                            <FontAwesomeIcon
                                                icon={["fas", "plus"]}
                                            />

                                            Thêm sản phẩm

                                        </button>

                                        <button>

                                            <FontAwesomeIcon
                                                icon={["fas", "cart-plus"]}
                                            />

                                            Tạo đơn hàng

                                        </button>

                                        <button>

                                            <FontAwesomeIcon
                                                icon={["fas", "user-plus"]}
                                            />

                                            Thêm khách hàng

                                        </button>

                                        <button>

                                            <FontAwesomeIcon
                                                icon={["fas", "download"]}
                                            />

                                            Xuất Excel

                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>


                    )}

                    {tab === "orders" && (

                        <div className="staff-orders-page">

                            <div className="staff-page-header">

                                <div>

                                    <h1>

                                        Đơn hàng

                                    </h1>

                                    <p>

                                        Quản lý đơn hàng trong hệ thống.

                                    </p>

                                </div>

                                <button className="staff-btn-primary">

                                    <FontAwesomeIcon
                                        icon={["fas", "plus"]}
                                    />

                                    Tạo đơn

                                </button>

                            </div>

                            <div className="staff-toolbar">

                                <input
                                    placeholder="Tìm đơn hàng..."
                                />

                                <select>

                                    <option>

                                        Trạng thái

                                    </option>

                                </select>

                                <select>

                                    <option>

                                        Thanh toán

                                    </option>

                                </select>

                                <input
                                    type="date"
                                />

                                <button>

                                    Xuất Excel

                                </button>

                            </div>

                            <div className="staff-table-wrapper">

                                <table className="staff-table">

                                    <thead>

                                        <tr>

                                            <th>Mã</th>

                                            <th>Khách hàng</th>

                                            <th>Ngày</th>

                                            <th>Tổng tiền</th>

                                            <th>Thanh toán</th>

                                            <th>Trạng thái</th>

                                            <th></th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {orders.map((item) => (

                                            <tr key={item.id}>

                                                <td>

                                                    DH00{item.id}

                                                </td>

                                                <td>

                                                    -----------------

                                                </td>

                                                <td>

                                                    --/--/----

                                                </td>

                                                <td>

                                                    ----------

                                                </td>

                                                <td>

                                                    Đã thanh toán

                                                </td>

                                                <td>

                                                    <span
                                                        className="staff-status"
                                                    >

                                                        Hoàn thành

                                                    </span>

                                                </td>

                                                <td>

                                                    <button>

                                                        <FontAwesomeIcon
                                                            icon={[
                                                                "fas",
                                                                "ellipsis"
                                                            ]}
                                                        />

                                                    </button>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                            <div className="staff-pagination">

                                <button>

                                    ←

                                </button>

                                <button className="active">

                                    1

                                </button>

                                <button>

                                    2

                                </button>

                                <button>

                                    →

                                </button>

                            </div>

                        </div>

                    )}

                    {tab === "products" && (

                        <div className="staff-products-page">

                            <div className="staff-page-header">

                                <div>

                                    <h1>

                                        Sản phẩm

                                    </h1>

                                    <p>

                                        Quản lý sản phẩm trong cửa hàng.

                                    </p>

                                </div>

                                <button className="staff-btn-primary">

                                    <FontAwesomeIcon
                                        icon={["fas", "plus"]}
                                    />

                                    Thêm sản phẩm

                                </button>

                            </div>

                            <div className="staff-toolbar">

                                <input
                                    placeholder="Tìm sản phẩm..."
                                />

                                <select>

                                    <option>

                                        Danh mục

                                    </option>

                                </select>

                                <select>

                                    <option>

                                        Thương hiệu

                                    </option>

                                </select>

                                <button>

                                    Nhập Excel

                                </button>

                                <button>

                                    Xuất Excel

                                </button>

                            </div>

                            <div className="staff-table-wrapper">

                                <table className="staff-table">

                                    <thead>

                                        <tr>

                                            <th>ID</th>

                                            <th>Ảnh</th>

                                            <th>Tên sản phẩm</th>

                                            <th>Danh mục</th>

                                            <th>Giá</th>

                                            <th>Tồn kho</th>

                                            <th>Thao tác</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {products.map((item) => (

                                            <tr key={item.id}>

                                                <td>

                                                    SP{item.id}

                                                </td>

                                                <td>

                                                    <div className="staff-product-image">

                                                    </div>

                                                </td>

                                                <td>

                                                    ------------------------

                                                </td>

                                                <td>

                                                    ------------

                                                </td>

                                                <td>

                                                    ----------

                                                </td>

                                                <td>

                                                    --

                                                </td>

                                                <td>

                                                    <div className="staff-action-buttons">

                                                        <button>

                                                            <FontAwesomeIcon
                                                                icon={["fas", "pen"]}
                                                            />

                                                        </button>

                                                        <button>

                                                            <FontAwesomeIcon
                                                                icon={["fas", "trash"]}
                                                            />

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                            <div className="staff-pagination">

                                <button>

                                    ←

                                </button>

                                <button className="active">

                                    1

                                </button>

                                <button>

                                    2

                                </button>

                                <button>

                                    →

                                </button>

                            </div>

                        </div>

                    )}

                    {tab === "customers" && (
                        <h1>Khách hàng</h1>
                    )}

                    {tab === "reports" && (
                        <h1>Thống kê</h1>
                    )}

                    {tab === "profile" && (
                        <h1>Tài khoản</h1>
                    )}

                </main>

            </section>

        </div>
    );
}

export default Staff;