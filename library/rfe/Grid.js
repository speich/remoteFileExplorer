define([
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/_base/declare',
	'dgrid/OnDemandGrid',
	'dgrid/Selection',
	'dgrid/Editor',
	'dgrid/Keyboard',
	'dgrid/extensions/ColumnResizer',
	'xstyle/has-class',
	'xstyle/css',
	'put-selector/put'
], function(lang, Deferred, declare, Grid, Selection, Editor, Keyboard, ColumnResizer) {


	/**
	 * Create HTML string to display file type icon in grid
	 * @param {string} item
	 */
	function formatImg(object, data, td) {
		var strClass = object.dir ? 'dijitFolderClosed' : 'dijitLeaf';
		var str = '<span>';
		str += '<img class="dijitTreeIcon ' + strClass;
		str += '" alt="" src="' + require.toUrl("dojo/resources/blank.gif") + '"/>' + object.name;
		str += '</span>';
		td.innerHTML = str;
	}

	/**
	 * Format integer to display file size in kilobyte.
	 * @param {string} value
	 */
	function formatFileSize(value) {
		return Math.round(value / 1000 * 10) / 10 + 'kb';
	}

	/**
	 * Return file type.
	 * @param {string} value
	 */
	function formatType(value) {
		return value ? 'directory' : 'file';
	}

	return declare([Grid, Selection, Editor, Keyboard, ColumnResizer], {

		selectionMode: 'extended',
		columns: [
			Editor({
				label: "name",
				field: 'name',
				sortable: false,
				renderCell: function(object, data, td) {
					formatImg(object, data, td)
				}
			}, 'text', 'dgrid-cellfocusin, click'), {
				label: 'size',
				field: 'size',
				sortable: false,
				formatter: function(value) {
					return formatFileSize(value)
				}
			}, {
				label: 'type',
				field: 'dir',
				sortable: false,
				formatter: function(value) {
					return formatType(value);
				}
			}, {
				label: 'last modified',
				field: 'mod',
				sortable: false
			}
		]



	});
});