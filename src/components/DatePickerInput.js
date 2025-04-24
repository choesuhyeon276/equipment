import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";

const CustomInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <input
    type="text"
    onClick={onClick}     // 👈 이게 핵심! 클릭하면 달력 뜸
    value={value || ''}
    placeholder={placeholder}
    readOnly               // 👈 키보드 안 뜨게 막아줌
    ref={ref}
    className="custom-datepicker"
    style={{
      padding: "10px",
      fontSize: "16px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      width: "150px"
    }}
  />
));

const DatePickerInput = ({ selected, onChange, minDate, maxDate, placeholder }) => {
  return (
    <DatePicker
      selected={selected ? new Date(selected) : null}
      onChange={(date) => {
        if (date) onChange(date.toISOString().split("T")[0]);
      }}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      minDate={minDate ? new Date(minDate) : null}
      maxDate={maxDate ? new Date(maxDate) : null}
      locale={ko}
      customInput={<CustomInput placeholder={placeholder} />}
    />
  );
};

export default DatePickerInput;
