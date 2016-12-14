'use strict';

/**
 * A helper function for easier tree output format:
 * for a given `tree`, takes each child node and runs given `format`
 * function, which should output formatted node. The `format` second
 * argument is a function that runs the same process for node’s (or given)
 * children so you can easily decide where to output children
 */
export default function formatter(tree, format) {
	return run(tree.children, 0, format);
}

function run(nodes, level, format) {
	return nodes.map(node => {
		const next = children => run(children || node.children, level + 1, format);
		return format(node, level, next);
	}).join('');
}
