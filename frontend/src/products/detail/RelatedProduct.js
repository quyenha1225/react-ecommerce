import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function RelatedProduct({ product }) {
  if (!product) return null;
  return <Link to={`/products/${product.slug || product.id}`} className="pd-related-card">
    <div><img src={product.image_url} alt={product.name} loading="lazy"/><span>Xem nhanh</span></div>
    <small>Sản phẩm chính hãng</small>
    <h3>{product.name}</h3>
    <strong>{Number(product.price || 0).toLocaleString("vi-VN")} ₫</strong>
    <p><FontAwesomeIcon icon={["fas","truck"]}/> Giao hàng toàn quốc</p>
  </Link>;
}
