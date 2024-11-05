import * as i from "./InfoSectionStyle";

const InfoSection = ({ title, subtitle }) => {
  return (
    <i.Container>
      <i.Title>{title}</i.Title>
      <i.Subtitle>{subtitle}</i.Subtitle>
    </i.Container>
  );
};

export default InfoSection;
