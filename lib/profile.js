'use strict';

import defaultOptions from './defaults';

const booleanAttrs = /^contenteditable|seamless|async|autofocus|autoplay|checked|controls|defer|disabled|formnovalidate|hidden|ismap|loop|multiple|muted|novalidate|readonly|required|reversed|selected|typemustmatch$/i;

/**
 * Creates output profile for given options (@see defaults)
 * @param {defaults} options
 */
export default class Profile {
    constructor(options) {
        this.options = Object.assign({}, defaultOptions, options);
        this.quoteChar = this.options.attributeQuotes === 'single' ? '\'' : '"';
    }

    /**
     * Quote given string according to profile
     * @param {String} str String to quote
     * @return {String}
     */
    quote(str) {
        return `${this.quoteChar}${str != null ? str : ''}${this.quoteChar}`;
    }

    /**
     * Output given tag name accoding to options
     * @param {String} name
     * @return {String}
     */
    name(name) {
        return strcase(name, this.options.tagCase);
    }

	/**
	 * Outputs either full attribute or attribute name accoding to current settings
	 * @param {Attribute|String} Attribute node or attribute name
	 * @return {String}
	 */
    attribute(attr) {
		if (typeof attr === 'string') {
			return strcase(attr, this.options.attributeCase);
		}

		if (attr.options.implied && attr.value == null) {
			return '';
		}

		const attrName = this.attribute(attr.name);

        if (this.isBooleanAttribute(attr)) {
			return this.options.compactBooleanAttributes
				? attrName
				: `${attrName}=${this.quote(attrName)}`
		}

		return `${attrName}=${this.quote(attr.value)}`;
    }

    /**
     * Check if given attribute is boolean
     * @param {Attribute} attr
     * @return {Boolean}
     */
    isBooleanAttribute(attr) {
        return attr.options.boolean || booleanAttrs.test(attr.name);
    }
};

function strcase(string, type) {
    if (type) {
        string = type === 'upper' ? string.toUpperCase() : string.toLowerCase();
    }
    return string;
}
