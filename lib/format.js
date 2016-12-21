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
		this.beforeText = '';
		this.afterText = '';
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
		return this._wrap(str, this.beforeOpen, this.afterOpen);
    }

    /**
     * Return formatted closing section
     * @param {String} str
     * @return {String}
     */
    close(str) {
		return this._wrap(str, this.beforeClose, this.afterClose);
    }

    /**
     * Returns formatted text value: indents every line (except first) and
     * replaces newline character with `.newline` option
     * @param {String} str
     * @return {String}
     */
    text(str) {
		return this._wrap(str, this.beforeText, this.afterText);
    }

	/**
	 * Properly indents given multiline text
	 * @param {String} text
	 */
	indentText(text) {
		const lines = (text || '').split(/\r\n|\r|\n/g);
        if (lines.length === 1) {
            // no newlines, nothing to indent
            return lines[0];
        }

        // No newline and no indent means no formatting at all:
        // in this case we should replace newlines with spaces
        const nl = (!this.newline && !this.indent) ? ' ' : this.newline;
        return lines.map((line, i) => i ? this.indent + line : line).join(nl);
	}

	_wrap(str, before, after) {
		before = before != null ? before : '';
		after = after != null ? after : '';

        // automatically trim whitespace for non-empty wraps
        if (str != null) {
            str = before ? str.replace(/^\s+/, '') : str;
            str = after ? str.replace(/\s+$/, '') : str;
            return before + this.indentText(str) + after;
        }

        return '';
	}
}
