'use strict';

import render from '../lib/render';
import { splitByLines, handlePseudoSnippet, isFirstChild, isRoot } from '../lib/utils';

const reOmitName = /^div$/i;
const reId = /^id$/i;
const reClass = /^class$/i;
const reNl = /\n|\r/;
const braceCode = 40; // code for '(' symbol

/**
 * Renders given parsed Emmet abbreviation as Pug, formatted according to
 * `profile` options
 * @param  {Node}    tree      Parsed Emmet abbreviation
 * @param  {Profile} profile   Output profile
 * @param  {Object}  [options] Additional formatter options
 * @return {String}
 */
export default function pug(tree, profile, options) {
	options = options || {};

	return render(tree, options.field, (outNode, renderFields) => {
		outNode = setFormatting(outNode, profile);

		if (!handlePseudoSnippet(outNode, renderFields)) {
			const node = outNode.node;

			if (node.name) {
                const name = profile.name(node.name);
				const attrs = formatAttributes(node, profile, renderFields);
				// omit tag name if node has primary attributes only
				// NB use `.charCodeAt(0)` instead of `[0]` to reduce string allocations
				const canOmitName = attrs && attrs.charCodeAt(0) !== braceCode && reOmitName.test(name);

				outNode.open = (canOmitName ? '' : name) + attrs;
			}

			// Do not generate fields for nodes with empty value and children
			// or if node is self-closed
			if (node.value || (!node.children.length && !node.selfClosing) ) {
				outNode.text = renderFields(formatNodeValue(node, profile));
			}
		}

        return outNode;
	});
};

/**
 * Updates formatting properties for given output node
 * NB Unlike HTML, Pug is indent-based format so some formatting options from
 * `profile` will not take effect, otherwise output will be broken
 * @param  {OutputNode} outNode Output wrapper of farsed abbreviation node
 * @param  {Profile}    profile Output profile
 * @return {OutputNode}
 */
function setFormatting(outNode, profile) {
	const node = outNode.node;

    outNode.indent = profile.indent(getIndentLevel(node, profile));
    outNode.newline = '\n';
    const prefix = outNode.newline + outNode.indent;

    // do not format the very first node in output
    if (!isRoot(node.parent) || !isFirstChild(node)) {
        outNode.beforeOpen = prefix;
    }

    if (!node.isTextOnly && node.value) {
        // node with text: put a space before single-line text,
        // indent for multi-line text
        outNode.beforeText = reNl.test(node.value) ? prefix + profile.indent(1) : ' ';
    }

	return outNode;
}

/**
 * Computes indent level for given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @param  {Number} level
 * @return {Number}
 */
function getIndentLevel(node, profile) {
	let level = node.parent.isTextOnly ? -2 : -1;
	let ctx = node;
	while (ctx = ctx.parent) {
		level++;
	}

	return level < 0 ? 0 : level;
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

/**
 * Formats value of given node: for multiline text we should precede each
 * line with `| ` with one-level deep indent
 * @param  {Node} node
 * @param  {Profile} profile
 * @return {String|null}
 */
function formatNodeValue(node, profile) {
	if (node.value != null && reNl.test(node.value)) {
		const indent = profile.indent(1);
		return splitByLines(node.value).map(line => `${indent}| ${line}`).join('\n');
	}

	return node.value;
}
