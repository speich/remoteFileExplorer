define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'rfe/dialogs'
], function(lang, declare, Deferred, dialogs) {

	return {

		/**
		 * Handles drag and drop from grid onto grid.
		 * @param source
		 * @param nodes
		 * @param copy
		 * @param newParentItem
		 */
		onGridGrid: function(source, nodes, copy, newParentItem) {
			// its ok to paste. all checks have already taken place in GridSource.OnMouseOver calling canDrop()
			var dndItem, item, oldParentItem;
			var store = source.grid.store;
			var i = 0, len = nodes.length;
			for (; i < len; i++) {
				dndItem = source.getItem(nodes[i].id);
				item = dndItem.data.item;
				oldParentItem = store.storeMemory.get(item.parId);
				store.pasteItem(item, oldParentItem, newParentItem, copy);
			}
		},

		onGridTree: function() {},

		onTreeTree: function(source, nodes, copy, newParentItem) {
			var dndItem, item, oldParentItem;
			var store = source.tree.model;
			var i = 0, len = nodes.length;
			for (; i < len; i++) {
				dndItem = source.getItem(nodes[i].id);
				item = dndItem.data.item;
				if (item.parId == newParentItem.id) {	// do nothing when dropping child on current parent
					return dialogs.show('sameFolder', item, newParentItem, copy);
				}
				else {
					oldParentItem = store.storeMemory.get(item.parId);
					console.log('newParentItem is not an item anymore!?', newParentItem)
					// because of reference of this? use clone?
					console.log('pasting',item, oldParentItem, newParentItem, copy)
//					store.pasteItem(item, oldParentItem, newParentItem, copy);
				}
			}
		},

      onTreeGrid: function(source, nodes, copy, newParentItem) {
				var dfds = [];
				var store = source.grid ? source.grid.store : source.tree.model;
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