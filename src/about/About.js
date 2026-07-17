import { Link } from "react-router-dom";

function About() {
  return (
    <div className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <div className="container">

          <span className="about-tag">
            Về E-Shop
          </span>

          <h1>
            Đơn giản.<br />
            Hiện đại.<br />
            Đáng tin cậy.
          </h1>

          <p>
            E-Shop mang đến trải nghiệm mua sắm công nghệ
            nhanh chóng, trực quan và an toàn cho mọi khách hàng.
          </p>

          <Link className="about-button" to="/products">
            Khám phá sản phẩm
          </Link>

        </div>
      </section>

      {/* CARD 1 */}

      <section className="about-wrapper">

        <div className="container">

          <div className="about-card">

            <div className="about-image">

              <img
                src="/images/about/shopping.jpg"
                alt="Shopping"
              />

            </div>

            <div className="about-content">

              <span>Mua sắm</span>

              <h2>
                Mua sắm dễ dàng.
              </h2>

              <p>
                Với giao diện trực quan và thân thiện,
                E-Shop giúp bạn tìm kiếm, so sánh và lựa
                chọn sản phẩm chỉ trong vài thao tác.
              </p>

            </div>

          </div>
                    {/* CARD 2 */}

          <div className="about-card reverse">

            <div className="about-content">

              <span>Thanh toán</span>

              <h2>
                Thanh toán an toàn.
              </h2>

              <p>
                Hỗ trợ nhiều phương thức thanh toán với quy trình
                bảo mật và nhanh chóng, giúp bạn yên tâm trong
                mọi giao dịch.
              </p>

            </div>

            <div className="about-image">

              <img
                src="/images/about/payment.jpg"
                alt="Payment"
              />

            </div>

          </div>


          {/* CARD 3 */}

          <div className="about-card">

            <div className="about-image">

              <img
                src="/images/about/support.jpg"
                alt="Support"
              />

            </div>

            <div className="about-content">

              <span>Hỗ trợ</span>

              <h2>
                Luôn sẵn sàng đồng hành.
              </h2>

              <p>
                Đội ngũ chăm sóc khách hàng của E-Shop luôn
                sẵn sàng hỗ trợ, giải đáp mọi thắc mắc và
                mang đến trải nghiệm mua sắm tốt nhất.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* CONTACT */}

      <section className="about-contact">

        <div className="container">

          <h2>Liên hệ</h2>

          <div className="contact-grid">

            <div className="contact-item">

              <h4>Địa chỉ</h4>

              <p>
                Hà Nội, Việt Nam
              </p>

            </div>

            <div className="contact-item">

              <h4>Điện thoại</h4>

              <p>
                0123 456 789
              </p>

            </div>

            <div className="contact-item">

              <h4>Email</h4>

              <p>
                support@eshop.vn
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default About;