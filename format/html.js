'use strict';

import parseFields from '@emmetio/field-parser';
import formatter from '../lib/formatter';
import Format from '../lib/format';

/**
 * Outputs given parsed abbreviation as HTML
 * @param {Node} tree Parsed abbreviation tree
 * @param {Profile} Output profile (@see @emmetio/output-profile)
 * @return {String}
 */
export default function(tree, profile) {
	// Each node may contain fields like `${1:placeholder}`.
	// Since most modern editors will link all fields with the same
	// index, we have to ensure that different nodes has their on indicies.
	// We’ll use this `field` object to globally increment field indices
	// during output
	const fieldState = { index: 1 };

	return formatter(tree, (node, level, next) => {
        if (node.isTextOnly) {
            return formatText(node.value, profile, fieldState) + next();
        }

        if (node.isGroup) {
            return next();
        }

        const f = getFormat(node, level, profile);
        const attrs = node.attributes
		.map(attr => formatAttribute(attr, profile, fieldState))
		.filter(Boolean)
		.join(' ');

        return f.open(`<${node.name}${attrs ? ' ' + attrs : ''}${profile.selfClose()}>`)
            + f.text(formatText(node.value, profile, fieldState))
            + next()
            + f.close(!node.selfClosing ? `</${node.name}>` : '');
	});
};

/**
 * Get formatting options for given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @return {Format}
 */
function getFormat(node, level, profile) {
	const popt = profile.options;
	const format = new Format();

	if (!popt.format) {
		return format;
	}

	const nl = '\n';
	const nodeName = node.name || '';
	const indentLevel = popt.formatSkip.has(nodeName.toLowerCase()) ? 0 : level;
	format.indent = profile.indent(indentLevel);
	format.newline = nl;

	if (popt.formatTagNewline !== false) {
		let forceNl = popt.formatTagNewline === true
			&& (popt.formatTagNewlineLeaf || node.children.length);

		if (!forceNl) {
			forceNl = popt.formatForce.has(nodeName);
		}

		// formatting block-level elements
		if (shouldAddLineBreakBefore(node, profile)) {
			// do not indent the very first element
			if (!isVeryFirstChild(node)) {
				format.beforeOpen = nl + format.indent;
			}

			if (shouldBreakChild(node, profile) || (forceNl && !node.selfClosing)) {
				format.beforeClose = nl + format.indent;
			}

			if (forceNl && !item.children.length && !node.selfClosing) {
				item.afterOpen = nl + format.indent;
			}
		} else if (profile.isInline(node) && hasBlockSibling(node, profile) && !isVeryFirstChild(node)) {
			item.beforeOpen = nl;
		} else if (profile.isInline(node) && shouldBreakInsideInline(node, profile)) {
			item.beforeClose = nl;
		}
	}

    return format;
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

	let largestIndex = -1;
	const model = parseFields(text);
	model.fields.forEach(field => {
		field.index += fieldState.index;
		if (field.index > largestIndex) {
			largestIndex = field.index;
		}
	});

	if (largestIndex !== -1) {
		fieldState.index = largestIndex + 1;
	}

	return model.mark((index, placeholder) => profile.field(index, placeholder));
}

/**
 * Check if given node has block-level sibling element
 * @param {Node} node Abbreviation node
 * @param {Profile} profile Output profile
 * @return {Boolean}
 */
function hasBlockSibling(node, profile) {
	return node.parent && hasBlockChildren(node.parent, profile);
}

/**
 * Check if given node contains block-level children
 * @param  {Node}     node    Abbreviation node
 * @param  {Profile}  profile Output profile
 * @return {Boolean}
 */
function hasBlockChildren(node, profile) {
	return node.children.some(child => !profile.isInline(child));
}

/**
 * Check if given node is a very first child in parsed tree
 * @param  {Node} node
 * @return {Boolean}
 */
function isVeryFirstChild(node) {
	return isRoot(node.parent) && node.parent.firstChild === node;
}

/**
 * Check if a newline should be added before given node
 * @param {Node} node
 * @param {Profile} profile
 * @return {Boolean}
 */
function shouldAddLineBreakBefore(node, profile) {
	if (isRoot(node) || !profile.options.inlineBreak) {
		return false;
	}

	if (profile.options.formatTagNewline === true || !profile.isInline(node)) {
		return true;
	}

	// check if there are required amount of adjacent inline element
	return shouldFormatInline(node.parent, profile);
}

/**
 * Add newline because `node` has too many inline children
 * @param {Node} node
 * @param {Profile} profile
 */
function shouldBreakChild(node, profile) {
	// we need to test only one child element, because
	// hasBlockChildren() method will do the rest
	return node.children.length && (
		hasBlockChildren(node, profile)
		|| shouldAddLineBreakBefore(node.firstChild, profile)
	);
}

/**
 * Check if we should format inline elements inside given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @return {Boolean}
 */
function shouldFormatInline(node, profile) {
	let inlineSiblings = 0;
	return node.children.some(child => {
		if (child.isTextOnly || !profile.isInline(child)) {
			inlineSiblings = 0;
		} else if (profile.isInline(child)) {
			inlineSiblings++;
		}

		return inlineSiblings >= profile.options.inlineBreak;
	});
}

/**
 * Check if given node is a root node
 * @param  {Node}  node
 * @return {Boolean}
 */
function isRoot(node) {
	return node && !node.parent;
}

/**
 * Check if we should add line breaks inside inline element
 * @param {AbbreviationNode} node
 * @param {Profile} profile
 * @return {Boolean}
 */
function shouldBreakInsideInline(node, profile) {
	return hasBlockChildren(node, profile) || shouldFormatInline(node, profile);
}
