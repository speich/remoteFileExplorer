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

		constructor: function() {
			var sel = this.grid.selection;

			// note: grid rows (nodes) do not have an id attribute -> The grid.Selection uses the rowIndex instead
			// -> Create own dictionary object keyed by ids of selected nodes as required by the dnd.Selector api.
			this.selection = {};	// maps node.id to lookup to find dndItem from rowNode.

			this.events.push(
				aspect.after(sel, 'onSelected', lang.hitch(this, this.addToSelection), true),
				aspect.after(sel, 'onDeselected', lang.hitch(this, this.removeFromSelection), true),

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

		// abstract access to the map
		getItem: function(/*String*/ key) {
			// summary: returns a data item by its key (id)

			// note: key = id and not the same as rowIndex. Can be called by any other dnd source with node.id = key
			var grid = this.grid;
			var node = this.selection[key];
			node.item = grid.getItem(node.gridRowIndex);
			return {
				data: node,
				type: [this.dndType]
			};
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
