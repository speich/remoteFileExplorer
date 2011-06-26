dojo.provide('rfe.Grid');

dojo.require('dojox.grid.DataGrid');
dojo.require('rfe.dnd.GridSource');

rfe.Grid = {

	init: function(id, store, fe) {
		var grid, self = this;
		
		dojo.extend(dojox.grid.DataGrid, {
			dndController: null,
			onStyleRow: this.onStyleRow,
			onMouseDown: this.onMouseDownRow
		});
	
		// enable drag and drop in grid
		grid = new dojox.grid.DataGrid({
			id: id,
			store: store,
			rowSelector: true,
			selectionMode: 'extended',
			columnReordering: true,
			autoHeight: false,
			defaultHeight: '100%',
			initialWidth: '100%',
			loadingMessage: 'loading data...',
			structure: [
				/*{
				name:  null,
				field: '_item', 	// there is a bug in 1.5 that prevents sorting on _item
				formatter: this.formatImg,
				width: '5%'
				}, */
				{
					name: "name",
					field: 'name',
					width: '35%',
					formatter: function(value, idx) {
						var item = this.grid.getItem(idx);
						return self.formatImg(item);
					}
				}, {
					name: "size",
					field: "size",
					formatter: this.formatFileSize,
					width: '20%'
				}, {
					name: 'type',
					field: 'dir',
					formatter: this.formatType,
					width: '20%'
				}, {
					name: 'last modified',
					field: 'mod',
					width: '20%'
				}
			]		
		});
		// add drag and drop to the grid
		grid.dndController = new rfe.dnd.GridSource(grid, {
			accept: ['text', 'treeNode', 'gridNode'],
			rfe: fe
		})
		
		return grid;
	},

	onStyleRow: function(inRow) {
		// overrides to make all rows look the same when selected
		inRow.customClasses += (inRow.selected ? " dojoxGridRowSelected" : "") + (inRow.over ? " dojoxGridRowOver" : "");
		this.focus.styleRow(inRow);
		this.edit.styleRow(inRow);
	},
	
	onMouseDownRow: function(evt) {
		this.selection.clickSelectEvent(evt);	// select also on right click for context menu
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
};