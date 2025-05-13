module.exports = {
  testEnvironment: 'node',
  reporters: ['default', ['jest-allure', { outputDirectory: 'allure-results' }]],
  collectCoverage: true,
};
