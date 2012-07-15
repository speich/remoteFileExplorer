define([
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/_base/declare',
	'dojo/query',
	'dgrid/OnDemandGrid',
	'dgrid/Selection',
	'dgrid/editor',
	'dgrid/Keyboard',
	'dgrid/extensions/DnD',
	'dgrid/extensions/ColumnResizer',
	'dgrid/extensions/DijitRegistry',
	'xstyle/has-class',
	'xstyle/css',
	'put-selector/put'
], function(lang, Deferred, declare, query, Grid, Selection, editor, Keyboard, DnD, ColumnResizer) {


	/**
	 * Create HTML string to display file type icon in grid
	 * @param {Object} object
	 */
	function formatImg(object, data, td) {
		var str, strClass = object.dir ? 'dijitFolderClosed' : 'dijitLeaf';
		str = '<span>';
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

	return declare([Grid, Selection, editor, Keyboard, DnD, ColumnResizer], {

		//getBeforePut: false,	// if true save will re-fetch from the store via get, before applying changes represented by dirty data.
		selectionMode: 'extended',
		allowSelectAll: true,
		columns: {
			name: editor({
				editor: 'text',
				editOn: 'dummyEvent',
				autoSave: false,
				label: "name",
				sortable: false,
				renderCell: function(object, data, td) {
					formatImg(object, data, td);
				}
			}),
			size: {
				label: 'size',
				sortable: false,
				formatter: function(value) {
					return formatFileSize(value);
				}
			},
			dir: {
				label: 'type',
				sortable: false,
				formatter: function(value) {
					return formatType(value);
				}
			},
			mod: {
				label: 'last modified',
				sortable: false
			}
		},

		/**
		 * Returns the first row object.
		 * A row object has the properties:
		 *		id: the data object's id
		 *		data: the data object represented by the row
		 *		element: the row's DOM element
		 * @return {object}
		 */
		getFirstRow: function() {
			var nodes = query('.dgrid-row', this.bodyNode);
			return this.row(nodes[0]);
		}

	});
});