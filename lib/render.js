'use strict';

import parseFields from '@emmetio/field-parser';
import OutputNode from './output-node';

/**
 * Default output of field (tabstop)
 * @param  {Number} index       Field index
 * @param  {String} placeholder Field placeholder, can be null
 * @return {String}
 */
const defaultField = (index, placeholder) => (placeholder || '');

/**
 * Renders given parsed abbreviation `tree` via `formatter` function.

 * @param {Node}     tree      Parsed Emmet abbreviation
 * @param {Function} [field]   Optional function to format field/tabstop (@see `defaultField`)
 * @param {Function} formatter Output formatter function. It takes an output node—
 * a special wrapper for parsed node that holds formatting and output properties—
 * and updates its output properties to shape-up node’s output.
 * Function arguments:
 * 	– `outNode`: OutputNode
 * 	– `renderFields`: a helper function that parses fields/tabstops from given
 * 	   text and replaces them with `field` function output.
 * 	   It also takes care about field indicies and ensures that the same indicies
 * 	   from different nodes won’t collide
 */
export default function render(tree, field, formatter) {
    if (typeof formatter === 'undefined') {
        formatter = field;
        field = null;
    }

    field = field || defaultField;

    // Each node may contain fields like `${1:placeholder}`.
	// Since most modern editors will link all fields with the same
	// index, we have to ensure that different nodes has their own indicies.
	// We’ll use this `fieldState` object to globally increment field indices
	// during output
	const fieldState = { index: 1 };

    const fieldsRenderer = text => text == null
        ? field(fieldState.index++)
        : getFieldsModel(text, fieldState).mark(field);

	return run(tree.children, formatter, fieldsRenderer);
}

function run(nodes, formatter, fieldsRenderer) {
	return nodes.filter(notGroup).map(node => {
		const outNode = formatter(new OutputNode(node, fieldsRenderer));
		return outNode ? outNode.toString(run(node.children, formatter, fieldsRenderer)) : '';
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
