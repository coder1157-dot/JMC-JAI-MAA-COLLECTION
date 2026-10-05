export default function PriceOnEnquiry({ text = "Enquire for price", large = false }) {
  return <div className={`price-enquiry ${large ? "large" : ""}`}>{text}</div>;
}
