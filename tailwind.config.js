/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // src 폴더 안의 모든 파일을 감시해야 합니다!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}