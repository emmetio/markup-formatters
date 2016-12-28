const assert = require('assert');
const parse = require('@emmetio/abbreviation');
const Profile = require('@emmetio/output-profile');
const replaceVariables = require('@emmetio/variable-resolver');
require('babel-register');
const pug = require('../format/pug').default;

describe('Pug formatter', () => {
    const expand = (abbr, profile) => pug(replaceVariables(parse(abbr)), profile || new Profile());

    it('basic', () => {
		assert.equal(expand('div#header>ul.nav>li[title=test].nav-item*2'),
			'#header\n\tul.nav\n\t\tli.nav-item(title="test")\n\t\tli.nav-item(title="test")');

		assert.equal(expand('div#foo[data-n1=v1 title=test data-n2=v2].bar'),
			'#foo.bar(data-n1="v1", title="test", data-n2="v2")');

		assert.equal(expand('input[disabled. foo title=test]'), 'input(disabled, foo="", title="test")');
    });

	it('nodes with text', () => {
		assert.equal(expand('{Text 1}'), 'Text 1');
		assert.equal(expand('span{Text 1}'), 'span Text 1');
		assert.equal(expand('span{Text 1}>b{Text 2}'), 'span Text 1\n\tb Text 2');
		assert.equal(expand('span{Text 1\nText 2}>b{Text 3}'), 'span\n\t| Text 1\n\t| Text 2\n\tb Text 3');
		assert.equal(expand('div>span{Text 1\nText 2}>b{Text 3}'), 'div\n\tspan\n\t\t| Text 1\n\t\t| Text 2\n\t\tb Text 3');
	});

	it('generate fields', () => {
		const profile = new Profile({field: (index, placeholder) => `\${${index}${placeholder ? ':' + placeholder : ''}}`});
		assert.equal(expand('a[href]', profile), 'a(href="${1}")${2}');
		assert.equal(expand('a[href]*2', profile), 'a(href="${1}")${2}\na(href="${3}")${4}');

		assert.equal(expand('{${0} ${1:foo} ${2:bar}}*2', profile), '${1} ${2:foo} ${3:bar}${4} ${5:foo} ${6:bar}');
		assert.equal(expand('{${0} ${1:foo} ${2:bar}}*2'), ' foo bar foo bar');

        assert.equal(expand('ul>li*2', profile), 'ul\n\tli${1}\n\tli${2}');

		assert.equal(expand('div>img[src]/', profile), 'div\n\timg(src="${1}")');
	});
});
