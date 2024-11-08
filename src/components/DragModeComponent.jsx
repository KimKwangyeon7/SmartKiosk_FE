import React, { useState } from "react";

const DragModeComponent = ({ ticketInfoList, onUpdateTicketInfoList }) => {
  const [localTicketInfoList, setLocalTicketInfoList] = useState(ticketInfoList);

  const startDrag = (e, button) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const { left, top } = button;

    const onDrag = (event) => {
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      setLocalTicketInfoList((prevList) =>
        prevList.map((item) =>
          item.work_dvcd === button.work_dvcd
            ? { ...item, left: left + deltaX, top: top + deltaY }
            : item
        )
      );
    };

    const stopDrag = () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  const handleSave = () => {
    onUpdateTicketInfoList(localTicketInfoList); // 부모로 업데이트된 리스트 전달
  };

  return (
    <div className="drag-mode-container">
      {localTicketInfoList.map((button) => (
        <div
          key={button.work_dvcd}
          className="draggable-button"
          style={{
            position: "absolute",
            top: `${button.top}px`,
            left: `${button.left}px`,
            width: `${button.width}px`,
            height: `${button.height}px`,
          }}
          onMouseDown={(e) => startDrag(e, button)}
        >
          <h1>{button.work_dvcd_nm}</h1>
        </div>
      ))}
      <button onClick={handleSave}>변경 사항 저장</button>
    </div>
  );
};

export default DragModeComponent;
