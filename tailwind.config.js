/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: ['bg-orange-500', 'bg-[#008c99]', 'bg-[#FF7B00]'],
  theme: { extend: {} },
  plugins: [],
  presets: [require("nativewind/preset")],
};
