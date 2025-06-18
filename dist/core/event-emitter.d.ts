import type { EventListener } from "../types";
/**
 * Event system for SuperSelector
 */
export declare class EventEmitter {
    private listeners;
    on(eventType: string, listener: EventListener): void;
    off(eventType: string, listener: EventListener): void;
    emit(eventType: string, data?: any): void;
    once(eventType: string, listener: EventListener): void;
    removeAllListeners(eventType?: string): void;
    listenerCount(eventType: string): number;
    eventTypes(): string[];
}
//# sourceMappingURL=event-emitter.d.ts.map