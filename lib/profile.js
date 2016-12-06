'use strict';

const booleanAttrs = /^contenteditable|seamless|async|autofocus|autoplay|checked|controls|defer|disabled|formnovalidate|hidden|ismap|loop|multiple|muted|novalidate|readonly|required|reversed|selected|typemustmatch$/i;

/**
 * Creates output profile for given options (@see defaults)
 * @param {defaults} options
 */
export default class Profile {
    constructor(options) {
        this.options = options;
        this.quoteChar = options.attributeQuotes === 'single' ? '\'' : '"';
    }

    /**
     * Quote given string according to profile
     * @param {String} str String to quote
     * @return {String}
     */
    quote(str) {
        return `${this.quoteChar}${str}${this.quoteChar}`;
    }

    /**
     * Output given tag name accoding to options
     * @param {String} name
     * @return {String}
     */
    tagName(name) {
        return strcase(name, this.options.tagCase);
    }

    /**
     * Output given attrinbute name accoding to options
     * @param {String} name
     * @return {String}
     */
    attributeName(name) {
        return strcase(name, this.options.attributeCase);
    }

    /**
     * Check if given attribute is boolean
     * @param {Attribute}
     * @return {Boolean}
     */
    isBooleanAttribute(attrNode) {
        return attrNode.options.boolean || booleanAttrs.test(attrNode.name);
    }
};

function strcase(string, type) {
    if (type) {
        string = type === 'upper' ? string.toUpperCase() : string.toLowerCase();
    }
    return string;
}
