module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    // Suppress noisy console output from source files during tests
    silent: false,
};
