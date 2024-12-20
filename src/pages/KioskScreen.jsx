import React, { useState, useEffect } from "react";
import banker from "../assets/ai1.png";
import logo from "../assets/logo.svg";
import "./KioskScreen.css";
import { useNavigate } from "react-router-dom";
import LoginContainer from "../components/LoginContainer";
import {
  getTicketInfoList,
  issueTicket,
  deleteButton,
  addButton,
  modifyButton,
  modifyButtonLoc,
} from "../api/ticketApi";
import { logoutUser } from "../api/userApi";
import { getDailyTalk } from "../api/statisticsApi";
import Swal from "sweetalert2";
import PreviewModal from "./PreviewModal";
import { Cookies } from "react-cookie";
import { useIdleTimer } from "react-idle-timer";
import CarouselComponent from "../components/CarouselComponent";

const KioskScreen = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [ticketInfoList, setTicketInfoList] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingButton, setIsAddingButton] = useState(false);
  const [isModifyingButton, setIsModifyingButton] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [activeEditButton, setActiveEditButton] = useState(null);
  const [newButtonName, setNewButtonName] = useState("");
  const [editButtonName, setEditButtonName] = useState("");
  const [refresh, setRefresh] = useState(1);
  const [selectedButton, setSelectedButton] = useState(null); // 선택된 버튼 상태
  const [selectedWidth, setSelectedWidth] = useState(150); // 기본 가로 길이
  const [selectedHeight, setSelectedHeight] = useState(50);
  const cookies = new Cookies();
  const dept_name = "강남";
  const [remaining, setRemaining] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isBranch, setIsBranch] = useState(false);
  const [carouselData, setCarouselData] = useState([]);
  const { getRemainingTime, reset } = useIdleTimer({
    timeout: 300000,
    onIdle: () => handleLogout(),
    throttle: 500,
  });

  const colorMap = [
    { id: 0, color: "rgba(128, 128, 128, 0.1)" }, // 기본 연한 회색
    { id: 1, color: "rgba(255, 182, 182, 0.3)" }, // 연한 빨강
    { id: 2, color: "rgba(255, 217, 102, 0.3)" }, // 연한 주황
    { id: 3, color: "rgba(255, 255, 153, 0.3)" }, // 연한 노랑
    { id: 4, color: "rgba(182, 255, 182, 0.3)" }, // 연한 초록
    { id: 5, color: "rgba(182, 212, 255, 0.3)" }, // 연한 파랑
  ];

  // Format remaining time as MM : SS
  function millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes < 10 ? "0" : ""}${minutes} : ${seconds < 10 ? "0" : ""}${seconds}`;
  }

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLogIn") === "true";
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      const memberInfo = JSON.parse(localStorage.getItem("memberInfo"));
      if (memberInfo && memberInfo.role === "BRANCH") {
        setIsEditMode(false);
        setIsDragMode(false);
        setIsBranch(true);
      } else {
        cookies.remove("accessToken");
      }
    }

    const fetchCarouselData = async () => {
      try {
        const data = await getDailyTalk(dept_name);
        // API 응답 데이터를 각 항목별 메시지로 변환
        const updatedCarouselData = [
          { message: `일주일 중 가장 방문자 수가 많은 요일은 ${data.dataBody.day}요일입니다.` },
          {
            message: `${dept_name} 지점의 오늘 방문자 수는 ${data.dataBody.visited}명입니다.`,
          },
          { message: `현재 창구 이용 평균 대기 시간은 ${data.dataBody.waitAvg}분입니다.` },
          { message: ` ${data.dataBody.busyTime}시 이후로 대기 인원이 줄어들 가능성이 높습니다.` },
          {
            message: `금일 업무 마감 시간은 ${data.dataBody.closeTime.slice(
              0,
              2
            )}시 ${data.dataBody.closeTime.slice(2)}분입니다. 미리 업무를 준비해주세요!`,
          },
        ];
        setCarouselData(updatedCarouselData);
      } catch (error) {
        console.error("통계 데이터를 가져오지 못했습니다:", error);
      }
    };

    fetchCarouselData();

    fetchTicketInfoList(dept_name);
    const interval = setInterval(() => {
      setRemaining(getRemainingTime());
    }, 500);
    return () => clearInterval(interval);
  }, [getRemainingTime, refresh]);

  const fetchTicketInfoList = async (deptNm) => {
    try {
      const ticketList = await getTicketInfoList(deptNm);
      console.log("서버 응답:", ticketList);

      const formattedList = ticketList.dataBody.map((button) => {
        const leftHigh = button.left_high ? button.left_high.split(",") : [10, 10];
        const rightLow = button.right_low ? button.right_low.split(",") : [160, 60]; // Default size of 150x50

        return {
          ...button,
          top: parseInt(leftHigh[1], 10),
          left: parseInt(leftHigh[0], 10),
          width: parseInt(rightLow[0], 10) - parseInt(leftHigh[0], 10),
          height: parseInt(rightLow[1], 10) - parseInt(leftHigh[1], 10),
        };
      });

      setTicketInfoList(formattedList);
    } catch (error) {
      console.error("API 호출 오류:", error);
      Swal.fire("네트워크 오류가 있습니다", "", "warning");
    }
  };

  const handleAdd = async (buttonName) => {
    const defaultLeftHigh = "10,10";
    const defaultRightLow = "160,60";
    const defaultColor = 0;

    try {
      await addButton({
        dept_nm: dept_name,
        work_dvcd_nm: buttonName,
        left_high: defaultLeftHigh,
        right_low: defaultRightLow,
        color: defaultColor,
      });
      Swal.fire("버튼 추가에 성공했습니다.", "", "info");
      setRefresh((prev) => -prev);
    } catch (error) {
      Swal.fire("버튼 추가에 실패했습니다.", "", "info");
    }
  };

  const handleSelectButton = (button) => {
    if (selectedButton?.work_dvcd === button.work_dvcd) {
      setSelectedButton(null);
      setIsDragging(false); // 입력창이 닫히면 드래그 가능
    } else {
      setSelectedButton(button);
      setSelectedWidth(button.width);
      setSelectedHeight(button.height);
      setIsDragging(false); // 입력창이 뜨면 드래그 불가
    }
  };

  const handleWidthChange = (event) => {
    const newWidth = parseInt(event.target.value, 10);
    if (!isNaN(newWidth)) {
      setSelectedWidth(newWidth);
      updateButtonDimensions(selectedButton, newWidth, selectedHeight);
    }
  };

  const handleHeightChange = (event) => {
    const newHeight = parseInt(event.target.value, 10);
    if (!isNaN(newHeight)) {
      setSelectedHeight(newHeight);
      updateButtonDimensions(selectedButton, selectedWidth, newHeight);
    }
  };

  const updateButtonDimensions = (button, newWidth, newHeight) => {
    setTicketInfoList((prevList) =>
      prevList.map((item) =>
        item.work_dvcd === button.work_dvcd ? { ...item, width: newWidth, height: newHeight } : item
      )
    );
  };

  // 드래그 모드 종료 시 saveButtonLocations 호출
  const toggleDragMode = () => {
    if (isDragMode) {
      saveButtonLocations(); // 드래그 모드 종료 시 위치 저장
    }
    setIsDragMode((prev) => !prev);
    setIsEditMode(false);
  };

  const handleTicketIssue = async (button) => {
    const ticketData = { dept_nm: dept_name, user_dvcd_nm: button.work_dvcd_nm };
    try {
      const result = await issueTicket(ticketData);
      setPreviewData({
        workType: button.work_dvcd_nm,
        waitingPeople: button.wait_people,
        expectedTime: button.wait_time,
        branchName: ticketData.dept_nm,
        count: result.dataBody.count,
      });
      setIsPreviewModalOpen(true);
    } catch (error) {
      Swal.fire("번호표 발급에 실패했습니다.", "", "info");
    }
  };

  const startDrag = (e, button) => {
    if (isDragging || !isDragMode) return; // 드래그 모드와 상태 모두 확인
    setIsDragging(true); // 드래그 상태 활성화

    const startX = e.clientX;
    const startY = e.clientY;
    const { left, top } = button;

    const onDrag = (event) => {
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const gridSize = 20;

      const newLeft = left + Math.round(deltaX / gridSize) * gridSize;
      const newTop = top + Math.round(deltaY / gridSize) * gridSize;

      setTicketInfoList((prevList) =>
        prevList.map((item) =>
          item.work_dvcd === button.work_dvcd ? { ...item, left: newLeft, top: newTop } : item
        )
      );
    };

    const stopDrag = () => {
      // 드래그 종료
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  const closeModal = () => setIsLoginModalOpen(false);
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setRefresh(refresh * -1);
  };
  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.clear();
      cookies.remove("accessToken");
      navigate("/");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
    Swal.fire("로그아웃되었습니다.", "", "question").then(() => window.location.reload());
  };

  const handleMapLayout = () => {
    navigate("/layout");
  };

  // 드래그 모드 종료 시 호출할 함수: 모든 버튼의 위치 정보 일괄 저장
  const saveButtonLocations = async () => {
    const updatedButtonLocations = ticketInfoList.map((button) => ({
      work_dvcd_nm: button.work_dvcd_nm,
      left_high: `${button.left},${button.top}`,
      right_low: `${button.left + button.width},${button.top + button.height}`,
    }));
    console.log(updatedButtonLocations);
    try {
      await modifyButtonLoc(dept_name, updatedButtonLocations);
      Swal.fire("위치가 저장되었습니다.", "", "success");
    } catch (error) {
      Swal.fire("위치 저장에 실패했습니다.", "", "error");
    }
  };

  const handleDelete = async (button) => {
    const buttonData = {
      deptNm: dept_name,
      workDvcdNm: button.work_dvcd_nm,
    };
    try {
      await deleteButton(buttonData); // 버튼 삭제 API 호출
      Swal.fire("버튼 삭제에 성공했습니다.", "", "info"); // 성공 알림
      setTicketInfoList((prevList) =>
        prevList.filter((item) => item.work_dvcd !== button.work_dvcd)
      ); // 목록에서 삭제
    } catch (error) {
      Swal.fire("버튼 삭제에 실패했습니다.", "", "error"); // 실패 알림
    }
  };

  const handleSaveNewButton = () => {
    if (newButtonName.trim()) {
      handleAdd(newButtonName);
      setNewButtonName("");
      setIsAddingButton(false);
    } else {
      Swal.fire("버튼 이름을 입력해 주세요.", "", "warning");
    }
  };

  const handleSaveModifyButton = (oldButtonName, color) => {
    if (!editButtonName.trim()) {
      handleModify({
        dept_nm: dept_name,
        new_work_dvcd_nm: oldButtonName,
        old_work_dvcd_nm: oldButtonName,
        color: color,
      });
    } else {
      handleModify({
        dept_nm: dept_name,
        new_work_dvcd_nm: editButtonName,
        old_work_dvcd_nm: oldButtonName,
        color: color,
      });
    }
    setEditButtonName("");
    setIsModifyingButton(false);
  };

  const toggleEditOptions = (id) => {
    setActiveEditButton((prev) => (prev === id ? null : id));
  };

  const handleModify = async (buttonData) => {
    try {
      await modifyButton(buttonData);
      Swal.fire("버튼 수정에 성공했습니다.", "", "info");
      setRefresh((prev) => -prev);
    } catch (error) {
      Swal.fire("버튼 수정에 실패했습니다.", "", "info");
    }
  };

  const handleColorChange = (button, newColor) => {
    console.log(`Updating color for ${button.work_dvcd_nm} to ${newColor}`);
    setTicketInfoList((prevList) =>
      prevList.map((item) =>
        item.work_dvcd === button.work_dvcd ? { ...item, color: newColor } : item
      )
    );
  };
  const memberInfo = JSON.parse(localStorage.getItem("memberInfo") || "{}");

  return (
    <div className="kiosk-screen">
      {(isEditMode || isDragMode) && <div className="session-control"></div>}
      <div className="navbar">
        <img className="logo" src={logo} alt="iM 뱅크" />
        <ul className="navbar-menu">
          {isLoggedIn && (
            <>
              <li>{memberInfo.name ? `${memberInfo.name}님 환영합니다!` : ""}</li>
              <li>남은 시간: {millisToMinutesAndSeconds(remaining)}</li>
            </>
          )}
          <li onClick={isLoggedIn ? handleLogout : () => setIsLoginModalOpen(true)}>
            {isLoggedIn ? "로그아웃" : "로그인"}
          </li>
        </ul>
      </div>
      <div className="content-container">
        <div className="left-section">
          <div className="carousel-container">
            <CarouselComponent carouselData={carouselData} />
          </div>
          <div className="banker-container">
            <img className="banker" src={banker} alt="AI 은행원" />
          </div>
        </div>

        <div className="right-section">
          <div
            className="right-section-top"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            {/* 항상 위에 위치하는 창구 배치도 버튼 */}
            <div
              className="sub-button-container"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                paddingRight: "20px",
              }}
            >
              <button
                className="sub-service-button"
                onClick={handleMapLayout}
                style={{
                  width: "92%",
                  height: "100px",
                  backgroundColor: "rgba(200, 200, 200, 0.3)",
                  color: "#333",
                  fontSize: "18px",
                  fontWeight: "bold",
                  borderRadius: "12px",
                  cursor: "pointer",
                  border: "2px solid rgba(200, 200, 200, 0.5)",
                  padding: "10px",
                  marginTop: "0px", // 살짝 위로 올리기 위한 간격 조정
                }}
              >
                창구 배치도
              </button>
            </div>

            {/* 조건부로 나타나는 모드 및 추가 버튼들 */}
            {isLoggedIn && isBranch && (
              <div
                className="mode-buttons"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                  paddingRight: "20px",
                }}
              >
                {isEditMode && !isAddingButton && isBranch && (
                  <button
                    className="add-button"
                    onClick={() => setIsAddingButton(true)}
                    style={{
                      width: "45px",
                      height: "45px",
                      backgroundColor: "lightgray",
                      borderRadius: "50%",
                      fontSize: "24px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    &#10133;
                  </button>
                )}

                <div
                  className={`toggle-switch ${isEditMode ? "active" : ""}`}
                  onClick={() => setIsEditMode(!isEditMode)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "120px",
                    height: "40px",
                    padding: "5px",
                    backgroundColor: isEditMode ? "lightblue" : "lightgray",
                    borderRadius: "20px",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: isEditMode ? "10px" : "auto",
                      right: isEditMode ? "auto" : "10px",
                      transform: "translateY(-50%)",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    {isEditMode ? "편집 모드" : "일반 모드"}
                  </div>
                  <div
                    className="toggle-circle"
                    style={{
                      width: "45px",
                      height: "45px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "transform 0.3s",
                      transform: isEditMode ? "translateX(60px)" : "translateX(0)",
                      zIndex: 1,
                    }}
                  />
                </div>

                <div
                  className={`toggle-switch ${isDragMode ? "active" : ""}`}
                  onClick={toggleDragMode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "120px",
                    height: "40px",
                    padding: "5px",
                    backgroundColor: isDragMode ? "lightgreen" : "lightgray",
                    borderRadius: "20px",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: isDragMode ? "10px" : "auto",
                      right: isDragMode ? "auto" : "10px",
                      transform: "translateY(-50%)",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    {isDragMode ? "드래그 모드" : "일반 모드"}
                  </div>
                  <div
                    className="toggle-circle"
                    style={{
                      width: "45px",
                      height: "45px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "transform 0.3s",
                      transform: isDragMode ? "translateX(60px)" : "translateX(0)",
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="right-section-bottom button-container">
            {ticketInfoList.map((button) => (
              <div
                key={button.work_dvcd}
                className="service-button-wrapper"
                style={{
                  top: `${button.top}px`,
                  left: `${button.left}px`,
                  width: `${button.width}px`,
                  height: `${button.height}px`,
                  position: "relative",
                  cursor: isDragMode ? "move" : "pointer",
                }}
                onMouseDown={(e) => isDragMode && !isDragging && startDrag(e, button)}
                onClick={() => isDragMode && handleSelectButton(button)}
              >
                <button
                  className="service-button"
                  style={{
                    borderRadius: `${Math.min(button.width, button.height) * 0.2}px`, // 버튼 크기에 비례하여 둥글게
                    fontSize: `${Math.min(button.width, button.height) * 0.1}px`, // 버튼 크기에 비례하여 글자 크기
                    backgroundColor: colorMap[button.color].color || colorMap[0].color,
                  }}
                  onClick={(e) =>
                    isDragMode
                      ? null
                      : isEditMode && !isModifyingButton
                      ? toggleEditOptions(button.work_dvcd)
                      : isModifyingButton
                      ? null
                      : handleTicketIssue(button)
                  }
                >
                  {isEditMode && isModifyingButton && activeEditButton === button.work_dvcd ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        width: "100%", // 버튼의 전체 너비를 차지하게 설정
                        height: "100%", // 버튼의 전체 높이를 차지하게 설정
                      }}
                    >
                      <input
                        type="text"
                        value={editButtonName || button.work_dvcd_nm}
                        onChange={(e) => setEditButtonName(e.target.value)}
                        autoFocus
                        placeholder={button.work_dvcd_nm}
                        className="button-input"
                        style={{
                          fontSize: "1em",
                          textAlign: "center",
                          width: "60%", // 버튼 너비의 60%를 차지
                          height: "50%", // 버튼 높이의 50%를 차지
                        }}
                      />
                      <select
                        onChange={(e) => handleColorChange(button, parseInt(e.target.value, 10))}
                        style={{
                          width: "25%", // 버튼 너비의 25%를 차지
                          height: "50%", // 버튼 높이의 50%를 차지
                          marginLeft: "5px", // 간격을 위한 여백 추가
                          backgroundColor: colorMap[button.color]?.color || colorMap[0].color,
                        }}
                      >
                        <option value={0} style={{ background: colorMap[0].color }}></option>
                        <option value={1} style={{ background: colorMap[1].color }}></option>
                        <option value={2} style={{ background: colorMap[2].color }}></option>
                        <option value={3} style={{ background: colorMap[3].color }}></option>
                        <option value={4} style={{ background: colorMap[4].color }}></option>
                        <option value={5} style={{ background: colorMap[5].color }}></option>
                      </select>
                    </div>
                  ) : (
                    <h1>{button.work_dvcd_nm}</h1>
                  )}
                  {!isEditMode && (
                    <p
                      className="waiting-info"
                      style={{
                        fontSize: `${Math.min(button.width, button.height) * 0.1}px`, // 버튼 크기에 비례한 글씨 크기
                      }}
                    >
                      대기 인원: {button.wait_people}
                      (예상 소요 시간: {button.wait_time} 분)
                    </p>
                  )}
                </button>

                {/* 드래그모드 - 크기 조절 */}
                {isDragMode && selectedButton?.work_dvcd === button.work_dvcd && (
                  <div
                    className="resize-controls"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      background: "#fff",
                      border: "1px solid #ccc",
                      padding: "8px",
                      zIndex: 10,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label>가로:</label>
                    <input
                      type="number"
                      value={selectedWidth}
                      onChange={handleWidthChange}
                      min="50"
                      step="10"
                      style={{ margin: "0 5px" }}
                    />
                    <label>세로:</label>
                    <input
                      type="number"
                      value={selectedHeight}
                      onChange={handleHeightChange}
                      min="50"
                      step="10"
                      style={{ margin: "0 5px" }}
                    />
                  </div>
                )}

                {isEditMode && activeEditButton === button.work_dvcd && !isModifyingButton && (
                  <div className="edit-buttons">
                    <button className="edit-button" onClick={() => setIsModifyingButton(true)}>
                      수정
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(button)}>
                      삭제
                    </button>
                  </div>
                )}

                {isEditMode && isModifyingButton && activeEditButton === button.work_dvcd && (
                  <div className="service-button-wrapper new-button">
                    <div className="edit-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleSaveModifyButton(button.work_dvcd_nm, button.color)}
                      >
                        저장
                      </button>
                      <button className="delete-button" onClick={() => setIsModifyingButton(false)}>
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isEditMode && activeEditButton === null && isAddingButton && (
              <>
                <div className="service-button-wrapper new-button">
                  <div className="service-button">
                    <input
                      type="text"
                      value={newButtonName}
                      onChange={(e) => setNewButtonName(e.target.value)}
                      placeholder="입력"
                      autoFocus
                      className="button-input"
                      style={{ width: "125px" }}
                    />
                  </div>
                  <div className="edit-buttons">
                    <button className="edit-button" onClick={handleSaveNewButton}>
                      저장
                    </button>
                    <button className="delete-button" onClick={() => setIsAddingButton(false)}>
                      취소
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoginModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={closeModal}>
              &#10006;
            </button>
            <LoginContainer closeModal={closeModal} setIsLoggedIn={setIsLoggedIn} />
          </div>
        </div>
      )}
      {isPreviewModalOpen && previewData && (
        <PreviewModal data={previewData} onClose={closePreviewModal} />
      )}
    </div>
  );
};

export default KioskScreen;
