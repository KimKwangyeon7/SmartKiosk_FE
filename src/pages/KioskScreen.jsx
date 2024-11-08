import React, { useState, useEffect } from "react";
import BigFontToggle from "./Common/BigFontToggle";
import banker from "../assets/ai1.png";
import logo from "../assets/logo.svg";
import "./KioskScreen.css";
import { Link, useNavigate } from "react-router-dom";
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
import Swal from "sweetalert2";
import PreviewModal from "./PreviewModal";
import { Cookies } from "react-cookie";
import { useIdleTimer } from "react-idle-timer";

const gridSize = 20;
const KioskScreen = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [ticketInfoList, setTicketInfoList] = useState([]);
  const [locInfoList, setLocInfoList] = useState([]);
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

  const cookies = new Cookies();
  const dept_name = "강남";
  const [remaining, setRemaining] = useState(null);

  const { getRemainingTime, reset } = useIdleTimer({
    timeout: 300000,
    onIdle: () => handleLogout(),
    throttle: 500,
  });

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
        setIsEditMode(true);
      }
    }

    fetchTicketInfoList(dept_name);
    const interval = setInterval(() => {
      setRemaining(getRemainingTime());
    }, 500);
    return () => clearInterval(interval);
  }, [getRemainingTime, refresh]);
  //setRefresh((refresh) => refresh * -1);
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

    try {
      await addButton({
        dept_nm: dept_name,
        work_dvcd_nm: buttonName,
        left_high: defaultLeftHigh,
        right_low: defaultRightLow,
      });
      Swal.fire("버튼 추가에 성공했습니다.", "", "info");
      setRefresh((prev) => -prev);
    } catch (error) {
      Swal.fire("버튼 추가에 실패했습니다.", "", "info");
    }
  };

  // const updateButtonPosition = async (button) => {
  //   const left_high = `${button.left},${button.top}`;
  //   const right_low = `${button.left + button.width},${button.top + button.height}`;

  //   try {
  //     await modifyButtonLoc(dept_name, {
  //       workDvcdNm: button.work_dvcd_nm,
  //       leftHigh: left_high,
  //       rightLow: right_low,
  //     });
  //     Swal.fire("버튼 위치가 저장되었습니다.", "", "info");
  //   } catch (error) {
  //     Swal.fire("위치 저장에 실패했습니다.", "", "error");
  //   }
  // };

  // 드래그 모드 종료 시 saveButtonLocations 호출
  const toggleDragMode = () => {
    if (isDragMode) {
      saveButtonLocations(); // 드래그 모드 종료 시 위치 저장
    }
    setIsDragMode((prev) => !prev);
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
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const { left, top } = button;

    const onDrag = (event) => {
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const gridSize = 20;

      // 격자에 맞추기 위해 gridSize로 나눈 후 다시 곱하여 위치를 조정합니다.
      const newLeft = left + Math.round(deltaX / gridSize) * gridSize;
      const newTop = top + Math.round(deltaY / gridSize) * gridSize;

      setTicketInfoList((prevList) =>
        prevList.map((item) =>
          item.work_dvcd === button.work_dvcd ? { ...item, left: newLeft, top: newTop } : item
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

  const closeModal = () => setIsLoginModalOpen(false);
  const closePreviewModal = () => setIsPreviewModalOpen(false);

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

  // const handleDragModeToggle = async () => {
  //   if (isDragMode) {
  //     try {
  //       await saveAllButtonPositions();
  //       Swal.fire("모든 위치가 저장되었습니다.", "", "success");
  //     } catch (error) {
  //       Swal.fire("위치 저장에 실패했습니다.", "", "error");
  //     }
  //   }
  //   setIsDragMode((prev) => !prev);
  // };

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

  const handleSaveModifyButton = (oldButtonName) => {
    if (editButtonName.trim()) {
      handleModify({
        dept_nm: dept_name,
        new_work_dvcd_nm: editButtonName,
        old_work_dvcd_nm: oldButtonName,
      });
      setEditButtonName("");
      setIsModifyingButton(false);
    } else {
      Swal.fire("버튼 이름을 입력해 주세요.", "", "warning");
    }
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

  return (
    <div className="kiosk-screen">
      {(isEditMode || isDragMode) && (
        <div className="session-control">
          <span>남은 시간: {millisToMinutesAndSeconds(remaining)}</span>
        </div>
      )}
      <div className="navbar">
        <img className="logo" src={logo} alt="iM 뱅크" />
        <ul className="navbar-menu">
          <li onClick={isLoggedIn ? handleLogout : () => setIsLoginModalOpen(true)}>
            {isLoggedIn ? "로그아웃" : "로그인"}
          </li>
        </ul>
        <button onClick={toggleDragMode}>
          {isDragMode ? "드래그 모드 종료" : "드래그 모드 시작"}
        </button>
        <button onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? "편집 모드 종료" : "편집 모드 시작"}
        </button>
      </div>

      <div className="content-container">
        <div className="left-section">
          <img className="banker" src={banker} alt="AI 은행원" />
        </div>
        <div className={`button-container ${isDragMode ? "grid-background" : ""}`}>
          {ticketInfoList.map((button) => (
            <div
              key={button.work_dvcd}
              className="service-button-wrapper"
              style={{
                top: `${button.top}px`,
                left: `${button.left}px`,
                width: `${button.width}px`,
                height: `${button.height}px`,
                position: "absolute",
                cursor: isDragMode ? "move" : "pointer",
              }}
              onMouseDown={(e) => isDragMode && startDrag(e, button)}
            >
              <button
                className="service-button"
                onClick={() =>
                  isDragMode
                    ? null
                    : isEditMode
                    ? toggleEditOptions(button.work_dvcd)
                    : handleTicketIssue(button)
                }
              >
                <h1>{button.work_dvcd_nm}</h1>
                {!isEditMode && !isDragMode && (
                  <p className="waiting-info">
                    대기 인원: {button.wait_people} (예상 소요 시간: {button.wait_time} 분)
                  </p>
                )}
              </button>

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
                  <div className="service-button">
                    <input
                      type="text"
                      value={editButtonName}
                      onChange={(e) => setEditButtonName(e.target.value)} // 제대로 입력값을 변경
                      placeholder={button.work_dvcd_nm}
                      autoFocus
                      className="button-input"
                      style={{ width: "125px" }}
                    />
                  </div>
                  <div className="edit-buttons">
                    <button
                      className="edit-button"
                      onClick={() => handleSaveModifyButton(button.work_dvcd_nm)}
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
          {isEditMode && !isAddingButton && !isModifyingButton && (
            <button className="add-button" onClick={() => setIsAddingButton(true)}>
              &#10133;
            </button>
          )}
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
