import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/userApi";
import EmailInput from "./EmailInput";
import PasswordInput from "./PasswordInput";
import * as u from "./UserContainerStyle";
import Swal from "sweetalert2";

const LoginContainer = ({ closeModal, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 일반 로그인
  const { mutate: LoginUser } = useMutation({
    mutationKey: ["loginUser"],
    mutationFn: loginUser,
    onSuccess: (res) => {
      if (res.dataHeader.successCode === 1) {
        setErrorMessage(res.dataHeader.resultMessage);
      } else {
        // 로컬 스토리지에 memberInfo 및 로그인 여부 저장
        const { memberInfo } = res.dataBody;
        localStorage.setItem("memberInfo", JSON.stringify(memberInfo));
        localStorage.setItem("isLogIn", "true");

        // 로그인 성공 알림
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => {
            const toastElement = toast;
            toastElement.onmouseenter = Swal.stopTimer;
            toastElement.onmouseleave = Swal.resumeTimer;
          },
        });

        Toast.fire({
          icon: "success",
          title: "성공적으로 로그인되었습니다.",
        });

        setIsLoggedIn(true); // 로그인 상태 설정
        closeModal(); // 모달 닫기
        if (memberInfo.role === "HEADQUARTER") {
          navigate("/dashboard"); // 대시보드 페이지로 이동
        } else {
          window.location.reload();
        }
      }
    },
  });

  const handleLoginUser = (e) => {
    e.preventDefault();
    const data = {
      email,
      password,
    };

    LoginUser(data);
    setErrorMessage(""); // 에러 메시지 초기화
  };

  return (
    <u.Container>
      <u.LeftWrap>
        <u.Form onSubmit={handleLoginUser}>
          {errorMessage && <u.ErrorMsg>{errorMessage}</u.ErrorMsg>}
          <EmailInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            placeholder="이메일"
          />
          <u.InputContainer>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              placeholder="비밀번호"
            />
            <u.InputMsg>영문, 숫자, 특수문자 포함 8~16자</u.InputMsg>
          </u.InputContainer>
          <u.Btn type="submit">Log In</u.Btn>
        </u.Form>
      </u.LeftWrap>
      <u.RightWrap></u.RightWrap>
    </u.Container>
  );
};

export default LoginContainer;
