// Native safe-area insets are unavailable under Jest; use the library's official mock.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);
