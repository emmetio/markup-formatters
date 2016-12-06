'use strict';

import defaults from './lib/defaults';
import Profile from './lib/profile';

/**
 * Outputs given parsed abbreviation as HTML
 * @param {Node} tree Parsed abbreviation tree
 * @param {Object} Output options
 * @return {String}
 */
export default function outputHTML(tree, options) {
    options = Object.assign({}, defaults, options);
};
