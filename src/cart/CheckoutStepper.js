import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function CheckoutStepper({ step }) {
  const steps = [
    {
      number: 1,
      title: "Giỏ hàng",
      icon: "shopping-cart",
    },
    {
      number: 2,
      title: "Thông tin",
      icon: "user",
    },
    {
      number: 3,
      title: "Thanh toán",
      icon: "credit-card",
    },
    {
      number: 4,
      title: "Hoàn tất",
      icon: "check",
    },
  ];

  return (
    <div className="checkout-stepper">
      {steps.map((item, index) => (
        <div
          key={item.number}
          className={`checkout-step ${
            step === item.number
              ? "active"
              : step > item.number
              ? "done"
              : ""
          }`}
        >
          <div className="step-circle">
            {step > item.number ? (
              <FontAwesomeIcon icon={["fas", "check"]} />
            ) : (
              <FontAwesomeIcon icon={["fas", item.icon]} />
            )}
          </div>

          <span>{item.title}</span>

          {index < steps.length - 1 && (
            <div className="step-line"></div>
          )}
        </div>
      ))}
    </div>
  );
}

export default CheckoutStepper;