import { useCookies } from "react-cookie";
import Swal from "sweetalert2";
import { useMutation } from "react-query";

const LoginContainer = () => {
  const [cookies, setCookie] = useCookies(["accessToken"]);

  // 일반 로그인
  const { mutate: LoginUser } = useMutation({
    mutationKey: ["loginUser"],
    mutationFn: loginUser,
    onSuccess: (res) => {
      if (res.dataHeader.successCode === 1) {
        setErrorMessage(res.dataHeader.resultMessage);
        Swal.fire(`${res.dataHeader.resultMessage}`, "", "error");
      } else {
        // 로컬 스토리지에 memberInfo 및 로그인 여부 저장
        const { memberInfo, validToken } = res.dataBody; // 유효기간 있는 토큰 가져오기
        localStorage.setItem("memberInfo", JSON.stringify(memberInfo));
        localStorage.setItem("isLogIn", "true");

        // 쿠키에 accessToken 저장
        setCookie("accessToken", validToken, { path: "/", secure: true, sameSite: "Strict" });

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

  // 로그인 요청 핸들러
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
              autoComplete="current-password"
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
