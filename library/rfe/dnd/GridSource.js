define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/topic',
	'dojo/dom-class',
	'dojo/dnd/Manager',
	'rfe/dnd/GridSelector',
	'rfe/dnd/Drop'
], function(lang, array, declare, connect, Deferred, on, topic, domClass, Manager, GridSelector, Drop) {

	return declare("rfe.dnd.GridSource", GridSelector, {
		// summary: a Source object, which can be used as a DnD source, or a DnD target

		isSource: true,

		accept: ['treeNode', 'gridNode'],

		copyOnly: false,

		dragThreshold: 5,	// The move delay in pixels before detecting a drag

		constructor: function(grid, params) {
			lang.mixin(this, params || {});
			lang.mixin(this, Drop);

			var type = params.accept instanceof Array ? params.accept : ['treeNode', 'gridNode'];
			this.accept = null;
			if (type.length){
				this.accept = {};
				for (var i = 0; i < type.length; ++i) {
					this.accept[type[i]] = 1;
				}
			}

			this.isDragging = false;
			this.mouseDown = false;
			this.targetAnchor = null;
			this._lastX = 0;	// enables detecting drag after a treshold
			this._lastY = 0;

			this.targetState = "";
			this.sourceState = "";
			domClass.add(this.node, "dojoDndSource");
			domClass.add(this.node, "dojoDndTarget");

			this.topics = [
				topic.subscribe("/dnd/source/over", lang.hitch(this, "onDndSourceOver")),
				topic.subscribe("/dnd/start", lang.hitch(this, "onDndStart")),
				topic.subscribe("/dnd/drop", lang.hitch(this, "onDndDrop")),
				topic.subscribe("/dnd/cancel", lang.hitch(this, "onDndCancel"))
			];
		},

		/**
		 * Checks if the target can accept nodes from this source.
		 * @param {object} source
		 * @param {Array} nodes
		 * @return {boolean}
		 */
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

		copyState: function(keyPressed) {
			// summary: Returns true, if we need to copy items, false to move.
			//		It is separated to be overwritten dynamically, if needed.
			// keyPressed: Boolean: the "copy" was pressed
			return this.copyOnly || keyPressed;	// Boolean
		},

		destroy: function() {
			// summary: prepares the object to be garbage-collected
			var h;
			this.inherited("destroy", arguments);
			while (h = this.topics.pop()) {
				h.remove();
			}
			this.targetAnchor = null;
		},

		/**
		 * Event processor for mousemove
		 * @param {Event} e mouse event
		 */
		onMouseMove: function(e) {
			// do not allow dnd when editing
			if (this.grid.edit.isEditing()) {
				return;
			}

			if (this.isDragging && this.targetState == "Disabled") {
				return;
			}

			this.inherited("onMouseMove", arguments);

			var m = Manager.manager();

			if (this.isDragging) {
				if (this.canDrop()) {
					m.canDrop(true);
				}
				else {
					m.canDrop(false);
				}
			}
			else {
				if (this.mouseDown && this.isSource &&
				(Math.abs(e.pageX - this._lastX) >= this.dragThreshold || Math.abs(e.pageY - this._lastY) >= this.dragThreshold)) {
					var selection = this.grid.selection;
					if (!selection.selected[this.currentRowIndex]) {
						// Also allow drag even when row is not selected
						selection.select(this.currentRowIndex);
					}
					var nodes = this.getSelectedNodes();
					if (nodes.length) {
						m.startDrag(this, nodes, this.copyState(connect.isCopyKey(e)));
					}
				}
			}
		},

		onMouseDown: function(e) {
			// summary: event processor for onmousedown
			// e: Event: mouse event
			this.mouseDown = true;
			this.mouseButton = e.button;
			this._lastX = e.pageX;
			this._lastY = e.pageY;
			this.inherited("onMouseDown", arguments);
		},

		onMouseUp: function(e) {
			// summary: event processor for onmouseup
			// e: Event: mouse event
			if (this.mouseDown) {
				this.mouseDown = false;
				this.inherited(arguments);
			}
		},

		// topic event processors
		onDndSourceOver: function(source) {
			// summary: topic event processor for /dnd/source/over, called when detected a current source
			// source: Object: the source which has the mouse over it
			
			//note: this is called on any detected dnd source (e.g. also when over the tree) and not only when over the grid
			if (this != source) {
				this.mouseDown = false;
			}
			else if (this.isDragging) {
				var m = Manager.manager();
				m.canDrop(false);
			}
		},

		onDndStart: function(source, nodes, copy) {
			// summary:
			//		Topic event processor for /dnd/start, called to initiate the DnD operation
			// source: Object
			//		The dijit.tree.dndSource / dojo.dnd.Source which is providing the items
			// nodes: DomNode[]
			//		The list of transferred items, dndTreeNode nodes if dragging from a Tree
			// copy: Boolean
			//		Copy items, if true, move items otherwise
			// tags:
			//		private
			if(this.isSource){
				this._changeState("Source", this == source ? (copy ? "Copied" : "Moved") : "");
			}
			var accepted = this.checkAcceptance(source, nodes);
			this._changeState("Target", accepted ? "" : "Disabled");
			                   console.log('grid.onDndStart', this, source)
			if (this == source){
				Manager.manager().overSource(this);
			}
			this.isDragging = true;
		},

		onDndDrop: function(source, nodes, copy, target) {
			// summary:
			//		Topic event processor for /dnd/drop, called to finish the DnD operation..
			//		Updates data store items according to where node was dragged from and dropped
			//		to.   The tree will then respond to those data store updates and redraw itself.
			// source: Object: the source which provides items
			// nodes: Array: the list of transferred items
			// copy: Boolean: copy items, if true, move items otherwise

			// note: this method is called from dnd.Manager.

			// - onDndDrop() --> onDrop() --> onDropExternal()/onDropInternal()
			var parentItem;

			// TODO: update cookie that saves selection state.
			if (this == target) {
				if (this.currentRowIndex == -1) {		// dragged below grid rows, but still in grid view
					parentItem = this.grid.getItem(0);	// we can use the parent of any row
				}
				else {
					parentItem = this.grid.getItem(this.currentRowIndex);
				}

				if (this == source) {	// dropped onto grid from grid, do nothing when dropping on file
					console.log('grid onDndDrop: dropped onto grid from grid')
					this.onDrop(source, nodes, copy, target, parentItem);

				}
				else {	// dropped onto grid from external (tree)
					console.log('grid onDropExternal: to be implemented', source, nodes, copy);
					// TODO: check isParentChildDrop()

				}


			}
			else if (this == source) {	// dropped outside of grid from grid
				console.log('grid onDndDrop: dropped outside of grid')
				// do nothing since TreeSource.onDndDrop() takes care of removing item from grid by calling tree.store.pasteItem()
				// TODO: remove from grid and from selection , but how do we know that store was successful?
			}
			else {
				// dropped outside of grid from grid
				console.log('grid onDndDrop: dropped outside of grid from outside of grid')
			}
			this.onDndCancel();
		},

		onDndCancel: function() {
			// summary: topic event processor for /dnd/cancel, called to cancel the DnD operation
//			this.before = true;
			this.isDragging = false;
			this.mouseDown = false;
			delete this.mouseButton;
			this._changeState("Source", "");
			this._changeState("Target", "");
		},

		// utilities

		onOverEvent: function() {
			// summary: this function is called once, when mouse is over our container
			this.inherited(arguments);
			Manager().overSource(this);
		},

		onOutEvent: function() {
			// summary: this function is called once, when mouse is out of our container
			this.inherited(arguments);
			Manager().outSource(this);
		},

		_markDndStatus: function(copy) {
			// summary: changes source's state based on "copy" status
			this._changeState("Source", copy ? "Copied" : "Moved");
		},
		
		/**
		 * Check if nodes can be dropped from source onto the grid.
		 */
		canDrop: function() {
			var node, item;
			var grid = this.grid;
			var m = Manager.manager();
			if (m.source == this) {
				item = grid.getItem(this.currentRowIndex);
				console.log('gridSource.canDrop',item, this.currentRowIndex)
				return item && item.dir;
			}
			else {
				item = grid.getItem(0);	// we can use any row to get the parent
				item = grid.store.get(item.parId);
				node = m.source.tree.getNodesByItem(item);
				node = node[0].rowNode;
				return true;
//				return !m.source._isParentChildDrop(m.source, node);
			}
		},

		/**
		 * Checks whether dragged items are parent being dragged into their own children.
		 */
		isParentChildDrop: function() {
			var m = Manager.manager();
			var id;
			var grid = this.grid;
			var nodes = m.source.getSelectedNodes();
			var i = 0, len = nodes.length;

			var parent = grid.store.get(grid.getItem(0).parId);	// we can use any row to get the parent

			return m.source._isParentChildDrop(m.source, parent)

			//var node = nodes[0];	// tree.dndController.singular = true has to be set. selected node in tree is parent
									// of all items being displayed in the grid (also only works if dnd does not set a node to selected)

//			return false;
			             /*
			// Iterate up the DOM hierarchy from the target drop row,
			// checking of any of the dragged nodes have the same ID.
			while(node != tree.rootNode && !ids[node.id]){
				node = node.parentNode;
			}

			return node.id && ids[node.id];

*/
			var ids = m.source.selection;

			while (parent) {

			}

			!ids[node.id]

			console.log(m.source.selection)
			for (; i < len; i++) {
				console.log(nodes[i].item.id,' == ',parent.id)

				if (nodes[i].item.id == parent.id) {
					return false;
				}
			}
			return true;

		}
	});

});


