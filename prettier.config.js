/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 4,
  trailingComma: "es5",
  printWidth: 80,
  plugins: ["prettier-plugin-tailwindcss"],
};

module.exports = config;
