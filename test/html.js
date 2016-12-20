const assert = require('assert');
const parse = require('@emmetio/abbreviation');
const Profile = require('@emmetio/output-profile');
const replaceVariables = require('@emmetio/variable-resolver');
require('babel-register');
const html = require('../format/html').default;
const html2 = require('../format/html2').default;

describe('HTML formatter', () => {
    const expand = (abbr, profile) => html2(replaceVariables(parse(abbr)), profile || new Profile());
    // const expand = (abbr, profile) => html2(replaceVariables(parse(abbr)), profile || new Profile());

    it('basic', () => {
        assert.equal(expand('div>p'), '<div>\n\t<p></p>\n</div>');
        assert.equal(expand('div>p*3'), '<div>\n\t<p></p>\n\t<p></p>\n\t<p></p>\n</div>');
        assert.equal(expand('div#a>p.b*2>span'), '<div id="a">\n\t<p class="b"><span></span></p>\n\t<p class="b"><span></span></p>\n</div>');
        assert.equal(expand('div>div>div'), '<div>\n\t<div>\n\t\t<div></div>\n\t</div>\n</div>');

        assert.equal(expand('table>tr*2>td{item}*2'), '<table>\n\t<tr>\n\t\t<td>item</td>\n\t\t<td>item</td>\n\t</tr>\n\t<tr>\n\t\t<td>item</td>\n\t\t<td>item</td>\n\t</tr>\n</table>');
    });

    it('inline elements', () => {
        const profile = new Profile({inlineBreak: 3});
        assert.equal(expand('p>i', profile), '<p><i></i></p>');
        assert.equal(expand('p>i*2', profile), '<p><i></i><i></i></p>');
        assert.equal(expand('p>i*3', profile), '<p>\n\t<i></i>\n\t<i></i>\n\t<i></i>\n</p>');

        assert.equal(expand('i*2', profile), '<i></i><i></i>');
        assert.equal(expand('i*3', profile), '<i></i>\n<i></i>\n<i></i>');
        assert.equal(expand('i{a}+i{b}', profile), '<i>a</i><i>b</i>');

        assert.equal(expand('img[src]/+p', profile), '<img src="">\n<p></p>');
    });

    it('generate fields', () => {
		const profile = new Profile({field: (index, placeholder) => `\${${index}${placeholder ? ':' + placeholder : ''}}`});
		assert.equal(expand('a[href]', profile), '<a href="${1}">${2}</a>');
		assert.equal(expand('a[href]*2', profile), '<a href="${1}">${2}</a><a href="${3}">${4}</a>');

		assert.equal(expand('{${0} ${1:foo} ${2:bar}}*2', profile), '${1} ${2:foo} ${3:bar}${4} ${5:foo} ${6:bar}');
		assert.equal(expand('{${0} ${1:foo} ${2:bar}}*2'), ' foo bar foo bar');
	});

	it('pseudo snippet output & format', () => {
		// console.log(expand('div'));
		// console.log(expand('div>span'));
		console.log(expand('div>{<!-- ${child} -->}>p'));
	});
});
