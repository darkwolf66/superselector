import type { CommandHandler, ExecutionContext, SelectorValue } from "../types"
import { ErrorFactory } from "../core/errors"
import { logger } from "../core/logger"

/**
 * Registry for all SuperSelector commands
 */
export class CommandRegistry {
    private commands = new Map<string, CommandHandler>()

    register(name: string, handler: CommandHandler): void {
        if (this.commands.has(name)) {
            logger.warn(`Command '${name}' is being overridden`)
        }

        this.commands.set(name, handler)
        // logger.debug(`Command registered: ${name}`)
    }

    unregister(name: string): boolean {
        const removed = this.commands.delete(name)
        if (removed) {
            // logger.debug(`Command unregistered: ${name}`)
        }
        return removed
    }

    has(name: string): boolean {
        return this.commands.has(name)
    }

    get(name: string): CommandHandler | undefined {
        return this.commands.get(name)
    }

    execute(name: string, context: ExecutionContext, ...args: any[]): SelectorValue {
        const handler = this.commands.get(name)

        if (!handler) {
            throw ErrorFactory.execution(`Unknown command: ${name}`)
        }

        // Validate arguments if validator exists
        if (handler.validate && !handler.validate(args)) {
            throw ErrorFactory.validation(`Invalid arguments for command '${name}': ${JSON.stringify(args)}`)
        }

        try {
            return handler.execute(context, ...args)
        } catch (error) {
            throw ErrorFactory.execution(
                `Error executing command '${name}': ${error instanceof Error ? error.message : String(error)}`,
                undefined,
                context,
            )
        }
    }

    list(): string[] {
        return Array.from(this.commands.keys()).sort()
    }

    getInfo(name: string): { name: string; description?: string; hasValidator: boolean } | null {
        const handler = this.commands.get(name)
        if (!handler) return null

        return {
            name,
            description: handler.description ?? 'No description provided',
            hasValidator: typeof handler.validate === "function",
        }
    }

    clear(): void {
        //const count = this.commands.size
        this.commands.clear()
        //logger.debug(`Command registry cleared: ${count} commands removed`)
    }
}

// Global command registry
export const commandRegistry = new CommandRegistry()
