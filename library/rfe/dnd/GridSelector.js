/**
 * Modeled after dijit.tree._dndSelector
 * Does not use own selection object. Uses the grid's selection instead
 */
define([
	"dojo/_base/declare",
	'dojo/_base/lang',
	'dojo/_base/connect',
	'dojo/mouse',
	'dojo/on',
	'dojo/touch',
	'dojo/dnd/common',
	'rfe/dnd/GridContainer'
], function(declare, lang, connect, mouse, on, touch, common, GridContainer) {


	return declare("rfe.dnd.GridSelector", GridContainer, {
		// note: grid rows (nodes) do not have an id attribute -> The grid.Selection uses the rowIndex instead

		constructor: function() {
			var domNode = this.grid.domNode;

			this.events.push(
				on(domNode, touch.press, lang.hitch(this,'onMouseDown')),
				on(domNode, touch.release, lang.hitch(this,'onMouseUp')),
				on(domNode, touch.move, lang.hitch(this,'onMouseMove'))
			);
		},

		/**
		 * Event processor for onmousedown/ontouchstart
		 * @param {Event} e Decorated event object that contains reference to grid, cell, and rowIndex.
 		 */
		onMouseDown: function(e) {
			var sel = this.grid.selection;

			if((!connect.isCopyKey(e) && !e.shiftKey) && !sel.selected[e.rowIndex]){
				sel.deselectAll();
			}

			// add selection also on right click context menu
			if(e.rowIndex && mouse.isRight(e)){
				sel.setSelected(e.rowIndex, true);
			}
		},

		onMouseUp: function(e) {},

		onMouseMove: function(e) {},

		/**
		 * Return dnd item.
		 * object = {
		 * 		data: {rowNode},
		 * 		type: {dndType}
		 * 	}
		 * @param key
		 * @return {object}
		 */
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
		}
	});

});
