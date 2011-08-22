define([
	"dojo/_base/declare",
	'dojo/_base/connect',
	'dojo/on',
	'dojo/mouse',
	"dijit",
	"dojo/dnd/common",
	"rfe/dnd/GridContainer"
], function(declare, connect, on, mouse, dijit, common, GridContainer) {


	return declare("rfe.dnd.GridSelector", GridContainer, {
		// note: grid rows (nodes) do not have an id attribute -> The grid.Selection uses the rowIndex instead
		// -> Create own dictionary object keyed by ids of selected nodes as required by the dnd.Selector api.

		constructor: function() {
			var sel = this.grid.selection;
			// summary:
			//		Initialization
			// tags:
			//		private
			this.selection = {};	// maps node.id to lookup to find dndItem from rowNode.

			this.events.push(
				on(sel, 'Selected', this, this.addToSelection),
				on(sel, 'Deselected', this, this.removeFromSelection),
				/*on(this.grid, 'RowDblClick', this, function(evt) {
					this.removeFromSelection(evt.rowIndex);
				}),*/
				// add selection also on right click context menu
				on(this.grid, 'RowMouseDown', function(evt) {
					if (!mouse.isRight(evt)) {
						return;
					}
					if ((!connect.isCopyKey(evt) && !evt.shiftKey) && !this.selection.selected[evt.rowIndex]) {
						this.selection.deselectAll();
					}
					this.selection.setSelected(evt.rowIndex, true);
				})
			);
		},

		getSelectedNodes: function() {
			var nodes = [], sel = this.selection;
			for (var i in sel) {
				nodes.push(sel[i]);
			}
			return nodes;
		},

		/**
		 * Add node to selection map.
		 * Grid rows don't have an id. But we need one to be able to return the corresponding
		 * dnd.item (other dnd sources use source.getItem(id), which is expected to return a dnd.item.
		 * @param {number} rowIndex
		 */
		addToSelection: function(rowIndex) {
			console.log('addToSelection', rowIndex)
			var grid = this.grid;
			var item, id, node;

			if (rowIndex == -1) {
				return;
			}
			node = grid.getRowNode(rowIndex);
			if (!node.id) {
				item = grid.getItem(rowIndex);
				node.id = this.dndType + '_' + item.id;
				// TODO: Move this somewhere else, probably to grid itself
			}
			this.selection[node.id] = node;	// this is for GridContainer.getItem to be able to return the node
		},

		/**
		 * Remove node from selection map.
		 * @param rowIndex
		 */
		removeFromSelection: function(rowIndex) {
			console.log('removeFromSelection', rowIndex)
			var node;
			if (rowIndex == -1) {	// this gets also called onEnter when renaming item
				return;
			}
			node = this.grid.getRowNode(rowIndex);
			delete this.selection[node.id];
		},

		destroy: function() {
			this.inherited(arguments);
			this.selection = {};
		}



	});

});
