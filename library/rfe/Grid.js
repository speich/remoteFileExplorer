define([
	'dojo/_base/declare',
	'dojox/grid/DataGrid'
], function(declare, DataGrid) {

	return declare('rfe.Grid', DataGrid, {

		dndController: null,
		editable: false,
		rowSelector: false,
		selectionMode: 'extended',
		columnReordering: true,
		autoHeight: false,
		height: '100%',
		width: '100%',
		loadingMessage: 'loading data...',
		structure: [{
				name: "name",
				field: 'name',
				width: '35%',
				formatter: function(value, idx) {
					var item = this.grid.getItem(idx);
					return this.grid.formatImg(item);
				}},
			{
				name: "size",
				field: "size",
				width: '20%',
				formatter: function(value) {
					return this.grid.formatFileSize(value);
				}},
			{
				name: 'type',
				field: 'dir',
				width: '20%',
				formatter: function(value) {
					return this.grid.formatType(value);
				}},
			{
				name: 'last modified',
				field: 'mod',
				width: '20%'
			}],

		constructor: function(params) {
			this.id = params.id;
		},

		onStyleRow: function(inRow) {
			// overrides to make all rows look the same when selected
			inRow.customClasses += (inRow.selected ? " dojoxGridRowSelected" : "") + (inRow.over ? " dojoxGridRowOver" : "");
			this.focus.styleRow(inRow);
			this.edit.styleRow(inRow);
		},

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
		formatImg: function(item) {
			var strClass;
			strClass = item.dir ? 'dijitFolderClosed' : 'dijitLeaf';
			var str = '<span>';
			str += '<img class="dijitTreeIcon ' + strClass;
			str += '" alt="" src="library/dojo/dojo/resources/blank.gif"/>' + item.name;
			str += '</span>';
			return str;
		}
	});

});