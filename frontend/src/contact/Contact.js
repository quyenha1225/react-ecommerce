import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./contact.css";

const contacts=[
  {icon:["fas","map-marker-alt"],label:"Cửa hàng",value:"123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",href:"https://maps.google.com"},
  {icon:["fas","phone-alt"],label:"Hotline",value:"0123 456 789",href:"tel:0123456789"},
  {icon:["fas","envelope"],label:"Email",value:"support@electroshop.vn",href:"mailto:support@electroshop.vn"},
];
const socials=[
  {icon:["fas","comment-dots"],name:"Zalo",note:"Tư vấn sản phẩm nhanh",href:"https://zalo.me/0123456789",tone:"zalo"},
  {icon:["fab","facebook-f"],name:"Facebook",note:"Tin mới và ưu đãi",href:"https://facebook.com",tone:"facebook"},
  {icon:["fab","github"],name:"GitHub",note:"Theo dõi dự án",href:"https://github.com",tone:"github"},
];

export default function Contact(){return <main className="contact-page"><section className="contact-hero"><div className="container"><span>TRUNG TÂM HỖ TRỢ</span><h1>Chúng tôi luôn sẵn sàng<br/><b>đồng hành cùng bạn.</b></h1><p>Liên hệ với ElectroShop để được tư vấn sản phẩm, kiểm tra đơn hàng, bảo hành hoặc hỗ trợ kỹ thuật.</p></div></section><section className="contact-content"><div className="container"><div className="contact-primary-grid">{contacts.map(item=><a href={item.href} target="_blank" rel="noreferrer" className="contact-method" key={item.label}><i><FontAwesomeIcon icon={item.icon}/></i><span>{item.label}</span><strong>{item.value}</strong><small>Xem chi tiết →</small></a>)}</div><div className="contact-social-panel"><div><span className="contact-eyebrow">HỖ TRỢ TRỰC TUYẾN</span><h2>Kết nối với ElectroShop</h2><p>Chọn kênh phù hợp để trò chuyện trực tiếp với đội ngũ hỗ trợ.</p></div><div className="contact-socials">{socials.map(item=><a className={`contact-social ${item.tone}`} href={item.href} target="_blank" rel="noreferrer" key={item.name}><i><FontAwesomeIcon icon={item.icon}/></i><span><strong>{item.name}</strong><small>{item.note}</small></span><b>↗</b></a>)}</div></div><div className="contact-hours"><div><FontAwesomeIcon icon={["far","clock"]}/><span><b>Thứ 2 – Chủ nhật</b><small>08:00 – 21:30</small></span></div><p>Hotline và Zalo phản hồi trong giờ làm việc. Email được xử lý trong vòng 24 giờ.</p></div></div></section></main>}
