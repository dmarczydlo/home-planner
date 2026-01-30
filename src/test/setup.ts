import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import "@testing-library/jest-dom/vitest";

expect.extend(matchers);


process.env.NODE_ENV = process.env.NODE_ENV || "test";


afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});
