'use strict';

import output from '../lib/output-builder';
import Format from '../lib/format';
import OutputNode from '../lib/output-node';
import { formatText, splitByLines, handlePseudoSnippet, isFirstChild, isLastChild, isRoot } from '../lib/utils';

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
export default function(tree, profile, postProcess) {
	// Each node may contain fields like `${1:placeholder}`.
	// Since most modern editors will link all fields with the same
	// index, we have to ensure that different nodes has their own indicies.
	// We’ll use this `fieldState` object to globally increment field indices
	// during output
	const fieldState = { index: 1 };

	// Output formatting made of two steps:
	// 1. Walk on tree and get `Format` object for each tree node
	// 2. Walk on tree again to output each node with its own format
	const formats = getTreeFormat(tree, profile);

	return output(tree, (node, level, next) => {
        if (node.isGroup) {
            return next();
        }

		let outNode = new OutputNode(node, formats.get(node));

		if (!handlePseudoSnippet(outNode, profile, fieldState)) {
			if (node.name) {
				const attrs = formatAttributes(node, profile, fieldState);
				const nodeName = profile.name(node.name);
				// omit tag name if node has primary attributes only
				// NB use `.charCodeAt(0)` instead of `[0]` to reduce string allocations
				const canOmitName = attrs && attrs.charCodeAt(0) !== braceCode && reOmitName.test(nodeName);

				outNode.open = (canOmitName ? '' : nodeName) + attrs;
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

            outNode.text = formatText(nodeValue, profile, fieldState);
		}

		if (typeof postProcess === 'function') {
			outNode = postProcess(outNode, profile);
		}

        return outNode ? outNode.toString(next()) : '';
	});
};

/**
 * Returns format objects for every node in given tree
 * NB Unlike HTML, Pug is indent-based format so some formatting options from
 * `profile` will not take effect, otherwise output will be broken
 * @param {Node} tree
 * @param {Profile} profile
 * @return {Map} Key is a tree node, value is a format object
 */
function getTreeFormat(tree, profile) {
	const formats = new Map();
	const getFormat = node => {
		if (!formats.has(node)) {
			formats.set(node, new Format());
		}
		return formats.get(node);
	};

	tree.walk((node, level) => {
		const format = getFormat(node);
		const fLevel = getIndentLevel(node, profile, level);
		format.indent = profile.indent(fLevel);
		format.newline = '\n';

		if (shouldFormatNode(node, profile)) {
			format.beforeOpen = format.newline + format.indent;
		}

		if (!node.isTextOnly && node.value) {
			// node with text: put a space before single-line text,
			// indent for multi-line text
			format.beforeText = reNl.test(node.value)
				? format.newline + profile.indent(fLevel + 1)
				: ' ';
		}
	});

	return formats;
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
 * Check if given node should be formatted
 * @param  {Node} node
 * @param  {Profile} profile
 * @return {Boolean}
 */
function shouldFormatNode(node, profile) {
	// do not format the very first node in output
	return !(isFirstChild(node) && isRoot(node.parent));
}

/**
 * Formats attributes of given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @param  {Object} fieldState
 * @return {String}
 */
function formatAttributes(node, profile, fieldState) {
	const primary = [], secondary = [];

	node.attributes.forEach(attr => {
		const name = profile.attribute(attr.name);
		const value = formatText(attr.value, profile, fieldState);

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
