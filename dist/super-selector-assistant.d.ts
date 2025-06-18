/**
 * Provides utility/helper functions for SuperSelector operations.
 * All methods are static.
 */
export declare class SuperSelectorAssistant {
    /**
     * Filters elements based on a property matching a regex.
     * @param element - A single element or an array of elements.
     * @param prop - The property name to check.
     * @param match - The regex string to match against the property's value.
     * @returns An array of elements where the property matches.
     */
    static matchProp(element: any | any[], prop: string, match: string): any[];
    /**
     * Recursively gets a property from an element a specified number of times.
     * E.g., element.prop1.prop1 if times is 2 and attr is "prop1".
     * @param element - The starting element/object.
     * @param attr - The attribute/property name.
     * @param times - The number of times to recursively access the property. Defaults to 1.
     * @returns The value of the deeply nested property, or the element if times is 0 or less, or null/undefined if path breaks.
     */
    static recursiveProp(element: any, attr: string, times?: string | number): any;
    /**
     * Alias for getProp.
     * @param element - The element/object or array of elements/objects.
     * @param attr - The attribute/property name.
     * @returns The property value or an array of property values.
     */
    static p(element: any | any[], attr: string): any | any[] | null;
    /**
     * Gets a property from an element or an array of elements.
     * @param element - The element/object or array of elements/objects.
     * @param attr - The attribute/property name.
     * @returns The property value if a single element is passed, or an array of property values if an array is passed.
     *          Returns null if property is not found on a single element. Filters out undefined properties for arrays.
     */
    static getProp(element: any | any[], attr: string): any | any[] | null;
    /**
     * Checks if an element's property (string) includes a given substring.
     * @param element - The element/object.
     * @param prop - The property name.
     * @param str - The substring to check for.
     * @returns The element if it matches, otherwise null.
     */
    static propIncludes(element: any, prop: string, str: string): any | null;
    /**
     * Checks if an element's property (string) includes a given substring, case-insensitively.
     * @param element - The element/object.
     * @param prop - The property name.
     * @param str - The substring to check for.
     * @returns The element if it matches, otherwise null.
     */
    static propIncludesLowercase(element: any, prop: string, str: string): any | null;
}
//# sourceMappingURL=super-selector-assistant.d.ts.map