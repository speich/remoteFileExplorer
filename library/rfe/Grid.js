define('rfe/Grid', ['dojox/grid/DataGrid', 'rfe/dnd/GridSource', 'dojo/data/ItemFileWriteStore'], function() {

	dojo.declare('rfe.Grid', dojox.grid.DataGrid, {

		dndController: null,

		rowSelector: false,
		selectionMode: 'extended',
		columnReordering: true,
		autoHeight: false,
		defaultHeight: '100%',
		initialWidth: '100%',
		loadingMessage: 'loading data...',

		constructor: function(params) {
			this.id = params.id;

/*			this.store = new dojo.data.ItemFileWriteStore({
				data: {
					identifier: 'id',
					items: []	// will be set on tree click with folder content
				}
			});*/



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
			if (value === true || dojo.isArray(value)) {
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

	return rfe.Grid;
});