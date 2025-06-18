// Test setup file
import { jest } from "@jest/globals"
import "jest-environment-jsdom"

// Global test utilities
global.console = {
    ...console,
    // Don't suppress console.log in tests for debugging
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
}

// Mock DOM APIs that might not be available in jsdom
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})
