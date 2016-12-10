'use strict';

const assert = require('assert');
require('babel-register');
const Profile = require('../lib/profile').default;

describe('Profile', () => {
	const attr = (name, value, options) => ({name, value, options: options || {}});

	it('tag name', () => {
		let profile = new Profile({tagCase: ''});
		assert.equal(profile.name('Foo'), 'Foo');
		assert.equal(profile.name('bAr'), 'bAr');

		profile = new Profile({tagCase: 'upper'});
		assert.equal(profile.name('Foo'), 'FOO');
		assert.equal(profile.name('bAr'), 'BAR');

		profile = new Profile({tagCase: 'lower'});
		assert.equal(profile.name('Foo'), 'foo');
		assert.equal(profile.name('bAr'), 'bar');
	});

	it('attribute name', () => {
		let profile = new Profile({attributeCase: ''});
		assert.equal(profile.attribute('Foo'), 'Foo');
		assert.equal(profile.attribute('bAr'), 'bAr');

		profile = new Profile({attributeCase: 'upper'});
		assert.equal(profile.attribute('Foo'), 'FOO');
		assert.equal(profile.attribute('bAr'), 'BAR');

		profile = new Profile({attributeCase: 'lower'});
		assert.equal(profile.attribute('Foo'), 'foo');
		assert.equal(profile.attribute('bAr'), 'bar');
	});

	it('full attribute', () => {
		let profile = new Profile({
			attributeCase: '',
			attributeQuote: 'double'
		});
		assert.equal(profile.attribute(attr('foo', 'bar')), 'foo="bar"');
		assert.equal(profile.attribute(attr('Foo', 'bAr')), 'Foo="bAr"');
		assert.equal(profile.attribute(attr('foo', null)), 'foo=""');
	});

	it('boolean attributes', () => {
		let profile = new Profile({
			attributeCase: 'lower',
			attributeQuote: 'double',
			compactBooleanAttributes: false
		});

		assert.equal(profile.attribute(attr('foo', null, {boolean: true})), 'foo="foo"');

		profile = new Profile({
			attributeCase: 'lower',
			attributeQuote: 'double',
			compactBooleanAttributes: true
		});

		assert.equal(profile.attribute(attr('foo', null, {boolean: true})), 'foo');
	});

	it('implied attributes', () => {
		let profile = new Profile({
			attributeCase: 'lower',
			attributeQuote: 'double'
		});

		assert.equal(profile.attribute(attr('foo', null, {implied: true})), '');
		assert.equal(profile.attribute(attr('foo', '', {implied: true})), 'foo=""');
		assert.equal(profile.attribute(attr('foo', 'bar', {implied: true})), 'foo="bar"');
	});
});
