'use strict';

const assert = require('assert');
require('babel-register');
const Format = require('../lib/format').default;

describe('Format', () => {
    it('open', () => {
        const f = new Format({
            beforeOpen: '<',
            afterOpen: '>'
        });

        assert.equal(f.open('a'), '<a>');
    });

    it('close', () => {
        const f = new Format({
            beforeClose: '</',
            afterClose: '>'
        });

        assert.equal(f.close('a'), '</a>');
    });

    it('text', () => {
        let f = new Format({
            indent: '\t',
            newline: '\n'
        });

        assert.equal(f.text('a\r\nb\rc\nd'), 'a\n\tb\n\tc\n\td');

        f = new Format();
        assert.equal(f.text('a\r\nb\rc\nd'), 'a b c d');
    });
});
