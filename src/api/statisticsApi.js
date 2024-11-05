import { axiosWrapper } from "./axiosWrapper";

// 해당 지점과 나머지 지점의 업무별 평균 상담 시간 가져오기
export const getAvgCsnlTime = async (deptNm) => {
  return axiosWrapper
    .post(`/statistics/code?deptNm=${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("통계 가져오기 실패");
    });
};

// 해당 지점의 요일별 평균 고객 수
export const getAvgByDay = async (deptNm) => {
  return axiosWrapper
    .post(`/statistics/day?deptNm=${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("통계 가져오기 실패");
    });
};

// 해당 지점의 년도, 분기별 고객 수
export const getAvgByPeriod = async (data) => {
  return axiosWrapper
    .post(`/statistics/period?deptNm=${data.deptNm}&year=${data.year}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("통계 가져오기 실패");
    });
};

// 해당 지점의 업무별 비율
export const getWorkPercentage = async (deptNm) => {
  return axiosWrapper
    .post(`/statistics/work?deptNm=${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("통계 가져오기 실패");
    });
};

// 해당 지점의 최근 한달 시간대별 고객 수
export const getCntByTime = async (deptNm) => {
  return axiosWrapper
    .post(`/statistics/time?deptNm=${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("통계 가져오기 실패");
    });
};

// 해당 지점 창구의 업무별 비율
export const getWicketPercentage = async (deptNm) => {
  return axiosWrapper
    .post(`/statistics/wicket?deptNm=${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("통계 가져오기 실패");
    });
};

// 해당 지점과 나머지 지점의 업무별 평균 상담 시간 가져오기
export const getAvgWaitTime = async (deptNm) => {
  return axiosWrapper
    .post(`/statistics/wait?deptNm=${deptNm}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err);
      throw new Error("통계 가져오기 실패");
    });
};
