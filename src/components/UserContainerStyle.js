import React from "react";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%; /* 부모의 너비를 상속 */
  padding: 20px; /* 여백 조정 */
  box-sizing: border-box; /* 패딩 포함 */
`;

const LeftWrap = styled.div`
  width: 100%; /* 100% 너비 */
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%; /* 너비 조정 */
`;

const ErrorMsg = styled.div`
  color: red;
  margin-bottom: 10px;
`;

const InputContainer = styled.div`
  margin-bottom: 15px;
`;

const InputMsg = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-left: 3px;
`;

const Btn = styled.button`
  background-color: #007bff; /* 버튼 배경색 */
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 100%; /* 버튼을 전체 너비로 설정 */
`;

const RightWrap = styled.div`
  width: 100%; /* 100% 너비 */
`;

const ImgDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;

  img {
    width: 100%;
    height: auto;
  }
`;

const GeneralBtn = styled.div`
  width: 100%;
  max-width: 500px;
  height: auto;
  padding: 10px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: #d4e5f9;
  font-size: 14px;
  font-weight: 600;
  color: #2a7de1;

  &:hover {
    background-color: #6797da;
    color: white;
  }
`;

const GeneralBtnDiv = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Exporting the styled components
export {
  Container,
  LeftWrap,
  Form,
  ErrorMsg,
  InputContainer,
  InputMsg,
  Btn,
  RightWrap,
  ImgDiv,
  GeneralBtn,
  GeneralBtnDiv,
};
