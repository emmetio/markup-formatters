'use strict';

import formatter from '../lib/formatter';
import Format from '../lib/format';

/**
 * Outputs given parsed abbreviation as HTML
 * @param {Node} tree Parsed abbreviation tree
 * @param {Profile} Output profile (@see @emmetio/output-profile)
 * @return {String}
 */
export default function(tree, profile) {
	return formatter(tree, (node, level, next) => {
        if (node.isTextOnly) {
            return node.value + next();
        }

        if (node.isGroup) {
            return next();
        }

        const f = getFormat(node, level, profile);
        const attrs = node.attributes.map(attr => profile.attribute(attr, '=')).join(' ');

        return f.open(`<${node.name}${attrs ? ' ' + attrs : ''}${profile.selfClose()}>`)
            + f.text(node.value)
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
			&& (profile.formatTagNewlineLeaf || node.children.length);

		if (!forceNl) {
			forceNl = popt.formatForce.has(nodeName);
		}

		// formatting block-level elements
		if (!node.isTextOnly) {
			if (shouldAddLineBreakBefore(node, profile)) {
				// do not indent the very first element
				if (!isVeryFirstChild(node)) {
					format.beforeOpen = nl + format.indent;
				}

				if (hasBlockChildren(node, profile)
					|| shouldBreakChild(node, profile)
					|| (forceNl && !node.selfClosing)) {
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
	}

    return format;
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
	return node.children.length && shouldAddLineBreakBefore(node.firstChild, profile);
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
