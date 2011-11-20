define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'rfe/dialogs'
], function(lang, declare, Deferred, dialogs) {

	return {

		onGridGrid: function(source, nodes, copy, newParentItem) {

		},

		onGridTree: function() {},

		onTreeTree: function() {},

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
						if (item.id == newParentItem.id) {	// do nothing when dropping child on current parent
							return dialogs.show('sameFolder', copy);
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