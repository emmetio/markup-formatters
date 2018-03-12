export default {
	input: './index.js',
	external: ['@emmetio/field-parser', '@emmetio/output-renderer'],
	output: [{
		format: 'cjs',
		exports: 'named',
		sourcemap: true,
		file: 'dist/markup-formatters.cjs.js'
	}, {
		format: 'es',
		exports: 'named',
		sourcemap: true,
		file: 'dist/markup-formatters.es.js'
	}]
};
