module.exports = {
  extends: ['jwp/typescript'],
  rules: {
    "max-len": ["error", { "code": 120 }]
  },
  ignorePatterns: ['out'],
  env: {
    node: true, // Enables recognition of Node.js global variables and scoping rules
  },
};

