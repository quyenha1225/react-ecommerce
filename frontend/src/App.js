import Template from "./template/Template";
import ProductDetail from "./products/detail/ProductDetail";
import { Routes, Route } from "react-router-dom";
import Landing from "./landing/Landing";
import ProductList from "./products/ProductList";
import Login from "./login/Login";
import Cart from "./cart/Cart";
import About from "./about/About";
import AdminDashboard from "./admin/AdminDashboard";
import Contact from "./contact/Contact";
import SearchResults from "./search/SearchResults";

function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/guest" element={<Template guestMode><Landing /></Template>} />
      <Route path="*" element={<Template><Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/products" element={<ProductList />} />
        <Route path="/search" element={<SearchResults />} />

        <Route
          path="/category/:categoryName"
          element={<ProductList />}
        />

        <Route
          path="/products/:slug"
          element={<ProductDetail />}
        />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route
          path="*"
          element={
            <div className="container mt-5 text-center">
              <h1 className="text-danger">
                404 - Không tìm thấy trang
              </h1>
              <p>Vui lòng quay lại trang chủ.</p>
            </div>
          }
        />
      </Routes></Template>} />
    </Routes>
  );
}

export default App;
