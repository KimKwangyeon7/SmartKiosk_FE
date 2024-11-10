import { axiosWrapper } from "./axiosWrapper";

// 업무 버튼 정보 가져오기
export const getTicketInfoList = async (deptNm) => {
  return axiosWrapper
    .get(`/member/button/${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("리스트 조회 실패");
    });
};

// 번호표 발급
export const issueTicket = async (data) => {
  return axiosWrapper
    .post("/counsel/issue", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("번호표 발급 실패");
    });
};

// 업무 버튼 생성
export const addButton = async (data) => {
  return axiosWrapper
    .post("/member/button", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

// 업무 버튼 수정
export const modifyButton = async (data) => {
  return axiosWrapper
    .patch("/member/button", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

// 업무 버튼 삭제
export const deleteButton = async (data) => {
  return axiosWrapper
    .delete(`/member/button/${data.deptNm}/${data.workDvcdNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

// 업무 버튼 좌표 수정
export const modifyButtonLoc = async (deptNm, data) => {
  return axiosWrapper
    .patch(`/member/button/loc?deptNm=${deptNm}`, data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

// 상담 시작
export const startCounsel = async (data) => {
  return axiosWrapper
    .post("/counsel/start", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

// 상담 종료
export const endCounsel = async (counselId) => {
  return axiosWrapper
    .post(`/counsel/end?counselId=${counselId}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};
