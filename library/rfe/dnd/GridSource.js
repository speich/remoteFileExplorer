define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/DeferredList',
	'dojo/dnd/Source',
	'dojo/dnd/Manager'
],
function(declare, lang, Deferred, DeferredList, DnDSource) {

	// Requirements:
	// * requires a store (sounds obvious, but not all Lists/Grids have stores...)
	// * must support options.before in put calls
	//   (if undefined, put at end)
	// * should support copy
	//   (copy should also support options.before as above)

	// TODOs:
	// * consider sending items rather than nodes to onDropExternal/Internal
	// * consider emitting store errors via OnDemandList._trackError

	return declare(DnDSource, {

		grid: null,

		fileStore: null,

		getObject: function(node) {
			return this.grid.row(node).data;
		},

		_legalMouseDown: function(evt){
			// summary:
			//		fix _legalMouseDown to only allow starting drag from an item
			//		(not from bodyNode outside contentNode)
			var legal = this.inherited("_legalMouseDown", arguments);
			// DnDSource.prototype._legalMouseDown.apply(this, arguments);
			return legal && evt.target !== this.grid.bodyNode;
		},

		_onDragMouse: function() {
			// TODO: take care (in TreeSource?) of dropping on own descendant (by preventing from dropping in the first place?)
			var oldTarget = this.targetAnchor,	// TreeNode corresponding to TreeNode mouse was previously over
				newTarget = this.current;			// TreeNode corresponding to TreeNode mouse is currently over
		},

		/**
		 * Topic event processor for /dnd/drop, called to finish the DnD operation.
		 * @param {object} sourceSource dojo/dnd/Source dgrid or dijit/tree which is providing the items
		 * @param {Array} nodes domNodes
		 * @param {boolean} copy copy or move objects
		 */
		onDrop: function(sourceSource, nodes, copy) {
			// summary:
			//		on drop, determine where to move/copy the objects
			var targetSource = this,
				targetRow = this.targetAnchor, // save for internal use to this._targetAnchor
				grid = this.grid,
				store = grid.store;

			targetRow = targetRow && grid.row(targetRow);

			Deferred.when(targetRow && store.get(targetRow.id), function(targetObject) {

				// Note: if dropping after the last row, or into an empty grid,
				// target will be undefined.

				// Delegate to onDropInternal or onDropExternal for rest of logic.
				// These are passed the target item as an additional argument.
				if (targetSource !== sourceSource) {
					targetSource.onDropExternal(sourceSource, nodes, copy, targetObject);
				} else {
					targetSource.onDropInternal(nodes, copy, targetObject);
				}
			});
		},

		onDropInternal: function(nodes, copy, newParentObject) {
			var fileStore = this.fileStore,
				storeMemory = fileStore.storeMemory,
				targetSource = this,
				oldParentObject;

			// Don't bother continuing if not moving anything.
			// (Don't need to worry about edge first/last cases since dropping
			// directly on self doesn't fire onDrop, but we do have to worry about
			// dropping last node into empty space beyond rendered rows, if we don't copy)
			// Also don't bother if moving onto a file (no reordering in rfe)
			if (!copy && (!newParentObject || !newParentObject[fileStore.childrenAttr])) {
				return;
			}

			nodes.forEach(function(node) {
				var object = targetSource.getObject(node);

				// all nodes in grid share same parent, only get once from first node. Since you can only drag an object
				// that's visible (hence loaded an cached) we can use the memoryStore
				oldParentObject = oldParentObject || storeMemory.get(object[fileStore.parentAttr]);
				fileStore.pasteItem(object, oldParentObject, newParentObject, copy);
			});
		},

		onDropExternal: function(sourceSource, nodes, copy, newParentObject) {
			var fileStore = this.fileStore,
				storeMemory = fileStore.storeMemory,
				row, grid = this.grid,
				oldParentObject;

			if (newParentObject && !newParentObject[fileStore.childrenAttr]) {
				// dropped on a file, so it's parent should become the new parent
				newParentObject = storeMemory.get(newParentObject[fileStore.parentAttr]);
			}
			else if (!newParentObject) {
				// dropping beyond rendered rows, so newParentObject is null. Since all displayed objects
				// in grid share the same parent, just grab the parent of the first/last object in grid
				row = grid.getFirstRow();
				newParentObject = storeMemory.get(row.data[fileStore.parentAttr]);
			}

			nodes.forEach(function(node) {
				var object = sourceSource.getObject(node);

				// tree.dndController.singular = true so we can get the oldParentObject only once from first node
				// Since you can only drag visible object (hence loaded an cached) we can use the memoryStore
				oldParentObject = oldParentObject || storeMemory.get(object[fileStore.parentAttr]);
				fileStore.pasteItem(object, oldParentObject, newParentObject, copy);
			});
		},

		checkAcceptance: function(source, nodes){
			// summary:
			//		augment checkAcceptance to block drops from sources without getObject or
			return source.getObject &&
				//source.singular &&
				DnDSource.prototype.checkAcceptance.apply(this, arguments);
		}


	});
});
