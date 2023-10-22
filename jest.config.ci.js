/** @type {import('jest').Config} */
const config = {
  verbose: true,
  collectCoverage: true,
  reporters: [['github-actions', { silent: false }], 'summary'],
};

module.exports = config;
