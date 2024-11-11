// PreviewModal.js
import React from "react";
import "./PreviewModal.css"; // 모달 스타일을 위한 CSS 파일
import qr from "../assets/qr.png";
import logo from "../assets/logo.svg";

const PreviewModal = ({ data, onClose }) => {
  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          padding: "10px 20px", // 전체적인 여백을 줄임
          height: "auto",
        }}
      >
        {/* 로고 추가 */}
        <img
          src={logo}
          alt="로고"
          className="logo"
          style={{ width: "180px", marginBottom: "8px", marginTop: "0", filter: "grayscale(100%)" }}
        />

        {/* 오른쪽 상단 'X' 버튼 */}
        <button onClick={onClose} className="close-button">
          &#10006;
        </button>

        {/* 호출번호 */}
        <p style={{ margin: "5px 0" }}>
          <strong>호출번호</strong>
          <h1 style={{ fontSize: "4.5rem", margin: "5px 0" }}>{data.count}</h1>
        </p>

        {/* 상담 종류 */}
        <p style={{ margin: "5px 0" }}>
          <strong>상담 종류: {data.workType}</strong>
        </p>

        {/* 예상 대기시간 */}
        <p style={{ margin: "5px 0" }}>
          <strong>예상 대기시간: </strong>
          <span className="highlighted-text">{data.expectedTime}</span> 분
        </p>

        {/* 대기 인원 */}
        <p style={{ margin: "5px 0" }}>
          <strong>대기 인원: </strong>
          <span className="highlighted-text">{data.waitingPeople}</span> 명
        </p>

        <hr className="divider" style={{ margin: "10px 0" }} />

        {/* 안내문구 */}
        <div className="preview-text" style={{ marginBottom: "10px" }}>
          <p style={{ margin: "5px 0" }}>iM뱅크 {data.branchName} 지점입니다.</p>
          <p style={{ margin: "5px 0" }}>대기번호 순으로 처리하오니 잠시만 기다려 주십시오.</p>
          <p style={{ margin: "5px 0" }}>
            번호 호출 후 30초 이내에 오지 않으시면 다음 번호로 넘어갈 수 있습니다.
          </p>
          <p style={{ margin: "5px 0" }}>
            QR 코드를 통해 호출 알림을 iM뱅크 어플로 받으실 수 있습니다.
          </p>
        </div>

        <hr className="divider" style={{ margin: "10px 0" }} />

        {/* QR 코드 */}
        <img className="qr" src={qr} alt="qr 코드" />
      </div>
    </div>
  );
};

export default PreviewModal;
