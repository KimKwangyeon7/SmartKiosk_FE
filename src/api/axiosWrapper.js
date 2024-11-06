import axios from "axios";
import { Cookies } from "react-cookie";
import Swal from "sweetalert2";

const { REACT_APP_API_URL } = process.env;

// Axios 인스턴스 생성 함수
const createAxiosInstance = (baseURL) => {
  const cookies = new Cookies();

  const instance = axios.create({
    withCredentials: true,
    baseURL: baseURL || "",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });

  // 요청 인터셉터 설정
  instance.interceptors.request.use(
    (config) => {
      const accessToken = cookies.get("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  //   // 응답 인터셉터 설정
  //   instance.interceptors.response.use(
  //     (response) => {
  //       return response;
  //     },
  //     (error) => {
  //       // 401 에러 처리: 세션 종료 및 로그아웃 처리
  //       if (error.response?.status === 401 || error.response?.status === 403) {
  //         handleLogout();
  //       }
  //       return Promise.reject(error);
  //     }
  //   );

  //   return instance;
  // };
  // // 로그아웃 처리 함수
  // const handleLogout = () => {
  //   const cookies = new Cookies();
  //   cookies.remove("accessToken"); // 쿠키에서 accessToken 제거
  //   localStorage.clear(); // 세션 스토리지 클리어

  //   Swal.fire("세션이 만료되었습니다.", "다시 로그인 해주세요.", "info").then(() => {
  //     window.location.reload();
  //   });
};

// 설정된 API URL을 사용하는 Axios 인스턴스
const axiosWrapper = createAxiosInstance(REACT_APP_API_URL);

export { axiosWrapper };
