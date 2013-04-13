define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/_base/Array',
	'rfe/dialogs'
], function(lang, declare, Deferred, array, dialogs) {

	return {

		/**
		 * Handle dropping when source and target are the grid.
		 * @param source
		 * @param nodes
		 * @param copy
		 * @param {object} oldParent
		 */
		onGridToGrid: function(source, nodes, copy, oldParent) {
			console.log('grid onDndDrop: dropped onto grid from grid')
			/* Note: - guard against dropping onto self was already checked in GridSource.canDrop()
						- only allow dropping on folders was already checked in GridSource.canDrop()
						- no other checks necessary
			*/

			var grid = source.grid,
				store = source.grid.store,
				object, i, len;

			if (this.currentRowIndex === -1) {   // dropped onto grid, but not onto a grid row
				oldParent = grid.getItem(0);		// -> we can use the parent of any row to get the parentItem
			}
			else {
				oldParent = grid.getItem(this.currentRowIndex);
			}
			oldParent = grid.store.storeMemory.get(oldParent.parId);


			for (i = 0, len = nodes.length; i < len; i++) {
				object = source.getItem(nodes[i].id).data.item,
				oldParent = store.storeMemory.get(object.parId);
				store.pasteItem(object, oldParent, oldParent, copy);
			}
		},

		/**
		 * Handle dropping when source is grid and target is tree.
		 */
		onGridToTree: function() {},

		/**
		 * Handle dropping when source and target is tree.
		 * @param source
		 * @param nodes
		 * @param copy
		 * @param target
		 * @param newParent
		 */
		onTreeToTree: function(source, nodes, copy, target, newParent) {
			console.log('onTreeToTree:', source, nodes, copy, target, newParent);
			array.forEach(nodes, function(node) {
				// dojo.dnd.Item representing the thing being dropped.
				// Don't confuse the use of item here (meaning a DnD item) with the
				// uses below where item means dojo.store object.
				var store = source.store;
				var child = source.getItem(node.id).data.item;
				var oldParent = store.storeMemory.get(child[store.parentAttr]);
				store.pasteItem(child, oldParent, newParent, copy);
			});
		},

		/**
		 * Handle dropping when source is tree and target is grid.
		 * @param source
		 * @param nodes
		 * @param copy
		 * @param newParentItem
		 */
      onTreeToGrid: function(source, nodes, copy, newParentItem) {
				var dfds = [];
				var store = source.tree.model;
				var i = 0, len = nodes.length;

				// chain the pasting of all nodes as deferreds
				dfds[0] = new Deferred();
				dfds[0].resolve(false); // dummy to attach first deferred to
				for (; i < len; i++) {
					// TODO: check parentChildDrop if dir, etc.
					dfds[i + 1] = dfds[i].then(function() {
						var dfd, oldParentItem;

						var dndItem = source.getItem(nodes[i].id);
						var item = dndItem.data.item;
						console.log(item, newParentItem)
						// guard from dropping onto self
						if (item.id == newParentItem.id) {

							return dialogs.show('sameFolder', item, newParentItem, copy);
						}
						else {
							oldParentItem = store.storeMemory.get(item.parId);
							store.pasteItem(item, oldParentItem, newParentItem, copy);
							dfd = new dojo.Deferred();
							dfd.resolve(true);
							return dfd;
						}
					}, function(){
						console.log('canceled')
					});

				}
			}

		};
});