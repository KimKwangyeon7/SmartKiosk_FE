import React, { useState, useEffect } from "react";
import "./BankLayout.css";
import {
  getWicketInfoList,
  sendUpdatedWicketInfoList,
  createWicket,
  deleteWicket,
  updateWicket,
} from "../api/wicketApi";
import { getTicketInfoList } from "../api/ticketApi";

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
  const [refresh, setRefresh] = useState(1);

  const fetchData = async () => {
    try {
      const res = await getWicketInfoList(deptNm);
      const data = res.dataBody;
      console.log(data);
      setFloors(data.floors);
      setCounters(data.layouts.wicketInfo);
      setKiosks(data.kiosks.kioskInfo);
      setCurrentFloor(data.floors[0]);
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
    fetchData();
    getWorkList();
  }, []);

  const currentCounters = counters[currentFloor] || {};
  console.log(currentCounters);
  const currentKiosks = kiosks[currentFloor] || [];
  const gridSize = 6;

  const handleDrop = (x, y, counterName) => {
    setCounters((prev) => {
      // 기존 상태 복사
      const updatedFloorCounters = { ...prev[currentFloor] };
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
            { counterName: fullCounterName, from: fromCoord, to: `${x},${y}` }, // 전체 이름을 사용
          ],
        }));
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

      return updatedKiosks;
    });
  };

  const sendChangesToServer = async (changes) => {
    try {
      const response = await sendUpdatedWicketInfoList(changes);
      console.log("변경사항 전송 성공!");
    } catch (error) {
      console.error("변경사항 전송 실패: ", error);
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
      console.log("변경된 창구 및 키오스크 정보:", changes);
      sendChangesToServer(changes);
    }
    setEditMode(!editMode);
  };

  const handleAddCounter = async () => {
    const newCounterName = `창구 `; // 기본 창구 이름
    const initialPosition = `0,0`;

    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor], [initialPosition]: newCounterName };
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
    console.log(counters);

    // 새로운 창구를 추가 후, 이름 편집 모드 활성화
    setEditingCounter(initialPosition);
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

  const getTaskColor = (coord) => {
    const task = currentCounters[coord].split(",")[2];
    switch (task) {
      case "일반업무":
        return "task-default"; // 기본 색상
      case "상담업무":
        return "task-consultation"; // 상담 색상
      case "대출업무":
        return "task-service"; // 서비스 색상
      default:
        return "task-default"; // 기본 색상
    }
  };

  // 수정 버튼 클릭 후 입력 모드로 전환
  const handleUpdateCounter = (coord) => {
    setSelectedCounter(coord);
    console.log(currentCounters[coord]);
    setNewCounterName(currentCounters[coord].split(",")[0]); // 이름만 수정 가능
    setSelectedBtn(currentCounters[coord].split(",")[2]);
    setIsEditing(true);
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
    const res = updateWicket(code);
    setIsEditing(false);
  };

  // 취소 버튼 클릭
  const handleCancel = () => {
    setIsEditing(false);
  };

  // 창구 클릭 시 수정, 삭제 버튼 표시
  const handleCounterClick = (coord) => {
    if (editMode) {
      setSelectedCounter(coord);
    }
  };

  const handleDeleteCounter = (coord) => {
    const wdId = counters[currentFloor][coord].split(",")[1];
    deleteWicket(wdId); // DB에서 창구 삭제

    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      delete updatedFloorCounters[coord]; // 선택한 좌표에서 창구 삭제

      // 상태 업데이트가 끝난 후, 최신 상태를 리턴
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });

    // 상태 초기화
    setSelectedCounter(null);
    setIsEditing(false);
    setEditMode(false); // 상태 변경
    setNewCounterName("");
    setEditingCounter(null);

    // 상태 업데이트 이후 console.log는 useEffect 등으로 따로 처리
    console.log(counters); // 주의: 이 시점에서 console.log는 이전 상태일 수 있음
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
    <div>
      <div>
        {floors.map((floor) => (
          <button key={floor} onClick={() => setCurrentFloor(floor)}>
            {floor}층
          </button>
        ))}
      </div>
      {currentFloor && (
        <>
          <h3>{currentFloor}층 창구 배치도</h3>
          <button onClick={toggleEditMode}>{editMode ? "완료" : "편집"}</button>
          <div>
            {editingCounter === null && <button onClick={handleAddCounter}>창구 생성</button>}
            {editingCounter !== null && <button onClick={addCounter}>저장</button>}
            {editingCounter !== null && <button onClick={cancelCreate}>취소</button>}
            {renderCounterNameInput()}
          </div>
          <div
            className="grid-container"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
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
                      console.log(counterName);
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
                          className={`counter ${getTaskColor(coord)}`} // task 색상 클래스 적용
                          draggable={editMode}
                          onDragStart={(e) =>
                            e.dataTransfer.setData("counter", currentCounters[coord])
                          }
                          onClick={() => handleCounterClick(coord)}
                        >
                          {currentCounters[coord].split(",")[0]}
                          {editMode && selectedCounter === coord && (
                            <div className="counter-actions">
                              {editMode && selectedCounter === coord && isEditing && (
                                <>
                                  <input
                                    type="text"
                                    value={newCounterName.split(",")[0].substring(3)}
                                    onChange={handleNameChange}
                                    placeholder="새 이름"
                                  />
                                  <select
                                    value={selectedBtn} // 선택된 업무 종류 표시
                                    onChange={handleTaskSelectChange}
                                  >
                                    {btnList.map((task) => (
                                      <option key={task.dept_id} value={task.work_dvcd_nm}>
                                        {task.work_dvcd_nm}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              )}

                              {editMode && selectedCounter === coord && !isEditing && (
                                <div className="counter-actions">
                                  <button onClick={() => handleUpdateCounter(coord)}>수정</button>
                                  <button onClick={() => handleDeleteCounter(coord)}>삭제</button>
                                </div>
                              )}
                              {editMode && selectedCounter === coord && isEditing && (
                                <div className="counter-actions">
                                  <button onClick={handleSave}>저장</button>
                                  <button onClick={handleCancel}>취소</button>
                                </div>
                              )}
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
        </>
      )}
    </div>
  );
};

export default BankLayout;
