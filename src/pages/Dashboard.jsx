import React, { useEffect, useState, useRef } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  getAvgCsnlTime,
  getAvgByDay,
  getAvgByPeriod,
  getWorkPercentage,
  getCntByTime,
  getWicketPercentage,
  getAvgWaitTime,
  getYearCnt,
  getMonthCnt,
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

const deptNm = "강남";
const colors = {
  상담시간: "rgba(75, 192, 192, 0.6)",
  대기시간: "rgba(255, 99, 132, 0.6)",
  창구비율: [
    "rgba(255, 99, 132, 0.6)",
    "rgba(54, 162, 235, 0.6)",
    "rgba(255, 206, 86, 0.6)",
    "rgba(75, 192, 192, 0.6)",
    "rgba(153, 102, 255, 0.6)",
    "rgba(255, 159, 64, 0.6)",
  ],
  고객비율: [
    "rgba(255, 99, 132, 0.6)",
    "rgba(54, 162, 235, 0.6)",
    "rgba(255, 206, 86, 0.6)",
    "rgba(75, 192, 192, 0.6)",
    "rgba(153, 102, 255, 0.6)",
    "rgba(255, 159, 64, 0.6)",
  ],
  시간대: "rgba(153, 102, 255, 0.6)",
  요일: "rgba(255, 205, 86, 0.6)",
  연도별: "rgba(54, 162, 235, 0.6)",
  분기별: "rgba(75, 192, 192, 0.6)",
  월별: "rgba(255, 99, 132, 0.6)",
};
const Dashboard = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();

  // 각 섹션의 ref
  // 각 그래프의 ref
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);
  const section5Ref = useRef(null);

  // 특정 섹션으로 스크롤하는 함수
  const scrollToSection = (sectionRef) => {
    sectionRef.current.scrollIntoView({ behavior: "smooth" });
  };

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
  const daysOrder = ["월", "화", "수", "목", "금", "토"];
  const [lineData, setLineData] = useState({
    labels: daysOrder,
    datasets: [
      {
        label: deptNm + " 지점 요일별 평균 고객 수",
        data: [],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        fill: false,
      },
      {
        label: "전국 요일별 평균 고객 수",
        data: [],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        fill: false,
      },
    ],
  });
  // ----------------------------------------------------------------------------
  // 3. 분기별 고객수
  // 기본 설정: 현재 연도와 업무 종류
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedTask, setSelectedTask] = useState("");
  const [periodData, setPeriodData] = useState({
    labels: ["1분기", "2분기", "3분기", "4분기"],
    datasets: [],
  });
  const [taskList, setTaskList] = useState([]);
  //------------------------------------------------------------------------------
  // 4. 업무 비율
  const [workData, setWorkData] = useState({
    labels: [],
    datasets: [
      {
        label: `${deptNm} 지점 업무별 비율`,
        data: [],
        backgroundColor: colors.고객비율,
      },
    ],
  });
  // ----------------------------------------------------------------
  // 5. 시간대별 고객 수
  const [timeData, setTimeData] = useState({
    labels: [],
    datasets: [
      {
        label: `${deptNm} 지점 시간대별 고객 수`,
        data: [],
        backgroundColor: colors.시간대,
      },
    ],
  });

  //------------------------------------------------------------------------------
  // 6. 창구 비율
  const [wicketData, setWicketData] = useState({
    labels: [],
    datasets: [
      {
        label: `${deptNm} 지점 업무별 비율`,
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
        label: deptNm + " 지점 평균 대기 시간 (분)",
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
  //-------------------------------------------------------------------
  //최근 5년 고객 수 해당지점, 전국
  const [chosenTask, setChosenTask] = useState("");
  const [list, setList] = useState([]);
  const [yearData, setYearData] = useState({
    labels: [],
    datasets: [],
  });

  // -------------------------------------------------------------------
  // 특장 달의 업무별 고객 수
  const [nowYear, setNowYear] = useState(new Date().getFullYear());
  const [nowMonth, setNowMonth] = useState(new Date().getMonth());

  const [selectedWork, setSelectedWork] = useState("");
  const [monthData, setMonthData] = useState({
    labels: [],
    datasets: [],
  });
  const [workList, setWorkList] = useState([]);

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
              label: deptNm + " 지점 평균 상담 시간 (분)",
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
        //console.log(response.dataBody);
        const myFetchedData = response.dataBody.myAvg;
        const otherFetchedData = response.dataBody.otherAvg;

        const mySortedData = daysOrder.map((day) => myFetchedData[day] || 0);
        const otherSortedData = daysOrder.map((day) => otherFetchedData[day] || 0);

        setLineData({
          labels: daysOrder,
          datasets: [
            {
              label: deptNm + " 지점 요일별 평균 고객 수",
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
    // 데이터 가져오기 함수
    const fetchPeriodData = async () => {
      try {
        const response = await getAvgByPeriod({ deptNm, year });
        //console.log(response);

        // 업무 종류 목록을 동적으로 설정
        const tasks = Object.keys(response.dataBody.my);
        setTaskList(tasks);

        // 선택된 업무가 없을 때, 첫 번째 업무를 기본 선택
        if (!selectedTask && tasks.length > 0) {
          setSelectedTask(tasks[0]);
        }

        // 선택된 업무 데이터 가져오기
        const myData = response.dataBody.my[selectedTask] || [];
        const otherData = response.dataBody.other[selectedTask] || [];

        // 그래프 데이터셋 구성
        const myDataset = {
          label: `${deptNm} 지점 ${selectedTask}`,
          data: Object.values(myData),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
        };

        const otherDataset = {
          label: `전국 지점 ${selectedTask}`,
          data: Object.values(otherData),
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.3,
        };

        setPeriodData({
          labels: ["1분기", "2분기", "3분기", "4분기"],
          datasets: [myDataset, otherDataset],
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
        //console.log(response);

        // API 응답에서 업무명과 비율 데이터를 추출
        const labels = Object.keys(response.dataBody);
        const data = Object.values(response.dataBody);

        setWorkData({
          labels,
          datasets: [
            {
              label: `${deptNm} 지점 업무별 비율`,
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
        //console.log(response.dataBody);

        // API 응답에서 업무명과 비율 데이터를 추출
        const labels = Object.keys(response.dataBody);
        const data = Object.values(response.dataBody);

        setTimeData({
          labels,
          datasets: [
            {
              label: `${deptNm} 지점 시간대별 비율`,
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
        //console.log("창구비율");
        //console.log(response.dataBody);

        // API 응답에서 업무명과 비율 데이터를 추출
        const labels = Object.keys(response.dataBody);
        const data = Object.values(response.dataBody);

        setWicketData({
          labels,
          datasets: [
            {
              label: `${deptNm} 지점 창구 비율`,
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
              label: deptNm + " 지점 평균 대기 시간 (분)",
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
    //-------------------------------------------------------------------------
    // 최근 5년 총 고객 수.
    const fetchYearData = async () => {
      const response = await getYearCnt(deptNm);
      //console.log(response.dataBody);

      const list = Object.keys(response.dataBody.my);
      setList(list);

      const myData = response?.dataBody?.my?.[chosenTask] || {}; // `my` 데이터가 없으면 빈 객체로 대체
      const otherData = response?.dataBody?.other?.[chosenTask] || {}; // `other` 데이터가 없으면 빈 객체로 대체

      const lb = Object.keys(myData); // `myData`의 키 사용
      const myYearData = Object.values(myData); // `myData`의 값 사용
      const otherYearData = Object.values(otherData); // `otherData`의 값 사용

      // 그래프 데이터셋 구성
      try {
        const myYearDataset = {
          label: `${deptNm} ${chosenTask}`,
          data: Object.values(myYearData || {}), // 데이터가 null 또는 undefined일 경우 빈 객체로 대체
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
        };

        const otherYearDataset = {
          label: `전국 ${chosenTask}`,
          data: Object.values(otherYearData || {}), // 데이터가 null 또는 undefined일 경우 빈 객체로 대체
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.3,
        };

        setYearData({
          labels: lb || [], // lb가 undefined일 경우 빈 배열로 대체
          datasets: [myYearDataset, otherYearDataset],
        });
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    // --------------------------------------------------------------------------
    const fetchMonthData = async () => {
      try {
        const date = "" + nowYear + nowMonth;
        //console.log(date);
        const response = await getMonthCnt({ deptNm, date });
        //console.log(response.dataBody);

        const works = Object.keys(response.dataBody);
        setWorkList(works);

        // 선택된 업무가 없을 때, 첫 번째 업무를 기본 선택
        if (!selectedWork && works.length > 0) {
          setSelectedWork(works[0]);
        }

        const dataForSelectedWork = response?.dataBody?.[selectedWork] || {}; // 선택된 업무의 데이터가 없을 경우 빈 객체로 대체
        const len = Object.keys(dataForSelectedWork).length;

        const label = Array.from({ length: len }, (_, i) => i + 1); // 1부터 len까지의 숫자 배열 생성
        //console.log(label);
        const myMonthData = Object.values(response?.dataBody?.[selectedWork] || {});

        // 그래프 데이터셋 구성
        const myMonthDataset = {
          label: `${deptNm} 지점 ${selectedWork}`,
          data: Object.values(myMonthData),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
        };

        setMonthData({
          labels: label,
          datasets: [myMonthDataset],
        });
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
      }
    };

    fetchData();
    fetchLineData();
    fetchPeriodData();
    fetchWorkPercentage();
    fetchTimeData();
    fetchWicketPercentage();
    fetchWaitData();
    fetchYearData();
    fetchMonthData();
  }, [year, selectedTask, chosenTask, selectedWork, nowYear, nowMonth]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "업무별 평균 상담 시간",
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "요일별 평균 고객 수",
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 25,
        ticks: {
          stepSize: 2,
        },
      },
    },
  };
  const periodOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        // text: `${year}년 분기별 고객 수 (${selectedTask})`,
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 20,
        ticks: {
          stepSize: 2,
        },
      },
    },
  };

  const workPercentageOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `${deptNm} 업무별 비율`,
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
  };

  const timeDataOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `${deptNm} 시간대별 고객 수`,
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
  };

  const wicketPercentageOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `${deptNm} 창구 비율`,
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
  };

  const waitOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "업무별 평균 대기 시간",
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
  };

  const yearOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        // text: `최근 5년 ${deptNm} 지점 총 고객 수 (${chosenTask})`,
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 20,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const monthOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        // text: `${nowYear}년 ${nowMonth}월 ${deptNm} 지점 고객 수 (${selectedWork})`,
        font: {
          size: 24, // 원하는 크기로 설정 (예: 24)
          weight: "bold", // 글꼴 두께 조정 (옵션)
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0, // y축의 최소값 설정
        max: 10, // 필요한 경우 적절한 최대값을 설정 (값에 따라 조정)
        ticks: {
          stepSize: 2, // y축 간격 설정
        },
      },
    },
  };

  const renderTaskButtons = () =>
    taskList.map((task) => (
      <button
        key={task}
        onClick={() => setSelectedTask(task)}
        style={{ fontWeight: selectedTask === task ? "bold" : "normal", fontSize: "lighter" }}
      >
        {task}
      </button>
    ));

  const renderYearButtons = () => (
    <select
      className="small-select"
      value={chosenTask}
      onChange={(e) => setChosenTask(e.target.value)}
    >
      {list.map((tmp) => (
        <option key={tmp} value={tmp}>
          {tmp}
        </option>
      ))}
    </select>
  );
  const memberInfo = JSON.parse(localStorage.getItem("memberInfo") || "{}");
  const renderMonthButtons = () =>
    workList.map((work) => (
      <button
        key={work}
        onClick={() => setSelectedWork(work)}
        style={{ fontWeight: selectedWork === work ? "bold" : "normal" }}
      >
        {work}
      </button>
    ));
  return (
    <div className="dashboard">
      {/* 자동 로그아웃 기능 */}
      <div className="navbar">
        <Link to="/">
          <img className="logo" src={require("../assets/logo.svg").default} alt="iM 뱅크" />
        </Link>
        <ul className="navbar-menu">
          <li>{memberInfo.name ? `${memberInfo.name}님 환영합니다!` : ""}</li>
          <li>남은 시간: {millisToMinutesAndSeconds(remaining)}</li>
          <li onClick={handleLogout}>로그아웃</li>
        </ul>
      </div>

      {/* 오른쪽 하단 고정된 목차 */}
      <div className="floating-toc">
        <ul>
          <li onClick={() => scrollToSection(section1Ref)}>상담 및 대기 시간</li>
          <li onClick={() => scrollToSection(section2Ref)}>창구 및 고객 비율</li>
          <li onClick={() => scrollToSection(section3Ref)}>연도, 분기별 고객 수</li>
          <li onClick={() => scrollToSection(section4Ref)}>요일, 시간대별 고객 수</li>
          <li onClick={() => scrollToSection(section5Ref)}>상세 분석</li>
        </ul>
      </div>

      {/* Section 1: 상담 및 대기 시간 */}
      <div className="section-container">
        <div ref={section1Ref} className="section">
          <h2>상담 및 대기 시간 분석</h2>
          <p>
            업무별 평균 상담 시간과 평균 대기 시간을 비교하여 고객 한 명당 소요 시간을 예측합니다.
          </p>
          <div className="subsection">
            {/* <h3>업무별 평균 상담 시간</h3> */}
            <Bar data={data} options={options} />
          </div>
          <hr className="chart-divider" />
          <div className="subsection">
            {/* <h3>업무별 평균 대기 시간</h3> */}
            <Bar data={waitData} options={waitOptions} />
          </div>
        </div>
      </div>

      {/* Section 2: 창구 및 고객 비율 */}
      <div className="section-container">
        <div ref={section2Ref} className="section">
          <h2>창구 및 고객 비율</h2>
          <p>각 업무의 창구 비율과 고객 비율을 파악하여 자원 배분을 최적화합니다.</p>
          <div className="subsection pie-charts-container">
            <div className="chart-container">
              {/* <h3>업무별 창구 비율</h3> */}
              <Pie data={wicketData} options={wicketPercentageOptions} />
            </div>
            <hr className="chart-divider" />
            <div className="chart-container">
              {/* <h3>업무별 고객 비율</h3> */}
              <Pie data={workData} options={workPercentageOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="section-container">
        {/* 연도별 고객 수 섹션 */}
        <div ref={section3Ref} className="section">
          <h2>연도, 분기별 총 고객 수 분석</h2>
          <p>연도별, 분기별 고객 수 추이 분석을 통해 고객 수 변동을 파악합니다.</p>
          <div className="subsection">
            <div className="title-bar">
              <h2 className="chart-title">
                최근 5년 {deptNm} 지점 총 고객 수 ({chosenTask})
              </h2>
              <div className="select-container">{renderYearButtons()}</div>
            </div>
            <Bar data={yearData} options={yearOptions} />
          </div>
          <hr className="chart-divider" />
          <div className="subsection">
            <div className="title-bar">
              <h2 className="chart-title">분기별 고객 수 분석</h2>
              <div className="select-container">
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  {[2021, 2022, 2023, 2024].map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
                <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                  {taskList.map((task) => (
                    <option key={task} value={task}>
                      {task}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Line data={periodData} options={periodOptions} />
          </div>
        </div>
      </div>
      <div className="section-container">
        <div ref={section4Ref} className="section">
          <h2>시간대, 요일별 고객 분포 분석</h2>
          <p>시간대와 요일별 고객 수를 파악하여 고객 방문 패턴을 분석합니다.</p>
          <div className="subsection">
            {/* <h3>시간대별 고객 수</h3> */}
            <Line data={timeData} options={timeDataOptions} />
          </div>
          <hr className="chart-divider" />
          <div className="subsection">
            {/* <h3>요일별 고객 수</h3> */}
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>

      <div className="section-container">
        {/* Section 5: 월별 고객 수 - 상세 분석 */}
        <div ref={section5Ref} className="section">
          <h2>상세 분석</h2>
          <p>특정 연도와 월을 선택하여 해당 달의 업무별 고객 수를 상세히 분석합니다.</p>
          <div className="sub-section">
            <h2 className="chart-title">월별 고객 수 분석</h2>
            {/* 셀렉트 박스 3개를 배치하는 컨테이너 */}
            <div className="select-content">
              <select value={nowYear} onChange={(e) => setNowYear(e.target.value)}>
                {[2021, 2022, 2023, 2024].map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
              <select value={nowMonth} onChange={(e) => setNowMonth(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
              <select value={selectedWork} onChange={(e) => setSelectedWork(e.target.value)}>
                {taskList.map((task) => (
                  <option key={task} value={task}>
                    {task}
                  </option>
                ))}
              </select>
            </div>
            <Line data={monthData} options={monthOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
