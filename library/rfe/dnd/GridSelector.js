/**
 * Modeled after dijit.tree._dndSelector
 */
define([
	"dojo/_base/declare",
	'dojo/_base/lang',
	'dojo/_base/connect',
	'dojo/aspect',
	'dojo/mouse',
	"dojo/dnd/common",
	"rfe/dnd/GridContainer"
], function(declare, lang, connect, aspect, mouse, common, GridContainer) {


	return declare("rfe.dnd.GridSelector", GridContainer, {
		// note: grid rows (nodes) do not have an id attribute -> The grid.Selection uses the rowIndex instead

		constructor: function() {
			var sel = this.grid.selection;

			this.events.push(
				aspect.after(sel, 'onSelected', lang.hitch(this, this.addIdToRow), true),

			   // add selection also on right click context menu
				this.grid.on('rowMouseDown', lang.hitch(this, function(evt) {
					//var selection = this.grid.selection;
					if (!mouse.isRight(evt)) {
						return;
					}
					if ((!connect.isCopyKey(evt) && !evt.shiftKey) && !sel.selected[evt.rowIndex]) {
						sel.deselectAll();
					}
					sel.setSelected(evt.rowIndex, true);
				}))
			);
		},

		getItem: function(key) {
			// summary: returns a data item by its key (id)
			// note: key == id and not the same as rowIdx. Can be called by any other dnd source with node.id = key
			var node, rowIdx, grid = this.grid;
			var item, itemId = key.replace(this.dndType + '_', '');
			item = grid.store.get(itemId);
			rowIdx = grid.getItemIndex(item);
			node = grid.getRowNode(rowIdx);
			node.item = item;
			return {
				data: node,
				type: [this.dndType]
			};
		},

		getSelectedNodes: function() {
			var grid = this.grid;
			var selection = grid.selection, sel = selection.selected;
			var nodes = [];
			var rowIdx = 0, len = sel.length;
			for (; rowIdx < len; rowIdx++) {
				if (sel[rowIdx]) {
					nodes.push(grid.getRowNode(rowIdx));
				}
			}
			return nodes;
		},

		/**
		 * Add node to selection map.
		 * @param {number} rowIndex
		 */
		addIdToRow: function(rowIndex) {
			var grid = this.grid;
			var item, node;

			if (rowIndex == -1) {
				return;
			}
			node = grid.getRowNode(rowIndex);
			if (!node.id) {
				// Grid rows don't have an id. But we need one to be able to return the corresponding
		 		// dnd.item (other dnd sources use source.getItem(id), which is expected to return a dnd.item.
				item = grid.getItem(rowIndex);
				node.id = this.dndType + '_' + item.id;
			}
		}
	});

});
