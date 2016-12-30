'use strict';

import render from '../lib/render';
import { getIndentLevel, formatAttributes } from './assets/indent-formats';
import { splitByLines, handlePseudoSnippet, isFirstChild, isRoot } from '../lib/utils';

const reOmitName = /^div$/i;
const reNl = /\n|\r/;
const hasPrimaryAttrs = /^[.#]/;
const secondaryAttributesWrap = {
	none:   attrs => ` ${attrs}`,
	round:  attrs => `(${attrs})`,
	curly:  attrs => `{${attrs}}`,
	square: attrs => `[${attrs}]`
};

/**
 * Renders given parsed Emmet abbreviation as Slim, formatted according to
 * `profile` options
 * @param  {Node}    tree      Parsed Emmet abbreviation
 * @param  {Profile} profile   Output profile
 * @param  {Object}  [options] Additional formatter options
 * @return {String}
 */
export default function slim(tree, profile, options) {
	options = options || {};
	const wrap = options.attributeWrap
		&& secondaryAttributesWrap[options.attributeWrap]
		|| secondaryAttributesWrap.none;

	const attrOptions = {
		secondary(attrs) {
			const str = attrs.map(attr => attr.isBoolean
				? (wrap === secondaryAttributesWrap.none ? `${attr.name}=true` : attr.name)
				: `${attr.name}=${profile.quote(attr.value)}`
			).join(' ');
			return str ? wrap(str) : '';
		}
	};

	// In case of absent attribute wrapper, output boolean attributes differently
	if (attrOptions.wrap === 'none') {
		attrOptions.boolean = name => `${name}=true`
	}

	return render(tree, options.field, (outNode, renderFields) => {
		outNode = setFormatting(outNode, profile);

		if (!handlePseudoSnippet(outNode, renderFields)) {
			const node = outNode.node;

			if (node.name) {
                const name = profile.name(node.name);
				const attrs = formatAttributes(node, profile, renderFields, attrOptions);
				// omit tag name if node has primary attributes
				const canOmitName = attrs && hasPrimaryAttrs.test(attrs) && reOmitName.test(name);

				outNode.open = (canOmitName ? '' : name) + attrs + (node.selfClosing ? '/' : '');
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
 * NB Unlike HTML, Slim is indent-based format so some formatting options from
 * `profile` will not take effect, otherwise output will be broken
 * @param  {OutputNode} outNode Output wrapper of farsed abbreviation node
 * @param  {Profile}    profile Output profile
 * @return {OutputNode}
 */
function setFormatting(outNode, profile) {
	const node = outNode.node;
	const parent = node.parent;

    outNode.indent = profile.indent(getIndentLevel(node, profile));
    outNode.newline = '\n';
    const prefix = outNode.newline + outNode.indent;

	// Edge case: a single inline-level child inside node without text:
	// allow it to be inlined
	if (profile.get('inlineBreak') === 0 && isInline(node, profile)
		&& !isRoot(parent) && parent.value == null && parent.children.length === 1) {
		outNode.beforeOpen = ': ';
	} else if (!isRoot(node.parent) || !isFirstChild(node)) {
		// Do not format the very first node in output
        outNode.beforeOpen = prefix;
    }

    if (!node.isTextOnly && node.value) {
        // node with text: put a space before single-line text
        outNode.beforeText = reNl.test(node.value) ? prefix + profile.indent(1) : ' ';
    }

	return outNode;
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
		return splitByLines(node.value).map((line, i) => `${indent}${i ? ' ' : '|'} ${line}`).join('\n');
	}

	return node.value;
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
