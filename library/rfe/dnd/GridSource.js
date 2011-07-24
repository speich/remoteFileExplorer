define("rfe/dnd/GridSource", ["dojo", "rfe/dnd/GridSelector", "dojo/dnd/Manager"], function(dojo) {

	dojo.declare("rfe.dnd.GridSource", rfe.dnd.GridSelector, {
		// summary: a Source object, which can be used as a DnD source, or a DnD target

		// object attributes (for markup)
		isSource: true,

		accept: ['treeNode', 'gridNode'],

		copyOnly: false,


		constructor: function(grid, params) {

			dojo.mixin(this, params || {});

			// class-specific variables
			this.isDragging = false;
			this.mouseDown = false;
			this.targetAnchor = null;
			this.targetBox = null;

			// states
			this.targetState = "";
			
			dojo.addClass(this.domNode, "dojoDndSource");
			dojo.addClass(this.domNode, "dojoDndTarget");

			// set up events
			this.topics = [
				dojo.subscribe("/dnd/source/over", this, "onDndSourceOver"),
				dojo.subscribe("/dnd/start", this, "onDndStart"),
				dojo.subscribe("/dnd/drop", this, "onDndDrop"),
				dojo.subscribe("/dnd/cancel", this, "onDndCancel")
			];
			this.events.push(
				dojo.connect(this.domNode, "onmousedown", this, "onMouseDown"),
				dojo.connect(this.domNode, "onmousemove", this, "onMouseMove"),
				dojo.connect(this.domNode, "onmouseup", this, "onMouseUp")
			);
		},
		
		// methods
		checkAcceptance: function(source, nodes){
			// summary:
			//		Checks if the target can accept nodes from this source
			// source: dijit.tree.dndSource
			//		The source which provides items
			// nodes: DOMNode[]
			//		Array of DOM nodes corresponding to nodes being dropped, dijitTreeRow nodes if
			//		source is a dijit.Tree.
			// tags:
			//		extension
			return true;	// Boolean
		},

		copyState: function(keyPressed) {
			// summary: Returns true, if we need to copy items, false to move.
			//		It is separated to be overwritten dynamically, if needed.
			// keyPressed: Boolean: the "copy" was pressed
			return this.copyOnly || keyPressed;	// Boolean
		},

		destroy: function() {
			// summary: prepares the object to be garbage-collected
			this.inherited("destroy", arguments);
			dojo.forEach(this.topics, dojo.unsubscribe);
			this.targetAnchor = null;
		},

		// mouse event processors
		onMouseMove: function(e) {
			// summary: event processor for onmousemove
			// e: Event: mouse event
			var m;
			if (this.isDragging && this.targetState == "Disabled") {
				return;
			}
			this.inherited("onMouseMove", arguments);

			m = dojo.dnd.manager();

			if (this.isDragging) {
				m.canDrop(this.canDrop());
			}
			else {
				if (this.mouseDown && this.isSource && !this.grid.editMode) {
					var selection = this.grid.selection;
					if (!selection.selected[this.currentRowIndex]) {
						// Also allow drag even when row is not selected
						selection.select(this.currentRowIndex);
					}
					var nodes = this.getSelectedNodes();
					if (nodes.length) {
						m.startDrag(this, nodes, this.copyState(dojo.dnd.getCopyKeyState(e)));
					}
				}
			}
		},

		onMouseDown: function(e) {
			// summary: event processor for onmousedown
			// e: Event: mouse event
			this.mouseDown = true;
			this.mouseButton = e.button;
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
				var m = dojo.dnd.manager();
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

			if (this == source){
				dojo.dnd.manager().overSource(this);
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

			// - onDndDrop() --> onDrop() --> onDropExternal()/onDropInternal()
			if (this == target) {
				// note: this method is called from dnd.Manager. Make sure we only react if dropped on self (grid)
				this.onDrop(source, nodes, copy, target);
			}
			else if (this == source && !copy) {
				console.log('inDndRop: dropped outside of grid')
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
				this.onDropInternal(source, nodes, copy);
			}
		},

		// called by onDrop() which is called by onDndDrop()
		onDropExternal: function(source, nodes, copy, target) {
			console.log('grid onDropExternal: to be implemented', source, nodes, copy);
			if (source.accept.treeNode) {
				this.onDropFromTree(source, nodes, copy, target);
			}
		},

		onDropInternal: function(source, nodes, copy) {
			console.log('grid onDropInternal');
			var dfd;
			var i = 0, len = nodes.length;
			var store = this.store;
			var item, oldParentItem, newParentItem;

			newParentItem = this.getStoreItem();
			if (!newParentItem || !newParentItem.dir) {	// do nothing when dropping on file or same parent folder
				return;
			}

			for (i; i < len; i++) {
				//item = nodes[i].data.item;	// TODO: ? instead of storing item in node in GridSelector.addToSelection, only use node.id to get item (note: tree uses node.item)
				item = source.getItem(nodes[i].id);
				item = item.data.item;
				oldParentItem = store.storeMemory.get(item.parId);
				// update master store and tree
				dfd = store.pasteItem(item, oldParentItem, newParentItem, copy);
				// if successful remove item from grid
				dojo.when(dfd, dojo.hitch(this, function(id) {
					// ideally this would be done by the master store, but grid uses its own store since the new dojo.store is not an option yet
					var grid = this.grid;
					var store = grid.store;
					store.fetchItemByIdentity({
						identity: id,
						onItem: function(item) {
							store.deleteItem(item)
							store.save();
						}
					});

					//this.removeFromSelection();
				}));
			}

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
			dojo.dnd.manager().overSource(this);
		},

		onOutEvent: function() {
			// summary: this function is called once, when mouse is out of our container
			this.inherited(arguments);
			dojo.dnd.manager().outSource(this);
		},

		_markDndStatus: function(copy) {
			// summary: changes source's state based on "copy" status
			this._changeState("Source", copy ? "Copied" : "Moved");
		},
		
		/**
		 * Check if nodes can be dropped from source onto this target.
		 * @param source
		 * @param nodes
		 */
		canDrop: function(source, nodes) {
			var m, item;
			m = dojo.dnd.manager();
			if (m.source == this) {
				item = this.getStoreItem();
				if (!item || !item.dir) {	// do nothing when dropping on file or same parent folder
					return false;
				}
				else {
					return true;
				}
			}
			else {
				return true;
			}
		},

		/**
		 * Process dnd item(s) dropped externally from tree onto grid.
		 * @param source
		 * @param nodes
		 * @param copy
		 */
		onDropFromTree: function(source, nodes, copy) {
			var grid = this.rfe.grid, tree = this.rfe.grid;
			var store = this.rfe.storeCache;
			var trgItem = this.getStoreItem();
			var newParentItem = trgItem && trgItem.dir ? trgItem : this.rfe.currentTreeItem;

			dojo.forEach(nodes, function(node, idx) {
				// Don't confuse the different use of items (DnD item versus store.object).
				var dndItem = source.getItem(node.id);
				var srcItem = dndItem.data.item;
				var oldParentItem = dndItem.data.getParent().item;

				// add item to grid (store) if not dropped on folder in grid
				if (!trgItem || !trgItem.dir) {
					grid.store.newItem(srcItem);
					grid.store.save();
				}

				// add new item and remove old from old tree location by updating the store
				store.pasteItem(srcItem, oldParentItem, newParentItem, copy);

			}, this);

		},

		/**
		 * Returns store object from dnd node.
		 * @param source dnd source
		 * @param node dnd node
		 */
		getStoreItemFromTree: function(source, node) {
			var item = source.getItem(node.id);
			return item.data.item;
		},

		/**
		 * Returns store object.
		 */
		getStoreItem: function() {
			var item, id;
			var grid = this.grid;
			if (arguments[0]) {
				item = arguments[0];
			}
			else if (this.currentRowIndex !== -1) {
				item = grid.getItem(this.currentRowIndex);
			}
			if (item) {
				id = grid.store.getValue(item, 'id');
				item = this.store.storeMemory.get(id);	// use memory store instead of grid's ItemWriteStore for direct property access and to always have same item format
			}
			return item;
		},

		/**
		 * Note: Copied from tree/dndSource.js _isParentChildDrop
		 * @param source
		 * @param targetRow
		 */
		checkParentChildDrop: function(source, targetRow) {
			// summary:
			//		Checks whether the dragged items are parent rows in the tree which are being dragged into their own children.
			//
			// source:
			//		The DragSource object.
			//
			// targetRow:
			//		The tree row onto which the dragged nodes are being dropped.
			//
			// If the dragged object is not coming from the tree this widget belongs to,
			// it cannot be invalid.
			var root = source.grid.domNode;
			var ids = source.selection;
			var node = targetRow.parentNode;

			// Iterate up the DOM hierarchy from the target drop row,
			// checking of any of the dragged nodes have the same ID.
			while (node != root && !ids[node.id]) {
				node = node.parentNode;
			}
			return node.id && ids[node.id];
		}


	});

	return rfe.dnd.Source;
});


