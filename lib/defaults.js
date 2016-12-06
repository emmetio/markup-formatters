'use strict';

export default {
    /**
     * Tag case: 'lower', 'upper' or '' (keep as-is)
     * @type {String}
     */
    tagCase: '',

    /**
     * Attribute name case: 'lower', 'upper' or '' (keep as-is)
     * @type {String}
     */
    attributeCase: 'asis',

    /**
     * Attribute value quotes: 'single' or 'double'
     * @type {String}
     */
    attributeQuotes: 'double',

    /**
	 * Enable output formatting (indentation and line breaks)
	 * @type {Boolean}
	 */
	format: true,

    /**
     * Output each tag on new line: `true`, `false` or 'guess' to decide depending
 	 * on tag type (inline- or block-level)
     * @type {Boolean|String}
     */
    formatTagNewline: 'guess',

	// With `formatTagNewline` === `true`, defines if leaf node (e.g. node with no children)
	// should have formatted line breaks
	formatTagNewlineLeaf: false,

    /**
     * A list of tag names that should not get inner indentation
     * @type {Array}
     */
    formatSkip: ['html'],

    /**
     * A list of tag names that should *always* get inner indentation.
     * @type {Array}
     */
    formatForce: ['body'],

	/**
	 * How many inline sibling elements should force line break for each tag
 	 * (set to 0 to disable)
	 * @type {Number}
	 */
	inlineBreak: 3,

    /**
     * Produce compact notation of boolean attribues: attributes where name equals value.
 	 * With this option enabled, output `<div contenteditable>` instead of
 	 * `<div contenteditable="contenteditable">`
     * @type {Boolean}
     */
    compactBooleanAttributes: false,

    /**
     * Style of self-closing tags:
     * 'html' – <br>
     * 'xml' – <br/>
     * 'xhtml' – <br />
     * @type {String}
     */
	selfClosingStyle: 'xhtml',

    /**
     * Factory function for fields (aka tabstops) in output. Most editors
     * supports `${index:placeholder}` format
     * @param  {Number} index       Index of tabstop in output
     * @param  {String} [placeholder] Optional field placeholder
     * @return {String}
     */
    field: (index, placeholder) => ''
};
