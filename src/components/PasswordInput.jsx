import React, { useState } from "react";
import * as p from "./PasswordInputStyle";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

const PasswordInput = ({ placeholder, value, onChange, id, required = true }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <p.Container>
      <p.Input
        type={isPasswordVisible ? "text" : "password"}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
      <p.Icon onClick={togglePasswordVisibility}>
        {isPasswordVisible ? (
          <VisibilityOffOutlinedIcon fontSize="small" />
        ) : (
          <VisibilityOutlinedIcon fontSize="small" />
        )}
      </p.Icon>
    </p.Container>
  );
};

export default PasswordInput;
