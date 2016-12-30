'use strict';

/**
 * Common utility methods for indent-based syntaxes (Slim, Pug, etc.)
 */

const reId = /^id$/i;
const reClass = /^class$/i;
const secondaryAttributesWrap = {
	none:   attrs => ` ${attrs}`,
	round:  attrs => `(${attrs})`,
	curly:  attrs => `{${attrs}}`,
	square: attrs => `[${attrs}]`
};

const defaultAttrOptions = {
	wrap: 'none',
	boolean: attrName => attrName,
	separator: ', '
};

/**
 * Formats attributes of given node into a string.
 * @param  {Node}     node          Parsed abbreviation node
 * @param  {Profile}  profile       Output profile
 * @param  {Function} renderFields  Function for rendering text fields/tabstops, @see ../../lib/render.js
 * @param  {Object}   options       Additional formatting options
 * @return {String}
 */
export function formatAttributes(node, profile, renderFields, options) {
	const primary = [], secondary = [];
	options = Object.assign({}, defaultAttrOptions, options);

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

			secondary.push(isBoolean ? options.boolean(name) : `${name}=${profile.quote(value)}`);
		}
	});

	let output = primary.join('');
	if (secondary.length) {
		const secondaryWrap = secondaryAttributesWrap[options.wrap];
		output += secondaryWrap(secondary.join(options.separator));
	}

	return output;
}

/**
 * Computes indent level for given node
 * @param  {Node} node
 * @param  {Profile} profile
 * @param  {Number} level
 * @return {Number}
 */
export function getIndentLevel(node, profile) {
	let level = node.parent.isTextOnly ? -2 : -1;
	let ctx = node;
	while (ctx = ctx.parent) {
		level++;
	}

	return level < 0 ? 0 : level;
}
