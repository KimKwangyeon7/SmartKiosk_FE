import { axiosWrapper } from "./axiosWrapper";
import { Cookies } from "react-cookie";

// 일반 로그인
export const loginUser = async (data) => {
  return axiosWrapper
    .post("/member/login", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err); // 에러를 콘솔에 출력
      throw new Error("로그인 실패"); // 에러 발생 시 사용자에게 알림을 위해 에러 발생
    });
};

// 로그아웃
export const logoutUser = async () => {
  return axiosWrapper
    .post(`/member/logout`)
    .then((res) => res.data)
    .catch((err) => console.log(err));
};

export const reissueAccessToken = async (email) => {
  const cookies = new Cookies();
  // 기존 토큰 삭제
  cookies.remove("accessToken");

  try {
    // 새로운 Axios 인스턴스를 사용해 요청 보내기 (기존 인터셉터 활용)
    const response = await axiosWrapper.post(`/member/reissue/accessToken/${email}`);
    // 새 토큰을 쿠키에 저장
    if (response.data && response.data.dataBody) {
      cookies.set("accessToken", response.data.dataBody); // 새로운 토큰 저장
    }
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("토큰 재발급 실패");
  }
};

// 회원정보 가져오기
export const getMemberInfo = async () => {
  return axiosWrapper
    .get(`/member/get`)
    .then((res) => res.data)
    .catch((err) => console.log(err));
};
