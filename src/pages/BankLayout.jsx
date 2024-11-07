import React, { useState, useEffect } from "react";
import "./BankLayout.css";
import {
  getWicketInfoList,
  sendUpdatedWicketInfoList,
  createWicket,
  deleteWicket,
} from "../api/wicketApi";
import { async } from "q";

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

  const fetchData = async () => {
    try {
      const res = await getWicketInfoList(deptNm);
      const data = res.dataBody;
      setFloors(data.floors);
      setCounters(data.layouts.wicketInfo);
      setKiosks(data.kiosks.kioskInfo);
      setCurrentFloor(data.floors[0]);

      const detailArray = res.dataBody.detail;
      const wicketInfoList = detailArray.map((item) => {
        const [x, y, id, num, name, task] = item.split(" ");
        return {
          x: Number(x),
          y: Number(y),
          id: Number(id),
          num: Number(num),
          name: name,
          task: task,
        };
      });

      console.log(wicketInfoList);
    } catch (error) {
      console.error("데이터 가져오기 실패", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentCounters = counters[currentFloor] || {};
  const currentKiosks = kiosks[currentFloor] || [];
  const gridSize = Object.keys(currentCounters).length + 1;

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

  // const addCounter = (name, x, y) => {
  //   setCounters((prev) => ({
  //     ...prev,
  //     [currentFloor]: { ...prev[currentFloor], [`${x},${y}`]: name },
  //   }));
  // };

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
    const data = {
      deptNm: deptNm,
      wdDvcdNm: "일반업무",
      wdNum: newCounterName.split(" ")[1],
      wdFloor: currentFloor,
    };
    const res = await createWicket(data);
    console.log(res.dataBody);

    if (counters[currentFloor] && counters[currentFloor]["0,0"] !== undefined) {
      counters[currentFloor]["0,0"] = `${newCounterName}, ${res.dataBody}`; // 원하는 값을 넣으세요
    } else {
      console.log("해당 위치에 접근할 수 없습니다.");
    }
    setNewCounterName("");
    setEditingCounter(null);
  };

  const updateCounter = (coord, newName, newX, newY) => {
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      delete updatedFloorCounters[coord];
      updatedFloorCounters[`${newX},${newY}`] = newName;
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
  };

  const deleteCounter = (coord) => {
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      delete updatedFloorCounters[coord];
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
  };

  // 수정 버튼 클릭 후 입력 모드로 전환
  const handleUpdateCounter = (coord) => {
    setSelectedCounter(coord);
    console.lor(currentCounters[coord]);
    setNewCounterName(currentCounters[coord].split(",")[0]); // 이름만 수정 가능
    setIsEditing(true);
  };

  const handleSave = () => {
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      const currentId = currentCounters[selectedCounter].split(",")[1]; // 아이디 추출
      updatedFloorCounters[selectedCounter] = `창구 ${newCounterName},${currentId}`; // 수정된 이름과 아이디 결합
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
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

  const handleNameChange = (e) => {
    setNewCounterName(e.target.value);
  };

  const handleDeleteCounter = (coord) => {
    const wdId = counters[currentFloor][coord].split(",")[1];
    deleteWicket(wdId);
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      delete updatedFloorCounters[coord]; // 선택한 좌표에서 창구 삭제
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
    setSelectedCounter(null);
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
        <input
          type="text"
          value={counters[currentFloor][editingCounter] || ""}
          onChange={handleNameCreate}
        />
      );
    }
    return null;
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
                                <input
                                  type="text"
                                  value={newCounterName.split(",")[0].substring(3)}
                                  onChange={handleNameChange}
                                  placeholder="새 이름"
                                />
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
