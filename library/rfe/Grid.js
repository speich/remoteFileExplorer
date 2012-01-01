define([
	'dojo/_base/Deferred',
	'dojo/_base/declare',
	'dgrid/OnDemandGrid',
	'dgrid/Selection',
	'dgrid/extensions/ColumnResizer',
	'xstyle/has-class',
	'xstyle/css',
	'put-selector/put'
], function(Deferred, declare, Grid, Selection, ColumnResizer) {

	return declare([Grid, Selection, ColumnResizer], {
		selectionMode: 'extended',
		columns: [{
			label: "name",
			field: 'name',
			sortable: false,
			renderCell: function(object, data, td) {
				this.grid.formatImg(object, data, td)
			}
		},{
			label: 'size',
			field: 'size',
			sortable: false,
			formatter: function(value) {
				return this.grid.formatFileSize(value)
			}
		},{
			label: 'type',
			field: 'dir',
			sortable: false,
			formatter: function(value) {
				return this.grid.formatType(value);
			}
		},{
			label: 'last modified',
			field: 'mod',
			sortable: false
		}],

		dndController: null,

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
			return value ? 'directory' : 'file';
		},

		/**
		 * Create HTML string to display file type icon in grid
		 * @param {string} item
		 */
		formatImg: function(object, data, td) {
			var strClass = object.dir ? 'dijitFolderClosed' : 'dijitLeaf';
			var str = '<span>';
			str += '<img class="dijitTreeIcon ' + strClass;
			str += '" alt="" src="' + require.toUrl("dojo/resources/blank.gif") + '"/>' + object.name;
			str += '</span>';
			td.innerHTML = str;
		}
    });

});