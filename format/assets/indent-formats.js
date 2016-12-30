'use strict';

/**
 * Common utility methods for indent-based syntaxes (Slim, Pug, etc.)
 */

const reId = /^id$/i;
const reClass = /^class$/i;
const defaultAttrOptions = {
	primary: attrs => attrs.join(''),
	secondary: attrs => attrs.map(attr => attr.isBoolean ? attr.name : `${attr.name}=${attr.value}`).join(', ')
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

			secondary.push({ name, value, isBoolean });
		}
	});

	return options.primary(primary) + options.secondary(secondary);
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
