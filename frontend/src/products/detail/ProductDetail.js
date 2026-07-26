import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ScrollToTopOnMount from "../../template/ScrollToTopOnMount";
import { addToCart } from "../../utils/cartStorage";
import RelatedProduct from "./RelatedProduct";
import { useAuth } from "../../auth/AuthContext";
import "./product-detail.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
const money = value => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value));
  return <span className="pd-stars" aria-label={`${value} trên 5 sao`}>{[1,2,3,4,5].map(star => <FontAwesomeIcon key={star} icon={["fas","star"]} className={star <= rounded ? "filled" : ""}/>)}</span>;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const isManagementUser = ["ADMIN", "STAFF"].includes(session?.user?.role);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch(`${API}/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Không tìm thấy sản phẩm");
        return response.json();
      })
      .then(async data => {
        setProduct(data);
        const defaultVariant = data.variants?.find(item => Number(item.is_default)) || data.variants?.[0] || null;
        setSelectedVariant(defaultVariant);
        setActiveImage(data.images?.[0]?.image_url || data.image_url || "");
        const response = await fetch(`${API}/products/recommend/${data.id}`, { signal: controller.signal });
        if (response.ok) setRelated(await response.json());
      })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug]);

  const currentPrice = Number(product?.price || 0) + Number(selectedVariant?.additional_price || 0);
  const availableStock = selectedVariant ? Number(selectedVariant.available_quantity ?? selectedVariant.stock_quantity ?? 0) : Number(product?.stock_quantity || 0);
  const images = useMemo(() => {
    if (!product) return [];
    const list = (product.images || []).map(item => item.image_url).filter(Boolean);
    if (product.image_url && !list.includes(product.image_url)) list.unshift(product.image_url);
    return list;
  }, [product]);
  const specGroups = useMemo(() => (product?.specifications || []).reduce((groups, item) => {
    const name = item.spec_group || "Thông tin khác";
    (groups[name] ||= []).push(item);
    return groups;
  }, {}), [product]);

  const add = (buyNow = false) => {
    if (!product || availableStock <= 0 || isManagementUser) return;
    addToCart({
      id: product.id, productId: product.id, variantId: selectedVariant?.variant_id,
      name: product.name, brand: product.brand, price: currentPrice,
      quantity: Math.min(quantity, availableStock), image: activeImage || product.image_url,
      variantName: selectedVariant?.variant_name,
    });
    setAdded(true); setTimeout(() => setAdded(false), 1400);
    if (buyNow) navigate("/cart");
  };

  if (loading) return <div className="pd-loading"><span/><p>Đang tải thông tin sản phẩm...</p></div>;
  if (error || !product) return <div className="container py-5"><div className="pd-error"><FontAwesomeIcon icon={["fas","exclamation-circle"]}/><h2>Không thể mở sản phẩm</h2><p>{error || "Sản phẩm không tồn tại"}</p><Link to="/products">Quay lại cửa hàng</Link></div></div>;

  return <main className="pd-page">
    <ScrollToTopOnMount/>
    <div className="container pd-container">
      <nav className="pd-breadcrumb" aria-label="breadcrumb">
        <Link to="/">Trang chủ</Link><i>/</i><Link to="/products">Sản phẩm</Link><i>/</i>
        <Link to={`/category/${product.category_slug}`}>{product.category}</Link><i>/</i><span>{product.name}</span>
      </nav>

      <section className="pd-hero">
        <div className="pd-gallery">
          <div className="pd-main-image">
            {activeImage
              ? <img src={activeImage} alt={product.name}/>
              : <FontAwesomeIcon icon={["fas","image"]}/>
            }
            {availableStock > 0 && availableStock <= 5 && <b className="pd-low-badge">Chỉ còn {availableStock}</b>}
          </div>
          {images.length > 1 && <div className="pd-thumbnails">{images.map((url,index) => <button key={`${url}-${index}`} className={activeImage === url ? "active" : ""} onClick={() => setActiveImage(url)}><img src={url} alt={`${product.name} ${index + 1}`}/></button>)}</div>}
          <div className="pd-image-note"><FontAwesomeIcon icon={["fas","search-plus"]}/> Hình ảnh sản phẩm thực tế từ hệ thống</div>
        </div>

        <div className="pd-info">
          <div className="pd-topline"><span>{product.brand || "ElectroShop"}</span><b className={availableStock > 0 ? "in-stock" : "out-stock"}><i/>{availableStock > 0 ? "Còn hàng" : "Hết hàng"}</b></div>
          <h1>{product.name}</h1>
          <div className="pd-rating"><Stars value={product.rating}/><strong>{Number(product.rating || 0).toFixed(1)}</strong><a href="#danh-gia">{product.reviewCount || product.reviews?.length || 0} đánh giá</a><i/><span>Đã bán {Number(product.sold || 0).toLocaleString("vi-VN")}</span></div>
          <div className="pd-price"><strong>{money(currentPrice)}</strong>{Number(product.percent_off) > 0 && <><del>{money(currentPrice / (1 - Number(product.percent_off) / 100))}</del><span>-{product.percent_off}%</span></>}</div>

          {(product.promotions || []).length > 0 && <div className="pd-promotion"><div><FontAwesomeIcon icon={["fas","gift"]}/><b>Ưu đãi đang áp dụng</b></div>{product.promotions.map(item => <p key={item.promotion_code}><FontAwesomeIcon icon={["fas","check-circle"]}/>{item.promotion_name} <small>({item.promotion_code})</small></p>)}</div>}

          {(product.variants || []).length > 0 && <div className="pd-options"><div className="pd-label"><b>Chọn phiên bản</b><span>{selectedVariant?.variant_name}</span></div><div className="pd-variant-grid">{product.variants.map(variant => {
            const stock = Number(variant.available_quantity ?? variant.stock_quantity ?? 0);
            return <button key={variant.variant_id} disabled={stock <= 0} className={selectedVariant?.variant_id === variant.variant_id ? "active" : ""} onClick={() => { setSelectedVariant(variant); setQuantity(1); }}><b>{variant.variant_name || variant.sku}</b><span>{money(Number(product.price) + Number(variant.additional_price || 0))}</span><small>{stock > 0 ? `Còn ${stock}` : "Hết hàng"}</small></button>;
          })}</div></div>}

          <div className="pd-meta"><div><span>Mã sản phẩm</span><b>{product.sku || product.id}</b></div><div><span>Danh mục</span><b>{product.category}</b></div><div><span>Bảo hành</span><b>{product.warrantyMonths || 0} tháng</b></div><div><span>Xuất xứ</span><b>{product.originCountry || "Theo hãng"}</b></div></div>

          {isManagementUser ? <div className="pd-management-notice"><FontAwesomeIcon icon={["fas","shield-alt"]}/><div><b>Tài khoản quản trị không sử dụng chức năng mua hàng</b><span>Vui lòng dùng tài khoản khách hàng để đặt mua sản phẩm.</span></div><Link to="/admin">Về trang quản trị</Link></div> : <div className="pd-purchase"><div className="pd-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><b>{quantity}</b><button onClick={() => setQuantity(Math.min(Math.max(availableStock, 1), quantity + 1))}>+</button></div><button className="pd-cart-btn" disabled={availableStock <= 0} onClick={() => add(false)}><FontAwesomeIcon icon={["fas",added ? "check" : "cart-plus"]}/><span>{added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}</span></button><button className="pd-buy-btn" disabled={availableStock <= 0} onClick={() => add(true)}><FontAwesomeIcon icon={["fas","bolt"]}/><span>Mua ngay</span></button></div>}

          <div className="pd-benefits"><div><FontAwesomeIcon icon={["fas","truck"]}/><span><b>Miễn phí vận chuyển</b><small>Cho đơn hàng đủ điều kiện</small></span></div><div><FontAwesomeIcon icon={["fas","shield-alt"]}/><span><b>Hàng chính hãng</b><small>Bảo hành minh bạch</small></span></div><div><FontAwesomeIcon icon={["fas","undo"]}/><span><b>Đổi trả dễ dàng</b><small>Hỗ trợ tận tâm</small></span></div></div>
        </div>
      </section>

      <section className="pd-content-grid">
        <article className="pd-description-card"><span className="pd-section-tag">GIỚI THIỆU SẢN PHẨM</span><h2>Thông tin chi tiết</h2><p>{product.description || "Sản phẩm chính hãng được phân phối và quản lý trực tiếp bởi ElectroShop."}</p><div className="pd-highlight-grid">{(product.specifications || []).filter(item => Number(item.is_highlight)).slice(0,4).map(item => <div key={item.attribute_id}><small>{item.attribute_name}</small><b>{item.attribute_value} {item.attribute_unit || ""}</b></div>)}</div></article>
        <aside className="pd-support-card"><span className="pd-support-icon"><FontAwesomeIcon icon={["fas","headset"]}/></span><div><span>Cần tư vấn sản phẩm?</span><h3>Đội ngũ ElectroShop luôn sẵn sàng</h3><p>Hỗ trợ lựa chọn cấu hình, bảo hành và phương thức thanh toán phù hợp.</p><Link to="/contact">Liên hệ tư vấn <FontAwesomeIcon icon={["fas","arrow-right"]}/></Link></div></aside>
      </section>

      {Object.keys(specGroups).length > 0 && <section className="pd-specs"><div className="pd-section-head"><div><span className="pd-section-tag">DỮ LIỆU TỪ BACKEND</span><h2>Thông số kỹ thuật đầy đủ</h2></div><p>{product.sku && `SKU: ${product.sku}`}</p></div>{Object.entries(specGroups).map(([group,items]) => <div className="pd-spec-group" key={group}><h3>{group}</h3><dl>{items.map(item => <div key={item.attribute_id}><dt>{item.attribute_name}</dt><dd>{item.attribute_value} {item.attribute_unit || ""}</dd></div>)}</dl></div>)}</section>}

      <section className="pd-reviews" id="danh-gia"><div className="pd-section-head"><div><span className="pd-section-tag">KHÁCH HÀNG ĐÁNH GIÁ</span><h2>Trải nghiệm thực tế</h2></div></div><div className="pd-review-layout"><div className="pd-review-score"><strong>{Number(product.rating || 0).toFixed(1)}</strong><Stars value={product.rating}/><span>{product.reviewCount || product.reviews?.length || 0} đánh giá đã duyệt</span></div><div className="pd-review-list">{product.reviews?.length ? product.reviews.map(review => <article key={review.id}><div className="pd-avatar">{review.userName?.charAt(0)?.toUpperCase() || "K"}</div><div><div><b>{review.userName}</b>{review.isVerifiedPurchase && <span><FontAwesomeIcon icon={["fas","check-circle"]}/> Đã mua hàng</span>}<time>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</time></div><Stars value={review.rating}/>{review.title && <h4>{review.title}</h4>}<p>{review.content || "Khách hàng đã đánh giá sản phẩm."}</p></div></article>) : <div className="pd-no-review"><FontAwesomeIcon icon={["far","comment-dots"]}/><b>Chưa có đánh giá được duyệt</b><p>Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này.</p></div>}</div></div></section>

      {related.length > 0 && <section className="pd-related"><div className="pd-section-head"><div><span className="pd-section-tag">CÓ THỂ BẠN SẼ THÍCH</span><h2>Sản phẩm cùng danh mục</h2></div><Link to={`/category/${product.category_slug}`}>Xem tất cả <FontAwesomeIcon icon={["fas","arrow-right"]}/></Link></div><div className="pd-related-grid">{related.map(item => <RelatedProduct key={item.id} product={item}/>)}</div></section>}
    </div>
  </main>;
}
