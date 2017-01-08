'use strict';

import { splitByLines } from './utils';

const defaultFieldsRenderer = text => text;

/**
 * Output node is an object containing generated output for given Emmet
 * abbreviation node. Output node can be passed to various processors that
 * may shape-up final node output. The final output is simply a concatenation
 * of `.open`, `.text` and `.close` properties and its `.before*` and `.after*`
 * satellites
 * @param {Node}     node           Parsed Emmet abbreviation node
 * @param {Function} fieldsRenderer A function for rendering fielded text (text with
 * tabstops) for current node. @see ./render.js for details
 */
export default class OutputNode {
	constructor(node, fieldsRenderer, options) {
		if (typeof fieldsRenderer === 'object') {
			options = fieldsRenderer;
			fieldsRenderer = null;
		}
		
		this.node = node;
		this._fieldsRenderer = fieldsRenderer || defaultFieldsRenderer;

		this.open = null;
		this.beforeOpen = '';
		this.afterOpen = '';

		this.close = null;
		this.beforeClose = '';
		this.afterClose = '';

		this.text = null;
		this.beforeText = '';
		this.afterText = '';

		this.indent = '';
		this.newline = '';

		if (options) {
            Object.assign(this, options);
        }
	}

	clone() {
		return new this.constructor(this.node, this);
	}

	/**
	 * Properly indents given multiline text
	 * @param {String} text
	 */
	indentText(text) {
		const lines = splitByLines(text);
        if (lines.length === 1) {
            // no newlines, nothing to indent
            return text;
        }

        // No newline and no indent means no formatting at all:
        // in this case we should replace newlines with spaces
        const nl = (!this.newline && !this.indent) ? ' ' : this.newline;
        return lines.map((line, i) => i ? this.indent + line : line).join(nl);
	}

	/**
	 * Renders given text with fields
	 * @param {String} text
	 * @return {String}
	 */
	renderFields(text) {
		return this._fieldsRenderer(text);
	}

	toString(children) {
		const open = this._wrap(this.open, this.beforeOpen, this.afterOpen);
		const close = this._wrap(this.close, this.beforeClose, this.afterClose);
		const text = this._wrap(this.text, this.beforeText, this.afterText);

		return open + text + (children != null ? children : '') + close;
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
