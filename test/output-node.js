'use strict';

const assert = require('assert');
require('babel-register');
const OutputNode = require('../lib/output-node').default;

describe('Output Node', () => {
    it('open', () => {
        const node = new OutputNode(null, {
            open: 'a',
            beforeOpen: '<',
            afterOpen: '>'
        });

        assert.equal(node.toString(), '<a>');
    });

    it('close', () => {
        const node = new OutputNode(null, {
            close: 'a',
            beforeClose: '</',
            afterClose: '>'
        });

        assert.equal(node.toString(), '</a>');
    });

    it('text', () => {
        let node = new OutputNode(null,{
            indent: '\t',
            newline: '\n'
        });

        assert.equal(node.indentText('a\r\nb\rc\nd'), 'a\n\tb\n\tc\n\td');

        node = new OutputNode();
        assert.equal(node.indentText('a\r\nb\rc\nd'), 'a b c d');
    });
});
