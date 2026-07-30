import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../auth/AuthContext";

function SePayQRModal({ show, orderData, onClose, onSuccess }) {
  const [loading,setLoading]=useState(false), [error,setError]=useState("");
  const { api }=useAuth();
  if(!show||!orderData)return null;
  const bank={name:"MBBank (MB)",account:"0385416387",owner:"ELECTROSHOP",amount:Number(orderData.totalAmount||orderData.amount||orderData.total||0),code:orderData.orderCode||orderData.code};
  const qr=`https://qr.sepay.vn/img?bank=MBBank&acc=${bank.account}&template=compact&amount=${bank.amount}&des=${encodeURIComponent(bank.code)}`;
  const confirm=async()=>{setLoading(true);setError("");try{const paid=await api(`/orders/${orderData.id||orderData.orderId}/payment-confirm`,{method:"PATCH"});localStorage.setItem("payment-method","sepay");onSuccess(paid)}catch(e){setError(e.message)}finally{setLoading(false)}};
  return <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor:"rgba(0,0,0,.65)",zIndex:1055}}><div className="modal-dialog modal-dialog-centered"><div className="modal-content text-center p-3 rounded-4 shadow">
    <div className="modal-header border-0 pb-0"><h5 className="modal-title fw-bold text-primary"><FontAwesomeIcon icon={["fas","qrcode"]} className="me-2"/>Thanh toán chuyển khoản VietQR</h5><button type="button" className="btn-close" onClick={onClose}/></div>
    <div className="modal-body"><p className="text-muted small mb-2">Quét mã bằng ứng dụng ngân hàng và giữ nguyên nội dung chuyển khoản.</p><div className="my-2 p-2 bg-light rounded-3 d-inline-block border"><img src={qr} alt="Mã QR thanh toán" className="img-fluid rounded" style={{maxHeight:260}}/></div>
      <div className="bg-light p-3 rounded-3 text-start small mt-2">{[["Ngân hàng",bank.name],["Số tài khoản",bank.account],["Chủ tài khoản",bank.owner]].map(([k,v])=><div className="d-flex justify-content-between mb-1" key={k}><span className="text-muted">{k}:</span><b>{v}</b></div>)}<div className="d-flex justify-content-between mb-1"><span className="text-muted">Số tiền:</span><b className="text-danger">{bank.amount.toLocaleString("vi-VN")} đ</b></div><div className="d-flex justify-content-between"><span className="text-muted">Nội dung CK:</span><span className="badge bg-warning text-dark fs-6">{bank.code}</span></div></div>
    </div><div className="modal-footer border-0 pt-0">{error&&<div className="alert alert-danger w-100">{error}</div>}<button className="btn btn-success w-100 fw-bold" onClick={confirm} disabled={loading}><FontAwesomeIcon icon={["fas","check-circle"]} className="me-2"/>{loading?"Đang xác nhận...":"Tôi đã chuyển khoản"}</button><button className="btn btn-outline-secondary w-100" onClick={onClose}>Đóng / Thanh toán sau</button></div>
  </div></div></div>;
}
export default SePayQRModal;
