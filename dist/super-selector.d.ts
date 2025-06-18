import type { QueryableElement, SelectorTarget } from "./types";
/**
 * Provides advanced DOM element selection and manipulation capabilities. (Legacy Implementation)
 */
export declare class SuperSelector {
    /**
     * The core method to apply a selector string to an element.
     * @param selector - The SuperSelector string.
     * @param currentElement - The root DOM element or document to start selection from.
     * @returns The result of the selection, which can be an element, array of elements, property value, etc.
     */
    static superSelector(selector: string | null, currentElement: QueryableElement | SelectorTarget | null): SelectorTarget | null;
    /**
     * Finds a single element using the SuperSelector syntax.
     * If multiple elements match, returns the first one.
     * @param selectorString - The SuperSelector string.
     * @param element - The root DOM element or document. Defaults to `document`.
     * @returns The first matched element, or null if not found.
     */
    static findElement(selectorString: string, element?: QueryableElement): Element | null;
}
//# sourceMappingURL=super-selector.d.ts.map