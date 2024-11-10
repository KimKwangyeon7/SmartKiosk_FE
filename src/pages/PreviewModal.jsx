// PreviewModal.js
import React from "react";
import "./PreviewModal.css"; // 모달 스타일을 위한 CSS 파일
import qr from "../assets/qr.png";
import logo from "../assets/logo.svg";

const PreviewModal = ({ data, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* 로고 추가 */}
        <img
          src={logo}
          alt="로고"
          className="logo"
          style={{ width: "200px", marginBottom: "10px", filter: "grayscale(100%)" }}
        />

        {/* 오른쪽 상단 'X' 버튼 */}
        <button onClick={onClose} className="close-button">
          &#10006;
        </button>
        <p>
          <strong>호출번호</strong> <h1 style={{ fontSize: "5rem", margin: "0" }}>{data.count}</h1>
        </p>
        <p>
          <strong>상담 종류: {data.workType}</strong>
        </p>
        <p>
          <strong>예상 대기시간: </strong>
          <span className="highlighted-text">{data.expectedTime}</span> 분
        </p>
        <p>
          <strong>대기 인원: </strong>
          <span className="highlighted-text">{data.waitingPeople}</span> 명
        </p>

        <hr className="divider" />
        <div className="preview-text">
          <p>iM뱅크 {data.branchName} 지점입니다.</p>
          <p>대기번호 순으로 처리하오니 잠시만 기다려 주십시오.</p>
          <p>번호 호출 후 30초 이내에 오지 않으시면 다음 번호로 넘어갈 수 있습니다.</p>
          <p>QR 코드를 통해 호출 알림을 iM뱅크 어플로 받으실 수 있습니다.</p>
        </div>
        <hr className="divider" />
        <img className="qr" src={qr} alt="qr 코드" />
      </div>
    </div>
  );
};

export default PreviewModal;
