define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/dom-class',
	'original/dijit/tree/dndSource',
	'dojo/dnd/Manager',
	'rfe/dnd/drop'
], function(lang, declare, Deferred, on, domClass, dndSource, dndManager, drop) {

		return declare([dndSource], {

			generateText: true,	// can be removed as soon as bug# is fixed

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

			_onDragMouse: function(e) {
				// called by dndSource.onMouseMove() if isDragging is true
				// summary:
				//		Helper method for processing onmousemove/onmouseover events while drag is in progress.
				//		Keeps track of current drop target.

				var m = dndManager.manager(),
				oldTarget = this.targetAnchor,	// TreeNode corresponding to TreeNode mouse was previously over
				newTarget = this.current; 		// TreeNode corresponding to TreeNode mouse is currently over
				var droppable = false;

				if (newTarget != oldTarget) {
			      if (oldTarget){
     					this._removeItemClass(oldTarget.rowNode, 'Over');
					}
					if (newTarget){
						this._addItemClass(newTarget.rowNode, 'Over');
					}
					// Check if it's ok to drop the dragged node on the target node.
					if (m.source == this) {
						if (newTarget.id in this.selection) {
							// Guard against dropping onto yourself
							droppable = false;
						}
						else {
							droppable = !this._isParentChildDrop(m.source, newTarget.rowNode);
						}
					}
					else if (m.source.grid) {
						// Note: To simplify things we (currently) do not differentiate between file or folder before
						// dropping even though files (but not folders) could be dropped independent of the hierarchy.
						// But in case of dropping multiple items (files and folders at the same time) it wouldn't make
						// sense to show the (-)avatar anymore. Windows Explorer does not prevent parentChildDrops but
						// instead displays a warning message for each dropped file/folder afterwards.
						var grid = m.source.grid;
						var node, item = grid.getItem(0);	// we can use any row to get the parent
						node = this.tree.getNodesByItem(item);
						node = node[0].rowNode;
						droppable = !this._isParentChildDrop(m.target, node);
						console.log('tree.canDrop', droppable, m.target)
					}
					m.canDrop(droppable);
					this.targetAnchor = newTarget;
				}
			},

			onDndDrop: function(source, nodes, copy, target) {
				// note: this method is called from dnd.Manager topic /dnd/drop
				var newParentItem;
				if (this.containerState == "Over"){
					this.isDragging = false;
					if (this == target) {
						if (this == source) {	// dropped on tree from tree
							console.log('tree onDndDrop: dropped onto tree from tree')
							newParentItem = this.targetAnchor.item;
							console.log('newParentItem', newParentItem)
							// because of reference of this? use clone?
							drop.onTreeTree(source, nodes, copy, target, newParentItem);
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
						console.log('tree onDndDrop: dropped outside of tree from outside of tree')
					}
				}
				this.onDndCancel();
			}

		});

});
