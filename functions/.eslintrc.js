module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
    "jest.config.js", // Ignore jest config
    "/functions/**/*", // Ignore nested functions directory
    "/tests-disabled/**/*", // Ignore disabled tests
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["error", {"code": 120}], // Increase line length limit
    "require-jsdoc": "off", // Disable JSDoc requirement
    "valid-jsdoc": "off", // Disable JSDoc validation
    "@typescript-eslint/no-explicit-any": "off", // Allow any types for flexibility
    "brace-style": "off", // Allow flexible brace styles
  },
};
