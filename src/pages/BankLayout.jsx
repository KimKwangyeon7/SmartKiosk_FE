import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./BankLayout.css";
import {
  getWicketInfoList,
  sendUpdatedWicketInfoList,
  createWicket,
  deleteWicket,
  updateWicket,
  deleteFloor,
  moveWicket,
  moveKiosk,
} from "../api/wicketApi";
import { getTicketInfoList, startCounsel, endCounsel } from "../api/ticketApi";
import { logoutUser } from "../api/userApi";
import { Cookies } from "react-cookie";
import Swal from "sweetalert2";

const deptNm = "강남";

const BankLayout = () => {
  const [floors, setFloors] = useState([]);
  const [counters, setCounters] = useState({});
  const [kiosks, setKiosks] = useState({});
  const [currentFloor, setCurrentFloor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [changes, setChanges] = useState({ counters: [], kiosks: [] });
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [newCounterName, setNewCounterName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingCounter, setEditingCounter] = useState(null);
  const [btnList, setBtnList] = useState([]);
  const [selectedBtn, setSelectedBtn] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const cookies = new Cookies();
  const [counselSessions, setCounselSessions] = useState({});
  const [isBranch, setIsBranch] = useState(false);

  const fetchData = async () => {
    try {
      const res = await getWicketInfoList(deptNm);
      const data = res.dataBody;
      console.log(data);
      setFloors(data.floors);
      setCounters(data.layouts.wicketInfo);
      setKiosks(data.kiosks.kioskInfo);
      setCurrentFloor(data.floors[0]);

      const csnls = data.counsels;
      for (let i = 0; i < csnls.length; i++) {
        const wd_id = csnls[i].split(" ")[0];
        const counsel_id = csnls[i].split(" ")[1];
        //console.log(wd_id + " " + counsel_id);
        setCounselSessions((prev) => ({
          ...prev,
          [wd_id]: counsel_id,
        }));
      }
    } catch (error) {
      console.error("데이터 가져오기 실패", error);
    }
  };

  const getWorkList = async () => {
    try {
      const res = await getTicketInfoList(deptNm);
      const data = res.dataBody;
      console.log(data);
      setBtnList(data);
    } catch (error) {
      console.error("데이터 가져오기 실패", error);
    }
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLogIn") === "true";
    if (loggedIn) {
      const memberInfo = JSON.parse(localStorage.getItem("memberInfo"));
      if (memberInfo && memberInfo.role === "BRANCH") {
        setIsBranch(true);
      }
    }

    fetchData();
    getWorkList();
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const currentCounters = counters[currentFloor] || {};
  console.log(currentCounters);
  const currentKiosks = kiosks[currentFloor] || [];
  // 기본 그리드 크기
  const defaultGridSize = 6;

  // 현재 층의 창구 수에 따라 gridSize 결정
  const gridSize = Math.max(defaultGridSize, Object.keys(currentCounters).length);

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.clear();
      cookies.remove("accessToken");
      navigate("/");
    } catch (error) {
      console.error("로그아웃 실패", error);
    }
  };

  const handleDrop = (x, y, counterName) => {
    setCounters((prev) => {
      // 기존 상태 복사
      const updatedFloorCounters = { ...prev[currentFloor] };

      const targetCoord = `${x},${y}`;
      if (updatedFloorCounters[targetCoord]) {
        Swal.fire("이동할 수 없습니다.", "이동하려는 자리에 다른 창구가 이미 있습니다.", "warning");
        return prev; // 기존 상태를 반환하여 이동을 방지
      }

      let fromCoord = null;
      const counterId = counterName.split(",")[0]; // 아이디만 추출
      const fullCounterName = counterName; // 전체 counterName을 저장

      // 기존 좌표에서 창구를 찾고 삭제
      for (const key in updatedFloorCounters) {
        if (updatedFloorCounters[key] === fullCounterName) {
          fromCoord = key;
          delete updatedFloorCounters[key]; // 기존 위치에서 창구 삭제
          break;
        }
      }

      // 새로운 좌표에 전체 counterName을 저장
      updatedFloorCounters[`${x},${y}`] = fullCounterName; // 전체 이름을 저장

      // 상태 변경 기록
      if (fromCoord) {
        setChanges((prevChanges) => ({
          ...prevChanges,
          counters: [
            ...prevChanges.counters,
            { counterName: fullCounterName, from: fromCoord, to: `${x},${y}`, floor: currentFloor }, // 전체 이름을 사용
          ],
        }));

        const data = {
          counterName: fullCounterName,
          from: fromCoord,
          to: targetCoord,
          floor: currentFloor,
        };
        const res = moveWicket(data);
      }

      // 상태 반환
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
  };

  const handleKioskDrop = (x, y, prevCoord) => {
    setKiosks((prev) => {
      const updatedKiosks = { ...prev };
      const kiosksOnCurrentFloor = updatedKiosks[currentFloor].filter(
        (coord) => coord !== prevCoord
      );
      kiosksOnCurrentFloor.push(`${x},${y}`);
      updatedKiosks[currentFloor] = kiosksOnCurrentFloor;

      setChanges((prevChanges) => ({
        ...prevChanges,
        kiosks: [...prevChanges.kiosks, { from: prevCoord, to: `${x},${y}` }],
      }));

      const data = {
        from: prevCoord,
        to: `${x},${y}`,
      };
      moveKiosk(data);
      return updatedKiosks;
    });
  };

  const toggleEditMode = () => {
    if (editMode) {
      // 편집 모드를 비활성화하는 경우, 변경된 내용을 서버에 전송
      //console.log("변경된 창구 및 키오스크 정보:", changes);
      //sendChangesToServer(changes); // 서버에 변경 사항 전송
      setChanges({ counters: [], kiosks: [] }); // 변경 기록 초기화
    }
    setEditMode((prevEditMode) => !prevEditMode); // 편집 모드 토글
  };

  const handleAddCounter = async () => {
    const newCounterIndex = Object.keys(counters[currentFloor] || {}).length + 1; // 창구 수 + 1
    const newCounterName = `창구 ${newCounterIndex}`;
    const defaultTask = btnList[0]?.work_dvcd_nm || ""; // 업무 리스트 첫 번째 항목

    // 창구의 초기 좌표를 (0, 0)부터 시작
    let newX = 0;
    let newY = 0;

    // 현재 층에서 이미 존재하는 좌표들을 확인하여 중복되지 않는 좌표를 찾기
    const existingCoordinates = Object.keys(counters[currentFloor] || {});
    let foundEmptySpot = false;

    while (!foundEmptySpot) {
      const coord = `${newX},${newY}`;
      if (!existingCoordinates.includes(coord)) {
        foundEmptySpot = true;
      } else {
        if (newY < 5) {
          newY++;
        } else {
          newY = 0;
          newX++;
        }
      }
    }

    // DB에 새로운 창구 추가 요청
    try {
      const data = {
        deptNm: deptNm,
        wdDvcdNm: defaultTask,
        wdNum: newCounterIndex,
        wdFloor: currentFloor,
      };
      const res = await createWicket(data); // 서버에 창구 생성 요청

      // 서버에서 생성된 창구 ID를 받아와 상태에 업데이트
      const newCounterId = res.dataBody; // 서버가 반환한 ID를 사용
      setCounters((prev) => ({
        ...prev,
        [currentFloor]: {
          ...prev[currentFloor],
          [`${newX},${newY}`]: `${newCounterName},${newCounterId},${defaultTask}`,
        },
      }));
    } catch (error) {
      console.error("창구 생성 실패: ", error);
      alert("창구 생성에 실패했습니다.");
    }
  };

  const addCounter = async () => {
    console.log("api 호출 전!");
    console.log(newCounterName);
    const data = {
      deptNm: deptNm,
      wdDvcdNm: selectedBtn,
      wdNum: newCounterName.split(" ")[1].split(",")[0],
      wdFloor: currentFloor,
    };
    const res = await createWicket(data);
    console.log(res.dataBody);

    if (counters[currentFloor] && counters[currentFloor]["0,0"] !== undefined) {
      const nm = newCounterName.split(",")[0];
      const t = newCounterName.split(",")[1];
      counters[currentFloor]["0,0"] = `${nm},${res.dataBody},${t}`; // 원하는 값을 넣으세요
    } else {
      console.log("해당 위치에 접근할 수 없습니다.");
    }
    setNewCounterName("");
    setEditingCounter(null);
  };

  // `getTaskColor` 함수
  const getTaskColor = (coord) => {
    const taskName = currentCounters[coord].split(",")[2];
    const task = btnList.find((item) => item.work_dvcd_nm === taskName);

    if (!task) return "rgba(0, 0, 0, 0.1)"; // 기본 연한 회색 (task가 없는 경우)

    switch (task.color) {
      case 1:
        return "rgba(255, 0, 0, 0.3)"; // 연한 빨강
      case 2:
        return "rgba(255, 165, 0, 0.3)"; // 연한 주황
      case 3:
        return "rgba(255, 255, 0, 0.3)"; // 연한 노랑
      case 4:
        return "rgba(0, 0, 255, 0.3)"; // 연한 파랑
      default:
        return "rgba(0, 0, 0, 0.1)"; // 기본 연한 회색
    }
  };

  const handleUpdateCounter = (coord, e) => {
    e.stopPropagation();
    setSelectedCounter(coord);
    setIsEditing(true);
    document.addEventListener("mousedown", handleOutsideClick);
  };

  const handleStart = async (coord, e) => {
    e.stopPropagation();
    console.log(`창구 ${selectedCounter} 시작됨`);

    const data = {
      dept_nm: deptNm,
      wd_num: currentCounters[coord].split(" ")[1].split(",")[0],
      floor: currentFloor,
      wd_id: currentCounters[coord].split(" ")[1].split(",")[1],
    };

    try {
      const res = await startCounsel(data);
      // res와 res.dataBody가 정의되어 있는지 확인
      if (!res || !res.dataBody || res.error) {
        Swal.fire("대기 중인 고객이 없습니다.", "", "info");
      } else {
        const { counsel_id, dept_nm, wd_num, wd_floor, wd_dvcd_nm, cnt } = res.dataBody;
        console.log(counsel_id);

        const wd_id = currentCounters[coord].split(" ")[1].split(",")[1];
        console.log(wd_id);

        setCounselSessions((prev) => ({
          ...prev,
          [wd_id]: counsel_id,
        }));

        Swal.fire(
          `${cnt}번 고객님. ${wd_floor}층 ${wd_num}번 창구로 와주세요!`,
          `${dept_nm} 지점 ${wd_dvcd_nm}`,
          "info"
        );
        console.log("상담 시작!", res);
      }
    } catch (error) {
      console.error("상담 시작 중 오류 발생:", error);
      Swal.fire("상담을 시작하는 중 오류가 발생했습니다.", "", "error");
    }

    setSelectedCounter(null);
  };

  const handleEnd = async (coord, e) => {
    e.stopPropagation();

    const wd_id = currentCounters[coord].split(" ")[1].split(",")[1];
    const wd_num = currentCounters[coord].split(" ")[1].split(",")[0];
    const counsel_id = counselSessions[wd_id];

    if (!counsel_id) {
      Swal.fire("진행 중인 상담이 없습니다.", "", "error");
      return;
    }
    try {
      const res = await endCounsel(counsel_id);

      // 응답이 존재하면 상담 종료 성공으로 간주
      if (res) {
        Swal.fire("상담을 종료했습니다!", "", "success");
        console.log(`창구 ${wd_num} 상담 종료 성공`);

        setCounselSessions((prev) => {
          const updatedSessions = { ...prev };
          delete updatedSessions[wd_id];
          return updatedSessions;
        });
      } else {
        console.log("상담 종료에 실패했습니다.");
      }
    } catch (error) {
      console.error("상담 종료 중 오류 발생:", error);
      Swal.fire("상담 종료 중 오류가 발생했습니다.", "", "error");
    }

    setSelectedCounter(null);
  };

  const handleOutsideClick = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      handleSave();
    }
  };

  const handleSave = () => {
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      const currentId = currentCounters[selectedCounter].split(",")[1]; // 아이디 추출
      updatedFloorCounters[selectedCounter] = `${
        newCounterName.split(",")[0]
      },${currentId},${selectedBtn}`; // 수정된 이름과 아이디 결합
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });

    const id = counters[currentFloor][selectedCounter].split(",")[1];
    const code =
      selectedCounter +
      " " +
      newCounterName.split(",")[0] +
      "," +
      id +
      "," +
      selectedBtn +
      "," +
      currentFloor;

    updateWicket(code);
    setIsEditing(false);
    setSelectedCounter(null);
    document.removeEventListener("mousedown", handleOutsideClick);
  };

  // 취소 버튼 클릭
  const handleCancel = () => {
    setIsEditing(false);
  };

  // 창구 클릭 시 수정, 삭제 버튼 표시
  const handleCounterClick = (coord) => {
    if (editMode) {
      // 이미 선택된 창구를 다시 클릭할 경우 선택 해제
      if (selectedCounter === coord) {
        console.log(`편집 모드 - 창구 ${coord} 선택 시 작업 없음`);
        setSelectedCounter(null); // 선택 해제
      } else {
        setSelectedCounter(coord); // 선택된 창구 설정
        console.log(`창구 ${coord}가 선택됨`);
      }
    } else {
      // 이미 선택된 창구를 다시 클릭할 경우 선택 해제
      if (selectedCounter === coord) {
        console.log(`일반 모드 - 창구 ${coord} 선택 시 작업 없음`);
        setSelectedCounter(null); // 선택 해제
      } else {
        setSelectedCounter(coord); // 선택된 창구 설정
        console.log(`창구 ${coord}가 선택됨`);
      }
    }
  };

  // 삭제 버튼 클릭
  const handleDeleteCounter = (coord, e) => {
    e.stopPropagation(); // 이벤트 전파 방지
    const wdId = counters[currentFloor][coord].split(",")[1];
    deleteWicket(wdId); // DB에서 창구 삭제
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      delete updatedFloorCounters[coord]; // 선택한 좌표에서 창구 삭제
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
    // 상태 초기화
    setSelectedCounter(null);
    setIsEditing(false);
    setNewCounterName("");
    setEditingCounter(null);
  };

  const handleNameCreate = (e) => {
    const newName = e.target.value;
    console.log(newName);
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor], [editingCounter]: newName };
      console.log(updatedFloorCounters);

      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
    setNewCounterName(newName);
  };

  const cancelCreate = () => {
    setEditingCounter(null);
  };

  const addFloor = () => {
    const newFloor = `${floors.length + 1}`;
    setFloors((prevFloors) => [...prevFloors, newFloor]);
    setCurrentFloor(newFloor);
  };

  const removeFloor = async () => {
    if (currentFloor) {
      try {
        // 서버에 현재 층 삭제 요청 전송
        await deleteFloor(currentFloor);
        console.log(`층 ${currentFloor} 정보가 서버에 전달되었습니다.`);

        // 최신 데이터를 서버에서 다시 가져와 상태 업데이트
        fetchData(); // 최신 층 데이터와 상태를 갱신하는 함수 호출
      } catch (error) {
        console.error("층 삭제 중 오류가 발생했습니다.", error);
      }
    }
  };

  const renderCounterNameInput = () => {
    if (editingCounter !== null) {
      return (
        <div>
          <input
            type="text"
            value={counters[currentFloor][editingCounter] || ""}
            onChange={handleNameCreate}
          />
          <select
            value={selectedBtn} // 업무 유형
            onChange={handleTaskSelectChange} // 업무 유형을 선택할 때 실행되는 함수
          >
            {btnList.map((task) => (
              <option key={task.dept_id} value={task.work_dvcd_nm}>
                {task.work_dvcd_nm}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return null;
  };

  const handleNameChange = (e) => {
    const val = e.target.value;

    // 숫자만 받도록 정규식 적용 (숫자만 추출)
    const numericVal = val.replace(/\D/g, ""); // 숫자 이외의 문자는 제거

    // 기존 '창구 '에 숫자만 붙여서 업데이트
    setNewCounterName(`창구 ${numericVal}`);
  };

  const handleTaskSelectChange = (e) => {
    setSelectedBtn(e.target.value);
    setNewCounterName((prev) => {
      const parts = prev.split(",");
      parts[1] = e.target.value; // 선택한 업무 종류로 업데이트
      return parts.join(",");
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100vh",
      }}
    >
      {/* Navbar */}
      <div className="navbar">
        <Link to="/">
          <img className="logo" src={require("../assets/logo.svg").default} alt="iM 뱅크" />
        </Link>
        <ul className="navbar-menu">
          <li>
            {}
            <Link to="#" onClick={handleLogout}>
              로그아웃
            </Link>
            <Link to="#" onClick={handleLogout}>
              로그인
            </Link>
          </li>
        </ul>
      </div>

      {currentFloor && (
        <>
          <h1>{currentFloor}층 창구 배치도</h1>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "90%", // 부모 컨테이너의 전체 너비 사용
              height: "10%",
              padding: "10px 0",
            }}
          >
            {/* 토글 스위치 */}
            <div
              className={`toggle-switch ${editMode ? "active" : ""}`}
              onClick={toggleEditMode}
              style={{
                display: "flex",
                alignItems: "center",
                width: "120px",
                height: "40px",
                padding: "5px",
                backgroundColor: editMode ? "lightblue" : "lightgray",
                borderRadius: "20px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: editMode ? "10px" : "auto",
                  right: editMode ? "auto" : "10px",
                  transform: "translateY(-50%)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                {editMode ? "편집 모드" : "일반 모드"}
              </div>
              <div
                className="toggle-circle"
                style={{
                  width: "45px",
                  height: "45px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "transform 0.3s",
                  transform: editMode ? "translateX(60px)" : "translateX(0)",
                  zIndex: 1,
                }}
              />
            </div>

            {/* 편집 모드 전용 버튼 */}
            {editMode && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleAddCounter}
                  style={{ padding: "5px 10px", cursor: "pointer" }}
                >
                  창구 생성
                </button>

                <button
                  onClick={addFloor}
                  className="add-floor-button"
                  style={{
                    padding: "5px 10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  층 추가
                </button>

                <button
                  onClick={removeFloor}
                  className="delete-floor-button"
                  style={{
                    padding: "5px 10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    color: "red",
                  }}
                >
                  층 삭제
                </button>
              </div>
            )}
          </div>

          {editingCounter !== null && <button onClick={addCounter}>저장</button>}
          {editingCounter !== null && <button onClick={cancelCreate}>취소</button>}
          {renderCounterNameInput()}

          <div
            className="grid-container"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: "95%", // 화면 너비의 90%
              height: "80%", // 화면 높이의 60%
              backgroundColor: "#f0f0f0", // 배경색으로 영역 구분
              marginBottom: "20px",
              gap: "5px", // 그리드 아이템 간격
            }}
          >
            {[...Array(gridSize)].map((_, row) =>
              [...Array(gridSize)].map((_, col) => {
                const coord = `${row},${col}`;
                const isKiosk = currentKiosks.includes(coord);
                return (
                  <div
                    key={coord}
                    className={`grid-item ${editMode ? "edit-mode" : ""}`}
                    onDrop={(e) => {
                      e.preventDefault();
                      const counterName = e.dataTransfer.getData("counter");
                      const kioskCoord = e.dataTransfer.getData("kiosk");

                      if (kioskCoord) {
                        handleKioskDrop(row, col, kioskCoord);
                      } else if (counterName) {
                        handleDrop(row, col, counterName);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {isKiosk ? (
                      <div
                        className="kiosk"
                        draggable={editMode}
                        onDragStart={(e) => e.dataTransfer.setData("kiosk", coord)}
                      >
                        키오스크
                      </div>
                    ) : (
                      currentCounters[coord] && (
                        <div
                          className="counter"
                          style={{ backgroundColor: getTaskColor(coord) }} // 배경색 설정
                          draggable={editMode}
                          onDragStart={(e) =>
                            e.dataTransfer.setData("counter", currentCounters[coord])
                          }
                          onClick={() => handleCounterClick(coord)}
                        >
                          {editMode && selectedCounter === coord && isEditing ? (
                            <>
                              {/* 창구 이름을 텍스트 박스로 표시 */}
                              <input
                                type="text"
                                value={newCounterName.split(",")[0].substring(3)}
                                onChange={handleNameChange}
                                placeholder={newCounterName.split(",")[0]}
                                style={{
                                  width: "80px", // 너비 조정
                                  fontSize: "12px", // 글자 크기 조정
                                  padding: "2px", // 안쪽 여백 조정
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />

                              {/* 업무 종류를 셀렉트 박스로 표시 */}
                              <select
                                value={selectedBtn}
                                onChange={handleTaskSelectChange}
                                style={{
                                  width: "80px", // 너비 조정
                                  fontSize: "12px", // 글자 크기 조정
                                  padding: "2px", // 안쪽 여백 조정
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {btnList.map((task) => (
                                  <option key={task.dept_id} value={task.work_dvcd_nm}>
                                    {task.work_dvcd_nm}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <>
                              {/* 창구 이름과 업무 종류 표시 */}
                              <div>{currentCounters[coord].split(",")[0]}</div>
                              <div style={{ fontSize: "bigger", color: "gray" }}>
                                {currentCounters[coord].split(",")[2]}
                              </div>
                              {/* 상담 중 표시 */}
                              {counselSessions[currentCounters[coord].split(",")[1]] && (
                                <div style={{ fontSize: "smaller", color: "red" }}>상담 중</div>
                              )}
                            </>
                          )}
                          {editMode && selectedCounter === coord && (
                            <div className="counter-actions">
                              {isEditing ? (
                                <>
                                  <button onClick={handleSave}>저장</button>
                                  <button onClick={handleCancel}>취소</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={(e) => handleUpdateCounter(coord, e)}>
                                    수정
                                  </button>
                                  <button onClick={(e) => handleDeleteCounter(coord, e)}>
                                    삭제
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {!editMode && selectedCounter === coord && (
                            <div className="counter-actions">
                              <button onClick={(e) => handleStart(coord, e)}>시작</button>
                              <button onClick={(e) => handleEnd(coord, e)}>종료</button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
          {/* 층 목록 - 중앙 정렬 */}
          <div
            className="floor-container"
            style={{
              display: "flex",
              justifyContent: "center",
              width: "90%", // 화면 너비의 90%
              height: "10%", // 화면 높이의 10%
              backgroundColor: "#f8f8f8",
            }}
          >
            {floors.map((floor) => (
              <div key={floor} className="floor-item" style={{ margin: "0 5px" }}>
                <button onClick={() => setCurrentFloor(floor)} className="floor-button">
                  {floor}층
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BankLayout;
