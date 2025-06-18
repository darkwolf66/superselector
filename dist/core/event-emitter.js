"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = void 0;
/**
 * Event system for SuperSelector
 */
class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    on(eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(listener);
    }
    off(eventType, listener) {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this.listeners.delete(eventType);
            }
        }
    }
    emit(eventType, data) {
        const event = {
            type: eventType,
            data,
            timestamp: Date.now(),
        };
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(event);
                }
                catch (error) {
                    console.error(`Error in event listener for ${eventType}:`, error);
                }
            }
        }
    }
    once(eventType, listener) {
        const onceListener = (event) => {
            listener(event);
            this.off(eventType, onceListener);
        };
        this.on(eventType, onceListener);
    }
    removeAllListeners(eventType) {
        if (eventType) {
            this.listeners.delete(eventType);
        }
        else {
            this.listeners.clear();
        }
    }
    listenerCount(eventType) {
        return this.listeners.get(eventType)?.size || 0;
    }
    eventTypes() {
        return Array.from(this.listeners.keys());
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=event-emitter.js.map