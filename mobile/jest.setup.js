/* eslint-env jest */
// Tests run in Node, where the native AsyncStorage module doesn't exist —
// swap in the official in-memory mock the library ships for Jest.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
