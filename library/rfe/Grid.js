define([
	'dojo/_base/Deferred',
	'dgrid/OnDemandGrid',
	'dgrid/extensions/ColumnResizer',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/on',
	'dojo/dom',
	'dojo/dom-style',
	'dojo/date/locale',
	'xstyle/has-class',
	'xstyle/css',
	'put-selector/put'
], function(Deferred, Grid, ColumnResizer, declare, lang, on, dom, domStyle, locale) {

	return declare([Grid, ColumnResizer], {
		columns: [{
			label: "name",
			field: 'name',
			sortable: false,
			renderCell: this.formatImg
		},{
			label: 'size',
			field: 'size',
			sortable: false,
			formatter: this.formatFileSize
		},{
			label: 'type',
			field: 'dir',
			sortable: false,
			formatter: this.formatType
		},{
			label: 'last modified',
			field: 'mod',
			sortable: false
		}],

		dndController: null,
		loadingMessage: 'loading data...',

		/**
		 * Format integer to display file size in kilobyte.
		 * @param {string} value
		 */
		formatFileSize: function(value) {
			return Math.round(value / 1000 * 10) / 10 + 'kb';
		},

		/**
		 * Return file type.
		 * @param {string} value
		 */
		formatType: function(value) {
			// TODO: return correct file type
			if (value === true || value instanceof Array) {
				value = 'directory';
			}
			else {
				value = 'file';
			}
			return value;
		},

		/**
		 * Create HTML string to display file type icon in grid
		 * @param {string} item
		 */
		formatImg: function(object, data, td, options) {
			var strClass = object.dir ? 'dijitFolderClosed' : 'dijitLeaf';
			var str = '<span>';
			str += '<img class="dijitTreeIcon ' + strClass;
			str += '" alt="" src="' + require.toUrl("dojo/resources/blank.gif") + '"/>' + object.name;
			str += '</span>';
			td.innerHTML = str;

		}
    });

});