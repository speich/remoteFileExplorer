define([
	'dojo/_base/array',
	'dojo/_base/declare',
	'dijit/tree/dndSource',
	'dojo/dnd/Manager',
	'rfe/dnd/_SourceMixin'
], function(array, declare, dndSource, DndManager, _SourceMixin) {

		return declare([dndSource, _SourceMixin], {

			rfe: null,
			singular: true,	// all dnd operations assume that we only drag single tree nodes

			getObject: function(node){
				// summary:
				//		getObject is a method which should be defined on any source intending
				//		on interfacing with dgrid DnD
				var item = this.getItem(node.id);
				return item.data.item;
			},

			/**
			 * Topic event processor for /dnd/drop, called to finish the DnD operation.
			 * Updates data store items according to where node was dragged from and dropped to.
			 * The tree will then respond to those data store updates and redraw itself.
			 * @param {object} sourceSource dojo/dnd/Source dgrid or tree which is providing the items
			 * @param {Array} nodes domNodes
			 * @param {boolean} copy copy or move objects
			 * @param target
			 */
			onDndDrop: function(sourceSource, nodes, copy, target) {
				// Note: target parameter references whole tree and not a single tree node

				var targetSource = this,
					targetObject = this.targetAnchor && this.targetAnchor.item;

				// note: this method is called from dnd.Manager topic /dnd/drop
				if (target === this && this.containerState === "Over"){
					this.isDragging = false;

					if (targetSource !== sourceSource) {   // dropped onto tree from grid
						this.onDropExternal(sourceSource, nodes, copy, targetObject);
					}
					else {   // dropped onto tree from tree
						this.onDropInternal(nodes, copy, targetObject);
					}

					// Expand the target node (if it's currently collapsed) so the user can see
					// where their node was dropped.   In particular since that node is still selected.
					// this.tree._expandNode(this.targetAnchor);
				}
				this.onDndCancel();
			},

			/**
			 * Handle dropping on tree.
			 * @param nodes
			 * @param copy
			 * @param newParentObject
			 */
			onDropInternal: function(nodes, copy, newParentObject) {
				var fileStore = this.rfe.store,
					storeMemory = fileStore.storeMemory,
					targetSource = this,
					object, oldParentObject;

				// all nodes in grid share same parent, only get it once from first node
				object = targetSource.getObject(nodes[0]);
				oldParentObject = storeMemory.get(object[fileStore.parentAttr]);
				array.forEach(nodes, function(node) {
					object = targetSource.getObject(node);
					fileStore.pasteItem(object, oldParentObject, newParentObject, copy);
				});
			},

			/**
			 * Handle dropping node(s) from grid onto tree.
			 * @param {object} sourceSource
			 * @param {Array} nodes
			 * @param {boolean} copy
			 * @param {object} newParentObject
			 */
			onDropExternal: function(sourceSource, nodes, copy, newParentObject) {

				var fileStore = this.rfe.store,
					storeMemory = fileStore.storeMemory,
					object, oldParentObject;

				// all nodes in grid share same parent, only get once from first node to test for same parent
				object = sourceSource.getObject(nodes[0]);
				oldParentObject = storeMemory.get(object[fileStore.parentAttr]);

				if (!copy && newParentObject.id === oldParentObject.id) {
					return;
				}

				nodes.forEach(function(node) {
					object = sourceSource.getObject(node);	// TODO: do not use source.getObject, since node is a grid row (no item.data.item)
					fileStore.pasteItem(object, oldParentObject, newParentObject, copy);
				});
			},

			/**
			 * Helper method for processing onmousemove/onmouseover events while drag is in progress.
			 * @private
			 */
			_onDragMouse: function() {
				this.inherited('_onDragMouse', arguments);

				var id, parentObj,
					m = DndManager.manager();

				// Cancel dropping onto own descendant from grid
				if (m.source.grid) {
					parentObj = this.current.item;
					id = m.source.getObject(m.nodes[0]).id;
					if (this._isParentChild(id, parentObj)) {
						m.canDrop(false);
					}
				}
			}
		});
});
