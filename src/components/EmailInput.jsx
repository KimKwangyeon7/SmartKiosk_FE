import React from "react";
import * as p from "./PasswordInputStyle";

const EmailInput = ({ placeholder, value, onChange, id, required = true }) => {
  return (
    <p.Container>
      <p.Input
        type="email"
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </p.Container>
  );
};

export default EmailInput;
