'use strict';

import parseFields from '@emmetio/field-parser';

/**
 * Various utility methods used by formatters
 */

/**
 * Formats given text: parses fields and outputs them according to profile
 * preferences
 * @param  {String} text
 * @param  {Profile} profile
 * @param  {Object} field
 * @return {String}
 */
export function formatText(text, profile, fieldState) {
	if (text == null) {
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
export function getFieldsModel(text, fieldState) {
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
 * Check if given node is a first child in its parent
 * @param  {Node}  node
 * @return {Boolean}
 */
export function isFirstChild(node) {
	return node.parent.firstChild === node;
}

/**
 * Check if given node is a last child in its parent node
 * @param  {Node}  node
 * @return {Boolean}
 */
export function isLastChild(node) {
	return node.parent.lastChild === node;
}

/**
 * Check if given node is a root node
 * @param  {Node}  node
 * @return {Boolean}
 */
export function isRoot(node) {
	return node && !node.parent;
}

/**
 * Handles pseudo-snippet node.
 * A pseudo-snippet is a text-only node with explicitly defined children.
 * For such case, we have to figure out if pseudo-snippet contains fields
 * (tab-stops) in node value and “split” it: make contents before field with
 * lowest index node’s “open” part and contents after lowest index — “close”
 * part. With this trick a final output will look like node’s children
 * are nested inside node value
 * @param  {OutputNode} outNode
 * @param  {Profile}  profile
 * @param  {Objects}  fieldState
 * @return {Boolean} Returns “true” if given node is a pseudo-snippets,
 * `false` otherwise
 */
export function handlePseudoSnippet(outNode, profile, fieldState) {
	const node = outNode.node; // original abbreviaiton node
	fieldState = fieldState || { index: 0 };

	if (node.isTextOnly && node.children.length) {
		const fieldsModel = parseFields(node.value);
		const field = findLowestIndexField(fieldsModel);
		const marker = (index, placeholder) => profile.field(index, placeholder);
		if (field) {
			const parts = splitFieldsModel(fieldsModel, field);
			outNode.open = getFieldsModel(parts[0], fieldState).mark(marker);
			outNode.close = getFieldsModel(parts[1], fieldState).mark(marker);
		} else {
			outNode.text = getFieldsModel(fieldsModel, fieldState).mark(marker);
		}

		return true;
	}

	return false;
}

/**
 * Finds field with lowest index in given text
 * @param  {String|Object} text
 * @return {Object}
 */
export function findLowestIndexField(text) {
	const model = typeof text === 'string' ? parseFields(text) : text;
	return model.fields.reduce((result, field) =>
		!result || field.index < result.index ? field : result
		, null);
}

/**
 * Splits given fields model in two parts by given field
 * @param  {Object} model
 * @param  {Object} field
 * @return {Array} Two-items array
 */
export function splitFieldsModel(model, field) {
	const ix = model.fields.indexOf(field);
	const left = Object.assign({}, model, {
		string: model.string.slice(0, field.location),
		fields: model.fields.slice(0, ix)
	});
	const right = Object.assign({}, model, {
		string: model.string.slice(field.location + field.length),
		fields: model.fields.slice(ix + 1)
	});

	return [left, right];
}
