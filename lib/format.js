'use strict';

/**
 * A helper class that stores formatting options and provides some formatting
 * methods
 */
export default class Format {
    constructor(options) {
        this.beforeOpen = '';
		this.afterOpen = '';
		this.beforeClose = '';
		this.afterClose = '';
		this.indent = '';
		this.newline = '';

        if (options) {
            Object.assign(this, options);
        }
    }

    /**
     * Return formatted opening section
     * @param {String} str
     * @return {String}
     */
    open(str) {
        return this.beforeOpen + str + this.afterOpen;
    }

    /**
     * Return formatted closing section
     * @param {String} str
     * @return {String}
     */
    close(str) {
        return this.beforeClose + str + this.afterClose;
    }

    /**
     * Returns formatted text value: indents every line (except first) and
     * replaces newline character with `.newline` option
     */
    text(str) {
        const lines = (str || '').split(/\r\n|\r|\n/g);
        if (lines.length === 1) {
            // no newlines, nothing to indent
            return lines[0];
        }

        // No newline and no indent means no formatting at all:
        // in this case we should replace newlines with spaces
        const nl = (!this.newline && !this.indent) ? ' ' : this.newline;
        return lines.map((line, i) => i ? this.indent + line : line).join(nl);
    }
}
