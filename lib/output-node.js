'use strict';

import Format from './format';

/**
 * Output node is an object containing generated output for given parsed
 * abbreviation node. Output node can be passed to various processors that
 * may shape-up final node output. The final output is simply a concatenation
 * of `.open`, `.text` and `.close` properties, passed through `.format`
 * formatter
 */
export default class OutputNode {
	constructor(node, format) {
		this.node = node;
		this.format = format || new Format();

		this.open = null;
		this.close = null;
		this.text = null;
	}

	toString(children) {
		return this.format.open(this.open) + this.format.text(this.text)
			+ (children || '') + this.format.close(this.close);
	}
}
