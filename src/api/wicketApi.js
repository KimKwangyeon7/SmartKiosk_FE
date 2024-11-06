import { axiosWrapper } from "./axiosWrapper";

// 창구 정보 리스트 가져오기
export const getWicketInfoList = async (deptNm) => {
  return axiosWrapper
    .get(`/wicket/${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      //throw new Error("창구 리스트 정보 가져오기 실패");
    });
};

// 변경된 창구 위치 정보 리스트 가져오기
export const sendUpdatedWicketInfoList = async (data) => {
  console.log(data);
  return axiosWrapper
    .patch("/wicket", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      //throw new Error("창구 리스트 정보 가져오기 실패");
    });
};
