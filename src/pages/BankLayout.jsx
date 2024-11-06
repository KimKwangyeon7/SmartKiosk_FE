import React, { useState, useEffect } from "react";
import "./BankLayout.css";
import Swal from "sweetalert2";
import { getWicketInfoList } from "../api/wicketApi";

// 임의의 초기 데이터
const initialData = {
  floors: [1, 2],
  layouts: {
    1: { "0,0": "창구 A", "1,2": "창구 B", "2,3": "창구 C", "3,1": "창구 D", "4,4": "창구 E" },
    2: { "0,1": "창구 F", "1,3": "창구 G", "2,2": "창구 H", "3,3": "창구 I", "4,0": "창구 J" },
  },
  kiosks: {
    1: ["5,1"], // 1층의 키오스크 위치 좌표
    2: [], // 2층에는 키오스크 없음
  },
};

const BankLayout = () => {
  const [floors, setFloors] = useState([]);
  const [counters, setCounters] = useState({});
  const [kiosks, setKiosks] = useState({});
  const [currentFloor, setCurrentFloor] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // 초기 데이터를 가져와 설정하는 함수
  const fetchData = async () => {
    const res = await getWicketInfoList("강남");
    console.log(res.dataBody);

    const data = await new Promise((resolve) => {
      setTimeout(() => resolve(initialData), 500); // 데이터 로딩 모의
    });

    setFloors(data.floors);
    setCounters(data.layouts);
    setKiosks(data.kiosks);
    setCurrentFloor(data.floors[0]); // 첫 번째 층을 기본으로 설정
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

  // 위치 변경 함수
  const handleDrop = (x, y, counterName) => {
    setCounters((prev) => {
      const updatedFloorCounters = { ...prev[currentFloor] };
      for (const key in updatedFloorCounters) {
        if (updatedFloorCounters[key] === counterName) {
          delete updatedFloorCounters[key];
          break;
        }
      }
      updatedFloorCounters[`${x},${y}`] = counterName;
      return { ...prev, [currentFloor]: updatedFloorCounters };
    });
  };

  // 키오스크 위치 변경 함수
  const handleKioskDrop = (x, y, kiosk) => {
    setKiosks((prev) => {
      const updatedKiosks = { ...prev };
      const currentKioskIndex = updatedKiosks[currentFloor].indexOf(kiosk);
      if (currentKioskIndex > -1) {
        updatedKiosks[currentFloor][currentKioskIndex] = `${x},${y}`;
      }
      return updatedKiosks;
    });
  };

  // 편집 모드 전환
  const toggleEditMode = () => setEditMode(!editMode);

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
                      if (currentFloor === 1 && isKiosk) {
                        handleKioskDrop(row, col, coord);
                      } else {
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
