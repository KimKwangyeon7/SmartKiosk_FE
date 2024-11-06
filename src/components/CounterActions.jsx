import React from "react";

const CounterActions = ({ counterName, onEdit, onDelete }) => {
  return (
    <div className="counter-actions">
      <button onClick={() => onEdit(counterName)}>편집</button>
      <button onClick={() => onDelete(counterName)}>삭제</button>
    </div>
  );
};

export default CounterActions;
