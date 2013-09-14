/**
 * Configuration module
 * @module rfe/config/fileObject
 */
define(['rfe/util/stringUtil'], function(stringUtil) {

	return {
		// map file object properties to labels
		label: {
			id: 'Id',
			parId: 'Parent id',
			dir: 'Directory',
			name:	'Name',
			size:	'Size',
			cre: 'Date created',
			mod: 'Date modified',
			mime: 'MIME type'
		},
		// formatter function to use for property value
		formatter: {
			dir: stringUtil.formatType,
			size: stringUtil.formatFileSize,
			cre: stringUtil.formatDate,
			mod: stringUtil.formatDate
		},
		// Items to show as sort options in Toolbar
		sortOptions: ['name', 'size', 'cre', 'mod']
	}
});