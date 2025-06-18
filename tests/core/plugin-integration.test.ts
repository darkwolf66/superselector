/**
 * @jest-environment jsdom
 */
import { SuperSelector } from "../../src"
import type { Plugin } from "../../src/types"

describe("Plugin Integration", () => {
    let superSelector: SuperSelector

    beforeEach(() => {
        document.body.innerHTML = `
            <div class="container">
                <article class="post" data-id="1">
                    <h2>First Post</h2>
                    <p class="content">This is the first post content.</p>
                    <div class="meta">
                        <span class="author">John Doe</span>
                        <span class="date">2024-01-15</span>
                    </div>
                </article>
                <article class="post" data-id="2">
                    <h2>Second Post</h2>
                    <p class="content">This is the second post content.</p>
                    <div class="meta">
                        <span class="author">Jane Smith</span>
                        <span class="date">2024-01-16</span>
                    </div>
                </article>
            </div>
        `
        superSelector = new SuperSelector({ debug: true })
    })

    afterEach(() => {
        superSelector.destroy()
    })

    it("should create a real-world content extraction plugin", async () => {
        const contentExtractionPlugin: Plugin = {
            name: "content-extractor",
            version: "1.0.0",
            commands: {
                extractPostData: {
                    execute: (context) => {
                        const elements = Array.isArray(context.currentValue) ? context.currentValue : [context.currentValue]

                        return elements
                            .filter((el) => el instanceof Element)
                            .map((article: Element) => ({
                                id: article.getAttribute("data-id"),
                                title: article.querySelector("h2")?.textContent?.trim(),
                                content: article.querySelector(".content")?.textContent?.trim(),
                                author: article.querySelector(".author")?.textContent?.trim(),
                                date: article.querySelector(".date")?.textContent?.trim(),
                            }))
                    },
                    description: "Extract structured data from post elements",
                },
                filterByAuthor: {
                    execute: (context, authorName: string) => {
                        const posts = Array.isArray(context.currentValue) ? context.currentValue : [context.currentValue]

                        return posts.filter((post: any) => post && post.author && post.author.includes(authorName))
                    },
                    validate: (args) => args.length === 1 && typeof args[0] === "string",
                    description: "Filter posts by author name",
                },
                sortByDate: {
                    execute: (context) => {
                        const posts = Array.isArray(context.currentValue) ? context.currentValue : [context.currentValue]

                        return posts.sort((a: any, b: any) => {
                            if (!a.date || !b.date) return 0
                            return new Date(a.date).getTime() - new Date(b.date).getTime()
                        })
                    },
                    description: "Sort posts by date",
                },
            },
        }

        superSelector.loadPlugin(contentExtractionPlugin)

        // Test extracting all post data
        const allPosts = await superSelector.execute(".post | extractPostData()")
        console.log("All posts:", allPosts.value)

        expect(allPosts.success).toBe(true)
        expect(Array.isArray(allPosts.value)).toBe(true)
        expect((allPosts.value as any[]).length).toBe(2)
        expect((allPosts.value as any[])[0]).toMatchObject({
            id: "1",
            title: "First Post",
            author: "John Doe",
        })

        // Test filtering by author
        const johnPosts = await superSelector.execute('.post | extractPostData() | filterByAuthor("John")')
        console.log("John's posts:", johnPosts.value)

        expect(johnPosts.success).toBe(true)
        expect((johnPosts.value as any[]).length).toBe(1)
        expect((johnPosts.value as any[])[0].author).toBe("John Doe")

        // Test sorting by date
        const sortedPosts = await superSelector.execute(".post | extractPostData() | sortByDate()")
        console.log("Sorted posts:", sortedPosts.value)

        expect(sortedPosts.success).toBe(true)
        expect((sortedPosts.value as any[])[0].date).toBe("2024-01-15")
        expect((sortedPosts.value as any[])[1].date).toBe("2024-01-16")
    })

    it("should demonstrate plugin event system", async () => {
        const events: string[] = []

        const loggingPlugin: Plugin = {
            name: "logger",
            version: "1.0.0",
            hooks: {
                "execution:start": (data: any) => {
                    // The data structure contains commands and element
                    const commandCount = data?.commands?.length || 0
                    events.push(`Started execution with ${commandCount} commands`)
                },
                "execution:complete": (data: any) => {
                    // The data structure contains result, executionTime, commandsExecuted
                    const execTime = data?.executionTime || 0
                    events.push(`Completed execution in ${execTime}ms`)
                },
                "command:executed": (data: any) => {
                    // The data structure contains command and result
                    const commandName = data?.command?.name || data?.command?.type || "unknown"
                    events.push(`Executed command: ${commandName}`)
                },
            },
        }

        superSelector.loadPlugin(loggingPlugin)

        await superSelector.execute(".post | [0] | textContent")

        console.log("Plugin events:", events)

        expect(events.length).toBeGreaterThan(0)
        expect(events.some((event) => event.includes("Started execution"))).toBe(true)
        expect(events.some((event) => event.includes("Completed execution"))).toBe(true)
    })

    it("should handle plugin command validation", async () => {
        const validationPlugin: Plugin = {
            name: "validation-plugin",
            version: "1.0.0",
            commands: {
                requireString: {
                    execute: (_context, value: string) => {
                        return `Processed: ${value}`
                    },
                    validate: (args: any[]) => {
                        return args.length === 1 && typeof args[0] === "string"
                    },
                    description: "Command that requires a string argument",
                },
            },
        }

        superSelector.loadPlugin(validationPlugin)

        // Test with valid argument
        const validResult = await superSelector.execute('.post | [0] | requireString("test")')
        expect(validResult.success).toBe(true)
        expect(validResult.value).toBe("Processed: test")

        // Test with invalid argument (this should fail validation)
        const invalidResult = await superSelector.execute(".post | [0] | requireString()")
        expect(invalidResult.success).toBe(false)
        expect(invalidResult.error).toBeDefined()
    })
})
