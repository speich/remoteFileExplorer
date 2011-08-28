define([
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/dom-class',
	'original/dijit/tree/dndSource',
	'dojo/dnd/Manager'
], function(lang, Deferred, on, domClass, dndSource, dndManager) {

		return dndSource.extend({

			// accept: String[]
			//		List of accepted types (text strings) for the Tree; defaults to
			//		["text"]
			accept: ['treeNode', 'gridNode'],

			constructor: function(tree, params) {
				// summary:
				//		a constructor of the Tree DnD Source
				// tags:
				//		private

				lang.mixin(this, params || {});

				var type = this.accept;	// create accepted types as properties of accept, which can be checkt in checkAcceptance()
				if (type.length){
					this.accept = {};
					for (var i = 0; i < type.length; ++i) {
						this.accept[type[i]] = 1;
					}
				}

				// class-specific variables
				this.isDragging = false;
				this.mouseDown = false;
				this.targetAnchor = null;	// DOMNode corresponding to the currently moused over TreeNode
				this._lastX = 0;
				this._lastY = 0;

				this.targetState = "";
				domClass.add(this.node, "dojoDndSource");
				domClass.add(this.node, "dojoDndTarget");

				// set up events
				this.topics = [
					on("/dnd/source/over", lang.hitch(this, "onDndSourceOver")),
					on("/dnd/start", lang.hitch(this, "onDndStart")),
					on("/dnd/drop", lang.hitch(this, "onDndDrop")),
					on("/dnd/cancel", lang.hitch(this, "onDndCancel"))
				];
			},

			// methods
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
				oldTarget = this.targetAnchor,			// the TreeNode corresponding to TreeNode mouse was previously over
				newTarget = this.current;//,				// TreeNode corresponding to TreeNode mouse is currently over

				// calculate if user is indicating to drop the dragged node before, after, or over
				// (i.e., to become a child of) the target node
				if (newTarget != oldTarget) {
					// Check if it's ok to drop the dragged node on/before/after the target node.
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
				}
			},

			onDndDrop: function(source, nodes, copy, target) {
				if (this == target) {
					// note: this method is called from dnd.Manager. Make sure we only react if dropped on self (tree)
					this.onDrop(source, nodes, copy, target);
				}
				else if (this == source && !copy) {
					console.log('inDndRop: dropped outside of tree')
					// TODO: remove from grid and from selection , but how do we not store was successful?
				}
				this.onDndCancel();
			},

			onDrop: function(source, nodes, copy, target) {
				// summary:
				//		called only on the current target, when drop is performed
				// source: Object
				//		the source which provides items
				// nodes: Array
				//		the list of transferred items
				// copy: Boolean
				//		copy items, if true, move items otherwise
				if (this != source) {
					this.onDropExternal(source, nodes, copy, target);
				}
				else {
					this.onDropInternal(source, nodes, copy, target);
				}
			},

			onDropExternal: function(source, nodes, copy, target) {
				// source == grid, target == tree
				var gridStore = source.grid.store;
				console.log('tree onDropExternal', source);
				this.onDropInternal(source, nodes, copy, target);
				// TODO: remove from grid, but where in code and how
				// console.log('tree: remove now from grid)
			},

			onDropInternal: function(source, nodes, copy, target) {
				var i = 0, len = nodes.length;
				var store = this.store;
				var dndItem, item, oldParentItem, newParentItem;
				var dfd;

				newParentItem = this.targetAnchor.item;

				for (; i < len; i++) {
					dndItem = source.getItem(nodes[i].id);
					item = dndItem.data.item;
					oldParentItem = store.storeMemory.get(item.parId);
					dfd = store.pasteItem(item, oldParentItem, newParentItem, copy)
					// TODO: fix scope for i
					Deferred.when(dfd, lang.hitch(dndItem, function() {
						// TODO: find better solution, e.g. generic
						console.log('treeSource removeFromSelection', this, source.selection)
						source.removeFromSelection(this.data.gridRowIndex);	// will call removeFromSelection
					}))
				}
			}

		});

});
