define([
	'dojo/_base/lang',
	'dojo/_base/declare'
], function(lang, declare) {

	return {



			onDrop: function(source, nodes, copy, target, newParentItem) {
				var i = 0, len = nodes.length;
				var store = this.store;
				var dndItem, item, oldParentItem;

				for (; i < len; i++) {
					dndItem = source.getItem(nodes[i].id);
					item = dndItem.data.item;
					if (item.parId != newParentItem.id) {	// do nothing when dropping child on current parent
						oldParentItem = store.storeMemory.get(item.parId);
						store.pasteItem(item, oldParentItem, newParentItem, copy);
					}
				}
			}

		};
});