'use strict';

import parseFields from '@emmetio/field-parser';
import output from '../lib/output-builder';
import Format from '../lib/format';
import OutputNode from '../lib/output-node';
import { formatText, handlePseudoSnippet, isFirstChild, isLastChild, isRoot } from '../lib/utils';

/**
 * Outputs given parsed Emmet abbreviation as HTML, formatted according to
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
				const nodeName = profile.name(node.name);
				const attrs = node.attributes
				.map(attr => formatAttribute(attr, profile, fieldState))
				.filter(Boolean)
				.join(' ');

				outNode.open = `<${nodeName}${attrs ? ' ' + attrs : ''}${node.selfClosing ? profile.selfClose() : ''}>`;
				if (!node.selfClosing) {
					outNode.close = `</${nodeName}>`;
				}
			}

			let nodeValue = node.value;
			// Do not generate fields for nodes with empty value and children
			// or if node is self-closed
			if (nodeValue == null && (node.children.length || node.selfClosing)) {
				nodeValue = '';
			}

            outNode.text = formatText(nodeValue, profile, fieldState);
		}

		if (typeof postProcess === 'function') {
			outNode = postProcess(outNode, profile);
		}

        return outNode ? outNode.toString(next()) : '';
	});
}

/**
 * Returns format objects for every node in given tree
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
            if (node.isTextOnly) {
                format.beforeText = format.beforeOpen;
            }

			if (shouldForceFormat(node, profile)) {
				format.afterOpen = format.newline + profile.indent(fLevel + 1);
				format.beforeClose = format.newline + format.indent;
			}

			// if it’s a first child of parent node, make sure parent node
			// contains formatting for its text value
			if (isFirstChild(node) && !node.parent.isTextOnly && node.parent.value) {
				const parentFormat = getFormat(node.parent);
				parentFormat.afterOpen = format.beforeOpen;
			}

			// make sure closing tag of parent non-root element is formatted as well
			if (isLastChild(node) && !isRoot(node.parent)) {
				const parentFormat = getFormat(node.parent);
				parentFormat.beforeClose = parentFormat.newline + parentFormat.indent;
			}
		}
	});

	return formats;
}

/**
 * Check if given node should be formatted
 * @param  {Node} node
 * @param  {Profile} profile
 * @return {Boolean}
 */
function shouldFormatNode(node, profile) {
	if (!profile.get('format')) {
		// do not format the very first node in output
		return false;
	}

	if (isFirstChild(node) && isRoot(node.parent)) {
		// do not format the very first node in output
		return false;
	}

    if (node.parent.isTextOnly
        && node.parent.children.length === 1
        && parseFields(node.parent.value).fields.length) {
        // Edge case: do not format the only child of text-only node,
        // but only if parent contains fields
        return false;
    }

	return isInline(node, profile) ? shouldFormatInline(node, profile) : true;
}

/**
 * Check if given inline node should be formatted as well, e.g. it contains
 * enough adjacent siblings that should force formatting
 * @param  {Node} node
 * @param  {Profile} profile
 * @return {Boolean}
 */
function shouldFormatInline(node, profile) {
	if (!isInline(node, profile)) {
		return false;
	}

    if (node.isTextOnly && node.children.length) {
        return true;
    }

    // check if inline node is the next sibling of block-level node
    if (node.childIndex === 0) {
        // first node in parent: format if it’s followed by a block-level element
        let next = node;
        while (next = next.nextSibling) {
            if (!isInline(next, profile)) {
                return true;
            }
        }
    } else if (!isInline(node.previousSibling, profile)) {
        // node is right after block-level element
        return true;
    }

    if (profile.get('inlineBreak')) {
        // check for adjacent inline elements before and after current element
        let adjacentInline = 1;
        let before = node, after = node;

        while (isInlineElement((before = before.previousSibling), profile)) {
            adjacentInline++;
        }

        while (isInlineElement((after = after.nextSibling), profile)) {
            adjacentInline++;
        }

        return adjacentInline >= profile.get('inlineBreak');
    }

    return false;
}

/**
 * Check if given node should have forced inner formatting
 * @param  {Node} node
 * @param  {Profile} profile
 * @return {Boolean}
 */
function shouldForceFormat(node, profile) {
	return node && node.name
		&& profile.get('formatForce').indexOf(node.name.toLowerCase()) !== -1;
}

/**
 * Formats given attribute
 * @param  {Attribute} attr
 * @param  {Profile} profile
 * @param  {Object} fieldState
 * @return {String}
 */
function formatAttribute(attr, profile, fieldState) {
	if (attr.options.implied && attr.value == null) {
		return null;
	}

	const attrName = profile.attribute(attr.name);
	let attrValue = null;
	if (attr.options.boolean || profile.get('booleanAttributes').indexOf(attrName.toLowerCase()) !== -1) {
		if (profile.get('compactBooleanAttributes') && attr.value == null) {
			return attrName;
		} else if (attr.value == null) {
			attrValue = attrName;
		}
	}

	if (attrValue == null) {
		attrValue = formatText(attr.value, profile, fieldState);
	}

	return `${attrName}=${profile.quote(attrValue)}`;
}

/**
 * Check if given node is inline-level
 * @param  {Node}  node
 * @param  {Profile}  profile
 * @return {Boolean}
 */
function isInline(node, profile) {
	return (node && node.isTextOnly) || isInlineElement(node, profile);
}

/**
 * Check if given node is inline-level element, e.g. element with explicitly
 * defined node name
 * @param  {Node}  node
 * @param  {Profile}  profile
 * @return {Boolean}
 */
function isInlineElement(node, profile) {
	return node && profile.isInline(node);
}

/**
 * Computes indent level for given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @param  {Number} level
 * @return {Number}
 */
function getIndentLevel(node, profile, level) {
	level = level || 0;
	// decrease indent level if:
	// * parent node is a text-only node
	// * there’s a parent node with a name that is explicitly set to decrease level
	if (node.parent.isTextOnly) {
		level--;
	}

	let ctx = node;
	const skip = profile.get('formatSkip');
	while (ctx = ctx.parent) {
		if (skip.indexOf( (ctx.name || '').toLowerCase() ) !== -1) {
			level--;
		}
	}

	return level < 0 ? 0 : level;
}
