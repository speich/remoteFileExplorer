define("rfe/dnd/GridSelector", ["dojo", "dijit", "dojo/dnd/common", "rfe/dnd/GridContainer"], function(dojo, dijit) {


	dojo.declare("rfe.dnd.GridSelector", rfe.dnd.GridContainer, {

		getSelectedNodes: function() {
			// TODO: make use store item id
			var grid = this.grid, selection = grid.selection;
			var store = this.rfe.storeCache.storeMemory;
			var nodes = [];
			var i = 0, len = selection.selected.length;
			var item, node, id;
			
			for (; i < len; i++) {
				if (selection.selected[i]) {
					id = grid.store.getValue(grid.getItem(i), 'id');
					item = store.get(id);	// use memory store instead of grid's ItemWriteStore for direct property access and to always have same item format
					node = grid.getRowNode(i);	// expects param inIndex
					node.id = id;	// TODO: grid rows don't have an id, why do we need one here? If so do we use rowIndex (e.g. i) or item.id?
					nodes.push(node);
				}
			}
			return nodes;
		}

	});
	
	return rfe.dnd.GridSelector;
});
