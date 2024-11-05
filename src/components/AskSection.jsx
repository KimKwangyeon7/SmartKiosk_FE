import { useNavigate } from "react-router-dom";
import * as a from "./AskSectionStyle";

const AskSection = (props) => {
  const { title, subtitle } = props;
  const navigate = useNavigate();

  const goPage = () => {
    if (subtitle === "Sign up") {
      navigate("/register");
    } else {
      navigate("/login");
    }
  };

  return (
    <a.Container>
      <a.FirstWrap>
        <a.TitleDiv>
          <a.Title>{title}</a.Title>
          <a.Subtitle onClick={goPage}>{subtitle}</a.Subtitle>
        </a.TitleDiv>
      </a.FirstWrap>
      <a.SecondWrap>
        <a.ViewTitle onClick={() => navigate("/")}></a.ViewTitle>
      </a.SecondWrap>
    </a.Container>
  );
};

export default AskSection;
