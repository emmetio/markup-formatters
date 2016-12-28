'use strict';

import output from '../lib/output-builder';
import Format from '../lib/format';
import OutputNode from '../lib/output-node';
import { splitByLines, handlePseudoSnippet, isFirstChild, isRoot } from '../lib/utils';

const reOmitName = /^div$/i;
const reId = /^id$/i;
const reClass = /^class$/i;
const reNl = /\n|\r/;
const braceCode = 40; // code for '(' symbol

/**
 * Outputs given parsed Emmet abbreviation as Pug (Jade), formatted according to
 * `profile` options
 * @param  {Node}     tree           Parsed Emmet abbreviation
 * @param  {Profile}  profile        Output profile
 * @param  {Function} [postProcess]  A post-processor for generated output node
 * that applies various transformations on it to shape-up a final output.
 * A post-processor is a function that takes `OutputNode` as first argument and
 * `Profile` as second and returns updated or new output node.
 * If it returns `null` – node will not be outputted
 * @return {String}
 */
export default function(tree, profile, field) {
	return output(tree, field, (node, level, renderFields, next) => {
		let outNode = new OutputNode(node, getFormat(node, level, profile));

		if (!handlePseudoSnippet(outNode, renderFields)) {
			if (node.name) {
                const name = profile.name(node.name);
				const attrs = formatAttributes(node, profile, renderFields);
				// omit tag name if node has primary attributes only
				// NB use `.charCodeAt(0)` instead of `[0]` to reduce string allocations
				const canOmitName = attrs && attrs.charCodeAt(0) !== braceCode && reOmitName.test(name);

				outNode.open = (canOmitName ? '' : name) + attrs;
			}

			let nodeValue = node.value;

			// Do not generate fields for nodes with empty value and children
			// or if node is self-closed
			if (nodeValue == null && (node.children.length || node.selfClosing)) {
				nodeValue = '';
			}

			// For multiline text we should precede each line with `| `.
			// Also indent one-level deep
			if (reNl.test(nodeValue)) {
				const indent = profile.indent(1);
				nodeValue = splitByLines(nodeValue).map(line => `${indent}| ${line}`).join('\n');
			}

            outNode.text = renderFields(nodeValue);
		}

        return outNode.toString(next());
	});
};

/**
 * Returns format object for given abbreviation node
 * NB Unlike HTML, Pug is indent-based format so some formatting options from
 * `profile` will not take effect, otherwise output will be broken
 * @param {Node} node
 * @param {Profile} profile
 * @return {Map} Key is a tree node, value is a format object
 */
function getFormat(node, level, profile) {
    const format = new Format();
    format.indent = profile.indent(getIndentLevel(node, profile, level));
    format.newline = '\n';
    const prefix = format.newline + format.indent;

    // do not format the very first node in output
    if (!isRoot(node.parent) || !isFirstChild(node)) {
        format.beforeOpen = prefix;
    }

    if (!node.isTextOnly && node.value) {
        // node with text: put a space before single-line text,
        // indent for multi-line text
        format.beforeText = reNl.test(node.value) ? prefix + profile.indent(1) : ' ';
    }

	return format;
}

/**
 * Computes indent level for given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @param  {Number} level
 * @return {Number}
 */
function getIndentLevel(node, profile, level) {
	return level && node.parent.isTextOnly ? level - 1 : level;
}

/**
 * Formats attributes of given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @param  {Function} renderFields
 * @return {String}
 */
function formatAttributes(node, profile, renderFields) {
	const primary = [], secondary = [];

	node.attributes.forEach(attr => {
		if (attr.options.implied && attr.value == null) {
			return null;
		}

		const name = profile.attribute(attr.name);
		const value = renderFields(attr.value);

		if (reId.test(name)) {
			primary.push(`#${value}`);
		} else if (reClass.test(name)) {
			primary.push(`.${value.replace(/\s+/g, '.')}`);
		} else {
			const isBoolean = attr.value == null
				&& (attr.options.boolean || profile.get('booleanAttributes').indexOf(name.toLowerCase()) !== -1);

			secondary.push(isBoolean ? name : `${name}=${profile.quote(value)}`);
		}
	});

	return primary.join('') + (secondary.length ? `(${secondary.join(', ')})` : '');
}
