/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",  // 더 어두운 배경색
        secondary: "#2E2E2E",
        accent: "#3A3A3A",
        textGray: "#E7E7E7",
        placeholderGray: "#AFAFAF",
        white: "#FFFFFF",
        black: "#000000",
      },
      fontFamily: {
        pretendard: ["Pretendard", "sans-serif"],
      },
      margin: {
        '68': '17rem',  // 커스텀 마진 값 추가
        '70': '17.5rem',
        '76': '19rem',
        '80': '20rem',
        '100': '25rem',
        '120': '30rem',
      },
    },
  },
  plugins: [],
}
