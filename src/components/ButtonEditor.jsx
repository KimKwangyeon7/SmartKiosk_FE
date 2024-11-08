import React from "react";
import "./ButtonEditor.css";

const ButtonEditor = ({ ticketInfoList, setTicketInfoList, isEditMode }) => {
  const gridSize = 10;

  // 버튼 위치 및 크기 업데이트 함수
  const updateButtonPosition = (buttonId, newTop, newLeft, newWidth, newHeight) => {
    setTicketInfoList((prevList) =>
      prevList.map((button) =>
        button.work_dvcd === buttonId
          ? { ...button, top: newTop, left: newLeft, width: newWidth, height: newHeight }
          : button
      )
    );
  };

  const startDrag = (e, button) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const { top, left, width, height } = button;

    const onDrag = (event) => {
      const deltaX = Math.round((event.clientX - startX) / gridSize) * gridSize;
      const deltaY = Math.round((event.clientY - startY) / gridSize) * gridSize;
      updateButtonPosition(button.work_dvcd, top + deltaY, left + deltaX, width, height);
    };

    const endDrag = () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", endDrag);
    };

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
  };

  const startResize = (e, button, corner) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const { width, height, top, left } = button;

    const onResize = (event) => {
      let newWidth = width;
      let newHeight = height;

      if (corner === "bottom-right") {
        newWidth = Math.round((width + (event.clientX - startX)) / gridSize) * gridSize;
        newHeight = Math.round((height + (event.clientY - startY)) / gridSize) * gridSize;
      }

      updateButtonPosition(button.work_dvcd, top, left, newWidth, newHeight);
    };

    const endResize = () => {
      window.removeEventListener("mousemove", onResize);
      window.removeEventListener("mouseup", endResize);
    };

    window.addEventListener("mousemove", onResize);
    window.addEventListener("mouseup", endResize);
  };

  return (
    <div className={`button-container ${isEditMode ? "grid-background" : ""}`}>
      {ticketInfoList.map((button) => (
        <div
          key={button.work_dvcd}
          className="service-button-wrapper"
          style={{
            top: button.top,
            left: button.left,
            width: button.width,
            height: button.height,
            position: isEditMode ? "absolute" : "static",
          }}
          onMouseDown={(e) => isEditMode && startDrag(e, button)}
        >
          <button className="service-button">{button.work_dvcd_nm}</button>
          {isEditMode && (
            <div
              className="resize-handle"
              onMouseDown={(e) => startResize(e, button, "bottom-right")}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ButtonEditor;
