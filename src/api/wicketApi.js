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
    });
};

export const createWicket = async (data) => {
  console.log(data);
  return axiosWrapper
    .post("/wicket", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

export const deleteWicket = async (wdId) => {
  return axiosWrapper
    .delete(`/wicket/${wdId}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

export const updateWicket = async (code) => {
  return axiosWrapper
    .patch(`/wicket/info?code=${code}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
    });
};

export const moveWicket = async (code) => {
  return axiosWrapper
    .patch("/wicket/move", code)
    .then((response) => {
      console.log("서버에 변경 사항 전송 성공", response.data);
    })
    .catch((error) => {
      console.error("서버에 변경 사항 전송 실패", error);
    });
};

export const moveKiosk = async (data) => {
  return axiosWrapper
    .patch("/wicket/kiosk/move", data)
    .then((response) => {
      console.log("서버에 변경 사항 전송 성공", response.data);
    })
    .catch((error) => {
      console.error("서버에 변경 사항 전송 실패", error);
    });
};

export const deleteFloor = async (floor) => {
  return axiosWrapper
    .delete(`/wicket/floor/${floor}`)
    .then((response) => {
      console.log("서버에 변경 사항 전송 성공", response.data);
    })
    .catch((error) => {
      console.error("서버에 변경 사항 전송 실패", error);
    });
};
