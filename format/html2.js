'use strict';

import parseFields from '@emmetio/field-parser';
import output from '../lib/output-builder';
import Format from '../lib/format';

export default function(tree, profile) {
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

        const format = formats.get(node);

        const attrs = node.attributes
		.map(attr => formatAttribute(attr, profile, fieldState))
		.filter(Boolean)
		.join(' ');

        return format.open(node.name ? `<${node.name}${attrs ? ' ' + attrs : ''}${profile.selfClose()}>` : '')
            + format.text(formatText(node.value, profile, fieldState))
            + next()
            + (node.name && !node.selfClosing ? format.close(`</${node.name}>`) : '');
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
        // decrease indent level:
        // * if parent node is a text-only node
        // * if current node name is explicitly set to decrease level
        const nodeName = (node.name || '').toLowerCase();
        if (level && (node.parent.isTextOnly || profile.options.formatSkip.has(nodeName))) {
            level--;
        }

		const format = getFormat(node);
		format.indent = profile.indent(level);
		format.newline = '\n';

		if (shouldFormatNode(node, profile)) {
			format.beforeOpen = format.newline + format.indent;

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
	if (isFirstChild(node) && isRoot(node.parent)) {
		// do not format the very first node in output
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

    if (profile.options.inlineBreak) {
        // check for adjacent inline elements before and after current element
        let adjacentInline = 1;
        let before = node, after = node;

        while (isInlineElement((before = before.previousSibling), profile)) {
            adjacentInline++;
        }

        while (isInlineElement((after = after.nextSibling), profile)) {
            adjacentInline++;
        }

        return adjacentInline >= profile.options.inlineBreak;
    }

    return false;
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
	return `${attrName}=${profile.quote(formatText(attr.value, profile, fieldState))}`;
}

/**
 * Formats given text: parses fields and outputs them according to profile
 * preferences
 * @param  {String} text
 * @param  {Profile} profile
 * @param  {Object} field
 * @return {String}
 */
function formatText(text, profile, fieldState) {
	if (text == null || text === '') {
		return profile.field(fieldState.index++);
	}

	const model = getFieldsModel(text, fieldState);
	return model.mark((index, placeholder) => profile.field(index, placeholder));
}

/**
 * Returns fields (tab-stops) model with properly updated indices that won’t
 * collide with fields in other nodes of foprmatted tree
 * @param  {String|Object} text Text to get fields model from or model itself
 * @param  {Object} fieldState Abbreviation tree-wide field state reference
 * @return {Object} Field model
 */
function getFieldsModel(text, fieldState) {
	const model = typeof text === 'object' ? text : parseFields(text);
    let largestIndex = -1;

    model.fields.forEach(field => {
		field.index += fieldState.index;
		if (field.index > largestIndex) {
			largestIndex = field.index;
		}
	});

	if (largestIndex !== -1) {
		fieldState.index = largestIndex + 1;
	}

    return model;
}

/**
 * Check if given node is inline-level
 * @param  {Node}  node
 * @param  {Profile}  profile
 * @return {Boolean}
 */
function isInline(node, profile) {
	return node && (node.isTextOnly || profile.isInline(node));
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
 * Check if given node is a first child in its parent
 * @param  {Node}  node
 * @return {Boolean}
 */
function isFirstChild(node) {
	return node.parent.firstChild === node;
}

/**
 * Check if given node is a last child in its parent node
 * @param  {Node}  node
 * @return {Boolean}
 */
function isLastChild(node) {
	return node.parent.lastChild === node;
}

/**
 * Check if given node is a root node
 * @param  {Node}  node
 * @return {Boolean}
 */
function isRoot(node) {
	return node && !node.parent;
}
