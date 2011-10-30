define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/dom-class',
	'original/dijit/tree/dndSource',
	'dojo/dnd/Manager'
], function(lang, declare, Deferred, on, domClass, dndSource, dndManager) {

		return declare(dndSource, {
			constructor: function(tree, params) {

				lang.mixin(this, params || {});

				var type = params.accept instanceof Array ? params.accept : ['treeNode', 'gridNode'];
				this.accept = null;
				if (type.length){
					this.accept = {};
					for (var i = 0; i < type.length; ++i) {
						this.accept[type[i]] = 1;
					}
				}
			},

			checkAcceptance: function(source, nodes) {
				var i = 0, len = nodes.length;
				for (; i < len; ++i) {
					var type = source.getItem(nodes[i].id).type;
					var j = 0, lenJ = type.length;
					for (; j < lenJ; ++j){
						if (type[j] in this.accept){
							return true;
						}
					}
				}
				return false;
			},

			_onDragMouse: function(e) {
				// summary:
				//		Helper method for processing onmousemove/onmouseover events while drag is in progress.
				//		Keeps track of current drop target.

				var m = dndManager.manager(),
				oldTarget = this.targetAnchor,	// the TreeNode corresponding to TreeNode mouse was previously over
				newTarget = this.current; 			// TreeNode corresponding to TreeNode mouse is currently over

				if (newTarget != oldTarget) {
			      if (oldTarget){
     					this._removeItemClass(oldTarget.rowNode, 'Over');
					}
					if (newTarget){
						this._addItemClass(newTarget.rowNode, 'Over');
					}
					// Check if it's ok to drop the dragged node on the target node.
					if (m.source == this && (newTarget.id in this.selection)) {
						// Guard against dropping onto yourself (TODO: guard against dropping onto your descendant, #7140)
						m.canDrop(false);
					}
					else if (!this._isParentChildDrop(m.source, newTarget.rowNode)) {
						m.canDrop(true);
					}
					else {
						m.canDrop(false);
					}
					this.targetAnchor = newTarget;
					console.log('_onDragMouse', this, this.targetAnchor)
				}
			},

			onDndDrop: function(source, nodes, copy, target) {
				// note: this method is called from dnd.Manager.
				if (this == target) {
					if (this == source) {	// dropped on tree from tree
						console.log('tree onDndDrop: dropped onto tree from tree')
						this.onDrop(source, nodes, copy, target);
					}
					else {						// dropped on tree from grid
						console.log('tree onDndDrop: dropped onto tree from external')
					}
				}
				else if (this == source) { // dropped outside of tree from tree
					console.log('tree onDndDrop: dropped outside of tree')
					// let GridSource handle this ?
				}
				else {   						// dropped outside of tree from outside of tree
					console.log('tree onDndDrop: dropped from outside of tree to outside of tree')
				}
				this.onDndCancel();
			},

			onDrop: function(source, nodes, copy, target) {
				var i = 0, len = nodes.length;
				var store = this.store;
				var dndItem, item, oldParentItem, newParentItem;

				newParentItem = this.targetAnchor.item;
				for (; i < len; i++) {
					dndItem = source.getItem(nodes[i].id);
					item = dndItem.data.item;
					if (item.parId != newParentItem.id) {	// do nothing when dropping child on current parent
						oldParentItem = store.storeMemory.get(item.parId);
						store.pasteItem(item, oldParentItem, newParentItem, copy);
					}
				}
			}

		});

});
