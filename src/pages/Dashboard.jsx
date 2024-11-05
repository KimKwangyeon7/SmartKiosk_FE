import React, { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  getAvgCsnlTime,
  getAvgByDay,
  getAvgByPeriod,
  getWorkPercentage,
  getCntByTime,
  getWicketPercentage,
  getAvgWaitTime,
} from "../api/statisticsApi";
import { logoutUser } from "../api/userApi";
import "./Dashboard.css";
import { Cookies } from "react-cookie";
import { Link, useNavigate } from "react-router-dom";
import { useIdleTimer } from "react-idle-timer";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const deptNm = "강남지점";

const Dashboard = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();

  // Remaining time state and idle timer setup
  const [remaining, setRemaining] = useState(null);
  const { getRemainingTime, reset } = useIdleTimer({
    timeout: 300000, // 1 hour
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
    const interval = setInterval(() => {
      setRemaining(getRemainingTime());
    }, 500);
    return () => clearInterval(interval);
  }, [getRemainingTime]);

  const handleLogout = async () => {
    try {
      await logoutUser(); // 로그아웃 API 호출
      localStorage.clear();
      // 기존 토큰 삭제
      cookies.remove("accessToken");
      navigate("/");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      // 필요에 따라 사용자에게 오류 메시지를 표시할 수 있음
    }
  };

  //------------------------------------------------
  // 1. 평균 상담 시간
  const [data, setData] = useState({
    labels: [],
    datasets: [
      {
        label: deptNm + " 평균 상담 시간 (분)",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        barThickness: 40,
      },
      {
        label: "전국 평균 상담 시간 (분)",
        data: [],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        barThickness: 40,
      },
    ],
  });
  // -------------------------------------------------------------
  // 2. 요일별 고객 수
  const daysOrder = ["월", "화", "수", "목", "금", "토", "일"];
  const [lineData, setLineData] = useState({
    labels: daysOrder,
    datasets: [
      {
        label: deptNm + " 요일별 평균 고객 수",
        data: [],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        fill: false,
      },
      {
        label: deptNm + "전국 요일별 평균 고객 수",
        data: [],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        fill: false,
      },
    ],
  });
  // ----------------------------------------------------------------------------
  // 3. 분기별 고객수
  const [year, setYear] = useState(new Date().getFullYear()); // 기본값을 현재 연도로 설정
  const [periodData, setPeriodData] = useState({
    labels: ["1분기", "2분기", "3분기", "4분기"],
    datasets: [],
  });
  //------------------------------------------------------------------------------
  // 4. 업무 비율
  const [workData, setWorkData] = useState({
    labels: [],
    datasets: [
      {
        label: `${deptNm} 업무별 비율`,
        data: [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
      },
    ],
  });
  // ----------------------------------------------------------------
  // 5. 시간대별 고객 수
  const [timeData, setTimeData] = useState({
    labels: [],
    datasets: [
      {
        label: `${deptNm} 시간대별 고객 수`,
        data: [],
        backgroundColor: ["rgba(75, 192, 192, 0.6)"],
      },
    ],
  });

  //------------------------------------------------------------------------------
  // 6. 창구 비율
  const [wicketData, setWicketData] = useState({
    labels: [],
    datasets: [
      {
        label: `${deptNm} 업무별 비율`,
        data: [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
      },
    ],
  });

  //------------------------------------------------
  // 7. 평균 대기 시간
  const [waitData, setWaitData] = useState({
    labels: [],
    datasets: [
      {
        label: deptNm + " 평균 대기 시간 (분)",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        barThickness: 40,
      },
      {
        label: "전국 평균 대기 시간 (분)",
        data: [],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        barThickness: 40,
      },
    ],
  });

  useEffect(() => {
    // ----------------------------------------------------------------
    // 1.
    const fetchData = async () => {
      try {
        const response = await getAvgCsnlTime(deptNm);
        //console.log(response.dataBody);
        const labels = Object.keys(response.dataBody.myAvg);
        const localDeptData = Object.values(response.dataBody.myAvg);
        const otherDeptData = Object.values(response.dataBody.otherAvg);

        setData({
          labels,
          datasets: [
            {
              label: deptNm + " 평균 상담 시간 (분)",
              data: localDeptData,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              barThickness: 40,
            },
            {
              label: "전국 평균 상담 시간 (분)",
              data: otherDeptData,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              barThickness: 40,
            },
          ],
        });
      } catch (error) {
        console.error(error);
      }
    };

    // ----------------------------------------------------------------
    // 2.
    const fetchLineData = async () => {
      try {
        const response = await getAvgByDay(deptNm);
        console.log(response.dataBody);
        const myFetchedData = response.dataBody.myAvg;
        const otherFetchedData = response.dataBody.otherAvg;

        const mySortedData = daysOrder.map((day) => myFetchedData[day] || 0);
        const otherSortedData = daysOrder.map((day) => otherFetchedData[day] || 0);

        setLineData({
          labels: daysOrder,
          datasets: [
            {
              label: deptNm + " 요일별 평균 고객 수",
              data: mySortedData,
              backgroundColor: "rgba(153, 102, 255, 0.6)",
              borderColor: "rgba(153, 102, 255, 1)",
              fill: false,
            },
            {
              label: "전국 요일별 평균 고객 수",
              data: otherSortedData,
              backgroundColor: "rgba(153, 102, 255, 0.6)",
              borderColor: "rgba(255, 99, 132, 0.6)",
              fill: false,
            },
          ],
        });
      } catch (error) {
        console.error(error);
      }
    };

    // ----------------------------------------------------------------
    // 3.
    const fetchPeriodData = async () => {
      try {
        const response = await getAvgByPeriod({ deptNm, year });
        console.log(response);

        // API 응답 데이터에서 업무별로 분기 데이터를 동적으로 추출
        const newDatasets = Object.entries(response.dataBody).map(([workType, data], index) => ({
          label: `${deptNm} ${workType}`,
          data: Object.values(data), // 각 분기의 평균 고객 수 데이터
          borderColor: `rgba(${(index * 50) % 255}, ${(index * 80) % 255}, ${
            (index * 120) % 255
          }, 1)`,
          backgroundColor: `rgba(${(index * 50) % 255}, ${(index * 80) % 255}, ${
            (index * 120) % 255
          }, 0.2)`,
          tension: 0.3,
        }));

        setPeriodData({
          labels: ["1분기", "2분기", "3분기", "4분기"],
          datasets: newDatasets,
        });
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    // ----------------------------------------------------------------
    // 4.
    const fetchWorkPercentage = async () => {
      try {
        const response = await getWorkPercentage(deptNm);
        console.log(response);

        // API 응답에서 업무명과 비율 데이터를 추출
        const labels = Object.keys(response.dataBody);
        const data = Object.values(response.dataBody);

        setWorkData({
          labels,
          datasets: [
            {
              label: `${deptNm} 업무별 비율`,
              data,
              backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ],
            },
          ],
        });
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    // ----------------------------------------------------
    // 5.
    const fetchTimeData = async () => {
      try {
        const response = await getCntByTime(deptNm);
        console.log(response.dataBody);

        // API 응답에서 업무명과 비율 데이터를 추출
        const labels = Object.keys(response.dataBody);
        const data = Object.values(response.dataBody);

        setTimeData({
          labels,
          datasets: [
            {
              label: `${deptNm} 업무별 비율`,
              data,
              backgroundColor: ["rgba(255, 99, 132, 0.6)"],
            },
          ],
        });
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    // ------------------------------------------------------
    // 6.
    const fetchWicketPercentage = async () => {
      try {
        const response = await getWicketPercentage(deptNm);
        console.log("창구비율");
        console.log(response.dataBody);

        // API 응답에서 업무명과 비율 데이터를 추출
        const labels = Object.keys(response.dataBody);
        const data = Object.values(response.dataBody);

        setWicketData({
          labels,
          datasets: [
            {
              label: `${deptNm} 창구 비율`,
              data,
              backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ],
            },
          ],
        });
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    // ----------------------------------------------------------------
    // 6.
    const fetchWaitData = async () => {
      try {
        const response = await getAvgWaitTime(deptNm);
        //console.log(response.dataBody);
        const labels = Object.keys(response.dataBody.myAvg);
        const localDeptData = Object.values(response.dataBody.myAvg);
        const otherDeptData = Object.values(response.dataBody.otherAvg);

        setWaitData({
          labels,
          datasets: [
            {
              label: deptNm + " 평균 대기 시간 (분)",
              data: localDeptData,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              barThickness: 40,
            },
            {
              label: "전국 평균 대기 시간 (분)",
              data: otherDeptData,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              barThickness: 40,
            },
          ],
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
    fetchLineData();
    fetchPeriodData();
    fetchWorkPercentage();
    fetchTimeData();
    fetchWicketPercentage();
    fetchWaitData();
  }, [year]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "업무별 평균 상담 시간 비교" },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "요일별 평균 고객 수" },
    },
  };

  const periodOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `${year}년 ${deptNm} 분기별 평균 고객 수` },
    },
  };

  const workPercentageOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `${deptNm} 업무별 비율` },
    },
  };

  const timeDataOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `${deptNm} 시간대별 고객 수` },
    },
  };

  const wicketPercentageOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `${deptNm} 창구 비율` },
    },
  };

  const waitOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "업무별 평균 대기 시간 비교" },
    },
  };

  return (
    <div className="dashboard">
      {/* 자동 로그아웃 기능 */}
      <div className="session-control">
        <span>남은 시간: {millisToMinutesAndSeconds(remaining)}</span>
      </div>

      {/* Navbar */}
      <div className="navbar">
        <Link to="/">
          <img className="logo" src={require("../assets/logo.svg").default} alt="iM 뱅크" />
        </Link>
        <ul className="navbar-menu">
          <li>
            <Link to="#" onClick={handleLogout}>
              로그아웃
            </Link>
          </li>
        </ul>
      </div>

      <div className="bar-data">
        <Bar data={data} options={options} />
      </div>
      <div className="wait-data">
        <Bar data={waitData} options={waitOptions} />
      </div>
      <div className="line-data">
        <Line data={lineData} options={lineOptions} />
      </div>
      <div className="period-data">
        <div>
          <label>연도 선택: </label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {[2021, 2022, 2023, 2024].map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
        <Line data={periodData} options={periodOptions} />
      </div>
      <div className="work-data">
        <Pie data={workData} options={workPercentageOptions} />
      </div>
      <div className="time-data">
        <Line data={timeData} options={timeDataOptions} />
      </div>
      <div className="wicket-data">
        <Pie data={wicketData} options={wicketPercentageOptions} />
      </div>
    </div>
  );
};

export default Dashboard;
