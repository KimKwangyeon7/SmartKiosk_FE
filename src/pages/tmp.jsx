import React, { useState, useEffect } from "react";
import "./BankLayout.css";
import { getWicketInfoList, sendUpdatedWicketInfoList } from "../api/wicketApi";

const deptNm = "강남";

const BankLayout = () => {
  const [floors, setFloors] = useState([]);
  const [counters, setCounters] = useState({});
  const [kiosks, setKiosks] = useState({});
  const [currentFloor, setCurrentFloor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [changes, setChanges] = useState({ counters: [], kiosks: [] });

  // 초기 데이터를 가져와 설정하는 함수
  const fetchData = async () => {
    const res = await getWicketInfoList(deptNm);
    console.log(res.dataBody);

    const data = await new Promise((resolve) => {
      setTimeout(() => resolve(res.dataBody), 500); // 데이터 로딩 모의
    });

    setFloors(data.floors);
    setCounters(data.layouts.wicketInfo);
    setKiosks(data.kiosks.kioskInfo);
    setCurrentFloor(data.floors[0]); // 첫 번째 층을 기본으로 설정

    const detailArray = res.dataBody.detail; // "detail" 배열

    // detail 배열을 객체 배열로 변환
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

    // 변환된 데이터 콘솔 출력 (디버깅용)
    console.log(wicketInfoList);
  };

  // 컴포넌트가 마운트될 때 데이터 가져오기
  useEffect(() => {
    fetchData();
  }, []);

  // 현재 층의 창구 및 키오스크 데이터
  const currentCounters = counters[currentFloor] || {};
  const currentKiosks = kiosks[currentFloor] || [];

  // 그리드 크기 계산
  const gridSize = Object.keys(currentCounters).length + 1; // 창구 개수 + 1

  // 드래그하여 창구를 이동
  const handleDrop = (x, y, counterName) => {
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      let fromCoord = null;

      // 기존 좌표를 찾는 로직
      for (const key in updatedFloorCounters) {
        if (updatedFloorCounters[key] === counterName) {
          fromCoord = key; // 현재 위치를 저장
          delete updatedFloorCounters[key]; // 기존 위치 삭제
          break;
        }
      }

      // 새 좌표에 창구 추가
      updatedFloorCounters[`${x},${y}`] = counterName;

      // 상태 변화 저장 (from과 to 좌표를 다르게 설정)
      if (fromCoord) {
        setChanges((prevChanges) => ({
          ...prevChanges,
          counters: [
            ...prevChanges.counters,
            { counterName, from: fromCoord, to: `${x},${y}` }, // 실제 from과 to 좌표 기록
          ],
        }));
      }

      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
  };

  // 드래그하여 키오스크를 이동
  const handleKioskDrop = (x, y, prevCoord) => {
    setKiosks((prev) => {
      const updatedKiosks = { ...prev };

      // 키오스크 위치 변경
      const kiosksOnCurrentFloor = updatedKiosks[currentFloor].filter(
        (coord) => coord !== prevCoord // 이전 위치 삭제
      );
      kiosksOnCurrentFloor.push(`${x},${y}`); // 새 위치 추가

      updatedKiosks[currentFloor] = kiosksOnCurrentFloor;

      // 상태 변화 저장
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
      console.log("변경사항 전송 실패: ", error);
    }
  };

  // 편집 모드 전환
  const toggleEditMode = () => {
    if (editMode) {
      // 편집 모드 종료 시 변경 사항 저장
      console.log("변경된 창구 및 키오스크 정보:", changes);
      // 서버로 변경 사항 전송
      sendChangesToServer(changes);
    }
    setEditMode(!editMode); // 편집 모드 상태 전환
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
          <div
            className="grid-container"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {[...Array(gridSize)].map((_, row) =>
              [...Array(gridSize)].map((_, col) => {
                const coord = `${row},${col}`;
                const isKiosk = currentKiosks.includes(coord); // 키오스크 위치 확인
                return (
                  <div
                    key={coord}
                    className={`grid-item ${editMode ? "edit-mode" : ""}`}
                    onDrop={(e) => {
                      e.preventDefault();
                      const counterName = e.dataTransfer.getData("counter");
                      const kioskCoord = e.dataTransfer.getData("kiosk");

                      if (kioskCoord) {
                        // 키오스크 이동
                        handleKioskDrop(row, col, kioskCoord);
                      } else if (counterName) {
                        // 창구 이동
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
                        >
                          {currentCounters[coord]}
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
