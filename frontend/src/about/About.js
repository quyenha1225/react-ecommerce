import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ShoppingImage from "../landing/banner-0.jpg";
import PaymentImage from "../landing/banner-1.jpg";
import SupportImage from "../landing/banner-2.jpg";
import ScrollToTopOnMount from "../template/ScrollToTopOnMount";
import "./about-modern.css";

const values = [
  { number: "30+", label: "Sản phẩm chính hãng" },
  { number: "8", label: "Đối tác phân phối" },
  { number: "24/7", label: "Hỗ trợ khách hàng" },
  { number: "100%", label: "Thông tin minh bạch" },
];

const features = [
  { icon: "shopping-bag", eyebrow: "Trải nghiệm", title: "Mua sắm đơn giản", text: "Tìm kiếm thông minh, danh mục rõ ràng và dữ liệu tồn kho được cập nhật để bạn chọn nhanh hơn.", image: ShoppingImage },
  { icon: "shield-alt", eyebrow: "An tâm", title: "Thanh toán minh bạch", text: "Quy trình rõ ràng, nhiều phương thức thanh toán và lịch sử đơn hàng dễ dàng theo dõi.", image: PaymentImage },
  { icon: "headset", eyebrow: "Đồng hành", title: "Hỗ trợ đúng lúc", text: "Đội ngũ ElectroShop sẵn sàng tư vấn sản phẩm phù hợp trước, trong và sau khi mua.", image: SupportImage },
];

export default function About() {
  return <main className="modern-about"><ScrollToTopOnMount/>
    <section className="modern-about-hero">
      <div className="about-grid-bg" aria-hidden="true"/>
      <div className="container modern-about-layout">
        <div className="modern-about-copy">
          <span className="modern-about-label"><i/> VỀ ELECTROSHOP</span>
          <h1>Công nghệ tốt hơn.<br/><em>Trải nghiệm gần hơn.</em></h1>
          <p>Chúng tôi xây dựng một không gian mua sắm công nghệ hiện đại, nơi sản phẩm, giá bán và tồn kho đều rõ ràng trong từng lựa chọn.</p>
          <div className="modern-about-actions"><Link to="/products">Khám phá sản phẩm <FontAwesomeIcon icon={["fas","arrow-right"]}/></Link><Link to="/contact" className="secondary">Liên hệ với chúng tôi</Link></div>
          <div className="about-trust"><span><FontAwesomeIcon icon={["fas","check-circle"]}/> Hàng chính hãng</span><span><FontAwesomeIcon icon={["fas","check-circle"]}/> Bảo hành rõ ràng</span></div>
        </div>
        <div className="about-square-stage" aria-label="Không gian công nghệ ElectroShop">
          <div className="about-square-glow"/>
          <div className="about-square about-square-main"><img src={ShoppingImage} alt="Không gian mua sắm ElectroShop"/><span>EXPLORE<br/><b>TECH</b></span></div>
          <div className="about-square about-square-back"/>
          <div className="about-square about-square-small one"><FontAwesomeIcon icon={["fas","microchip"]}/></div>
          <div className="about-square about-square-small two"><FontAwesomeIcon icon={["fas","mobile-alt"]}/></div>
          <div className="about-square about-square-small three"><FontAwesomeIcon icon={["fas","laptop"]}/></div>
          <div className="about-orbit orbit-one"/><div className="about-orbit orbit-two"/>
        </div>
      </div>
    </section>

    <section className="about-values"><div className="container about-values-grid">{values.map((item,index)=><article key={item.label} style={{"--value-delay":`${index*80}ms`}}><strong>{item.number}</strong><span>{item.label}</span></article>)}</div></section>

    <section className="modern-about-story"><div className="container"><div className="about-section-heading"><span>CÁCH CHÚNG TÔI TẠO KHÁC BIỆT</span><h2>Mọi chi tiết đều hướng đến<br/>một trải nghiệm dễ dàng.</h2></div><div className="modern-feature-list">{features.map((item,index)=><article className={`modern-feature ${index%2?"reverse":""}`} key={item.title}><div className="modern-feature-image"><img src={item.image} alt={item.title}/><span>0{index+1}</span></div><div className="modern-feature-copy"><i><FontAwesomeIcon icon={["fas",item.icon]}/></i><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.text}</p><Link to={index===2?"/contact":"/products"}>Tìm hiểu thêm <FontAwesomeIcon icon={["fas","arrow-right"]}/></Link></div></article>)}</div></div></section>

    <section className="modern-about-cta"><div className="about-cta-square one"/><div className="about-cta-square two"/><div className="container"><span>SẴN SÀNG KHÁM PHÁ?</span><h2>Tìm thiết bị phù hợp<br/>với bạn ngay hôm nay.</h2><Link to="/products">Xem tất cả sản phẩm <FontAwesomeIcon icon={["fas","arrow-right"]}/></Link></div></section>
  </main>;
}
