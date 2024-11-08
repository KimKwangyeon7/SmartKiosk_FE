// import React, { useState } from "react";
// import "./TicketButton.css";

// const TicketButton = ({
//   button,
//   isDragMode,
//   isEditMode,
//   onUpdatePosition,
//   onDelete,
//   onModify,
//   onIssue,
// }) => {
//   const [isDragging, setIsDragging] = useState(false);
//   const [startPos, setStartPos] = useState({ x: 0, y: 0 });
//   const [position, setPosition] = useState({ left: button.left, top: button.top });

//   // 드래그 시작
//   const startDrag = (e) => {
//     if (isDragMode) {
//       e.preventDefault();
//       setIsDragging(true);
//       setStartPos({ x: e.clientX, y: e.clientY });
//       window.addEventListener("mousemove", onDrag);
//       window.addEventListener("mouseup", endDrag);
//     }
//   };

//   // 드래그 중
//   const onDrag = (e) => {
//     if (isDragging) {
//       const deltaX = e.clientX - startPos.x;
//       const deltaY = e.clientY - startPos.y;

//       setPosition((prevPosition) => ({
//         left: prevPosition.left + deltaX,
//         top: prevPosition.top + deltaY,
//       }));

//       setStartPos({ x: e.clientX, y: e.clientY });
//     }
//   };

//   // 드래그 종료
//   const endDrag = () => {
//     if (isDragging) {
//       setIsDragging(false);
//       window.removeEventListener("mousemove", onDrag);
//       window.removeEventListener("mouseup", endDrag);
//       onUpdatePosition(button.work_dvcd, { left: position.left, top: position.top });
//     }
//   };

//   return (
//     <div
//       className={`ticket-button ${isDragMode ? "drag-mode" : ""}`}
//       style={{
//         top: `${position.top}px`,
//         left: `${position.left}px`,
//         width: `${button.width}px`,
//         height: `${button.height}px`,
//         position: isDragMode ? "absolute" : "static",
//       }}
//       onMouseDown={startDrag}
//     >
//       <button
//         className="service-button"
//         onClick={() => (!isEditMode && !isDragMode ? onIssue(button) : null)}
//       >
//         <h1>{button.work_dvcd_nm}</h1>
//         {!isEditMode && !isDragMode && (
//           <p className="waiting-info">
//             대기 인원: {button.wait_people} (예상 소요 시간: {button.wait_time} 분)
//           </p>
//         )}
//       </button>

//       {isEditMode && (
//         <div className="edit-buttons">
//           <button className="edit-button" onClick={onModify}>
//             수정
//           </button>
//           <button className="delete-button" onClick={() => onDelete(button)}>
//             삭제
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TicketButton;
