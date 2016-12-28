'use strict';

import parseFields from '@emmetio/field-parser';

/**
 * Default output of field (tabstop)
 * @param  {Number} index       Field index
 * @param  {String} placeholder Field placeholder, can be null
 * @return {String}
 */
const defaultField = (index, placeholder) => (placeholder || '');

/**
 * A helper function for easier tree output format:
 * for a given `tree`, takes each child node and runs given `format`
 * function, which should output formatted node. The `format` second
 * argument is a function that runs the same process for node’s (or given)
 * children so you can easily decide where to output children
 */
export default function outputBuilder(tree, field, format) {
    if (typeof format === 'undefined') {
        format = field;
        field = null;
    }
    
    field = field || defaultField;

    // Each node may contain fields like `${1:placeholder}`.
	// Since most modern editors will link all fields with the same
	// index, we have to ensure that different nodes has their own indicies.
	// We’ll use this `fieldState` object to globally increment field indices
	// during output
	const fieldState = { index: 1 };

    const renderFields = text => text == null
        ? field(fieldState.index++)
        : getFieldsModel(text, fieldState).mark(field);

	return run(tree.children, 0, format, renderFields);
}

function run(nodes, level, format, renderFields) {
	return nodes.filter(notGroup).map(node => {
		const next = children => run(children || node.children, level + 1, format, renderFields);
		return format(node, level, renderFields, next);
	}).join('');
}

function notGroup(node) {
    return !node.isGroup;
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
