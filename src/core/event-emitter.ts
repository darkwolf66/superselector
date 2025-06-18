import type { SuperSelectorEvent, EventListener } from "../types"

/**
 * Event system for SuperSelector
 */
export class EventEmitter {
    private listeners = new Map<string, Set<EventListener>>()

    on(eventType: string, listener: EventListener): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set())
        }
        this.listeners.get(eventType)!.add(listener)
    }

    off(eventType: string, listener: EventListener): void {
        const listeners = this.listeners.get(eventType)
        if (listeners) {
            listeners.delete(listener)
            if (listeners.size === 0) {
                this.listeners.delete(eventType)
            }
        }
    }

    emit(eventType: string, data?: any): void {
        const event: SuperSelectorEvent = {
            type: eventType,
            data,
            timestamp: Date.now(),
        }

        const listeners = this.listeners.get(eventType)
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(event)
                } catch (error) {
                    console.error(`Error in event listener for ${eventType}:`, error)
                }
            }
        }
    }

    once(eventType: string, listener: EventListener): void {
        const onceListener: EventListener = (event) => {
            listener(event)
            this.off(eventType, onceListener)
        }
        this.on(eventType, onceListener)
    }

    removeAllListeners(eventType?: string): void {
        if (eventType) {
            this.listeners.delete(eventType)
        } else {
            this.listeners.clear()
        }
    }

    listenerCount(eventType: string): number {
        return this.listeners.get(eventType)?.size || 0
    }

    eventTypes(): string[] {
        return Array.from(this.listeners.keys())
    }
}
