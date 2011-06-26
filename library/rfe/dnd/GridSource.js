define("rfe/dnd/GridSource", ["dojo", "rfe/dnd/GridSelector", "dojo/dnd/Manager"], function(dojo) {

	dojo.declare("rfe.dnd.GridSource", rfe.dnd.GridSelector, {
		// summary: a Source object, which can be used as a DnD source, or a DnD target

		// object attributes (for markup)
		isSource: true,

		copyOnly: false,

		dragThreshold: 0,

		accept: ["text", 'treeNode', 'gridNode'],

		constructor: function(grid, params) {
			// summary: a constructor of the Source
			// grid: dojox.grid: the grid widget to build the source on
			// params: Object: a dict of parameters, recognized parameters are:
			//	isSource: Boolean: can be used as a DnD source, if true; assumed to be "true" if omitted
			//	accept: Array: list of accepted types (text strings) for a target; assumed to be ["text"] if omitted
			//	horizontal: Boolean: a horizontal container, if true, vertical otherwise or when omitted
			//	copyOnly: Boolean: always copy items, if true, use a state of Ctrl key otherwise
			//	skipForm: Boolean: don't start the drag operation, if clicked on form elements
			//	the rest of parameters are passed to the selector
			if (!params) {
				params = {};
			}
			dojo.mixin(this, params);
			this.isSource = typeof params.isSource == "undefined" ? true : params.isSource;
			var type = params.accept instanceof Array ? params.accept : ["text"];
			this.accept = null;
			if (type.length) {
				this.accept = {};
				for (var i = 0; i < type.length; ++i) {
					this.accept[type[i]] = 1;
				}
			}

			// class-specific variables
			this.isDragging = false;
			this.mouseDown = false;
			this.targetAnchor = null;
			this.targetBox = null;
			this._lastX = 0;
			this._lastY = 0;

			// states
			this.targetState = "";
			if (this.isSource) {
				dojo.addClass(this.domNode, "dojoDndSource");
			}
			if (this.accept) {
				dojo.addClass(this.domNode, "dojoDndTarget");
			}
			if (this.horizontal) {
				dojo.addClass(this.domNode, "dojoDndHorizontal");
			}
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
		canDrag: function(source, nodes) {
			// summary: checks, if the target can accept nodes from this source
			// source: Object: the source which provides items
			// nodes: Array: the list of transferred items
			return true;	// Boolean
		},

		/**
		 * Check if nodes can be dropped from source onto this target.
		 * @param source
		 * @param nodes
		 */
		canDrop: function(source, nodes) {
			// Since user can (currently) only drop one node from tree onto grid (tree.dndController.singular = true)
			// we ony need to check the last selected tree node instead of dropped nodes
			// TODO: canDropExternal/canDropInternal or do this in onMouseMove?
			console.log('canDrop', source, nodes)
			var tree = this.rfe.tree;
			var currTreeItem = this.rfe.currentTreeItem;
			var targetRow = tree.getNodesByItem(currTreeItem)[0].rowNode; // onMouseDown sets this, so we cant use it (yet)
			var isParent = this.checkParentChildDrop(source, targetRow);
			var hasSameParent = (source.current.item.parId == currTreeItem.id);
			var trgGridItem = this.getSelectedStoreItemFromGrid();
			var isDir = trgGridItem && trgGridItem.dir;
			console.log('isParent', isParent, 'hasSameParent', hasSameParent, 'isDir', isDir);
			return isParent || (hasSameParent && !isDir) ? false : true;
		},

		canDropRow: function(rowIndex, source, nodes) {
			// summary: stub funciton to be overridden if one wants to check for the ability to drop at the row level
			return true;
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
			if (this.isDragging && this.targetState == "Disabled") {
				return;
			}
			this.inherited("onMouseMove", arguments);
			var m = dojo.dnd.manager();

			if (this.isDragging) {
				if (this.canDropRow(this.currentRowIndex, m.source, m.nodes)) {
					m.canDrop(true);
				}
				else {
					m.canDrop(false);
				}
			}
			else {
				if (this.mouseDown && this.isSource && !this.gridEditMode &&
				(Math.abs(e.pageX - this._lastX) >= this.dragThreshold || Math.abs(e.pageY - this._lastY) >= this.dragThreshold)) {
					var nodes = this.getSelectedNodes();
					if (nodes.length) {
						//console.log("start drag:",nodes);
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
			this._lastX = e.pageX;
			this._lastY = e.pageY;
			this.inherited("onMouseDown", arguments);

			//console.log("mouseDown currentRow:",e.rowNode);
		},

		onMouseUp: function(e) {
			// summary: event processor for onmouseup
			// e: Event: mouse event
			if (this.mouseDown) {
				this.mouseDown = false;
				this.inherited(arguments);
			}
		},

		onMouseOver: function(e) {
			var m = dojo.dnd.manager();
			if (this.isDragging) {
				if (this.canDropRow(this.grid, e.rowIndex, m.source, m.nodes)) {
					//console.log( (this.targetState != "Disabled") , (!this.currentRowNode), (m.source != this) , !(e.rowIndex in this.grid.selection.selected ) );
					m.canDrop(this.targetState != "Disabled" && (!this.currentRowNode || m.source != this || !(e.rowIndex in this.grid.selection.selected)));
				}
			}
			else {
				m.canDrop(false);
			}
			this.inherited(arguments);
		},

		// topic event processors
		onDndSourceOver: function(source) {
			// summary: topic event processor for /dnd/source/over, called when detected a current source
			// source: Object: the source which has the mouse over it
			//console.log("onDndSourceOver: ",source,this, (source == this ) );
			if (this != source) {
				this.mouseDown = false;
				if (this.targetAnchor) {
					this._unmarkTargetAnchor();
				}
			}
			else if (this.isDragging) {
				var m = dojo.dnd.manager();
				if (m.source && m.nodes && m.nodes.length > 0) {
					var accepted = this.canDrop(m.source, m.nodes);
					m.canDrop(accepted);
				}
			}
		},

		onDndStart: function(source, nodes, copy) {
			// summary: topic event processor for /dnd/start, called to initiate the DnD operation
			// source: Object: the source which provides items
			// nodes: Array: the list of transferred items
			// copy: Boolean: copy items, if true, move items otherwise

			//console.log("onDndStart");
			if (this.isSource) {
				this._changeState("Source", this == source ? (copy ? "Copied" : "Moved") : "");
			}
			var accepted = this.canDrag(source, nodes);

			this._changeState("Target", accepted ? "" : "Disabled");

			if (accepted) {
				dojo.dnd.manager().overSource(this);
				dojo.dnd.manager().canDrop(false);
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
				// this one is for us => move nodes!
				this.onDrop(source, nodes, copy);
			}
			this.onDndCancel();
		},


		onDrop: function(source, nodes, copy) {
			// summary:
			//		called only on the current target, when drop is performed
			// source: Object
			//		the source which provides items
			// nodes: Array
			//		the list of transferred items
			// copy: Boolean
			//		copy items, if true, move items otherwise
			if (this != source) {
				this.onDropExternal(source, nodes, copy);
			}
			else {
				this.onDropInternal(nodes, copy);
			}
		},

		// called by onDrop() which is called by onDndDrop()
		onDropExternal: function(source, nodes, copy) {
			if (source.accept.treeNode) {
				this.onDropFromTree(source, nodes, copy);
			}
		},

		onDropInternal: function(source, nodes, copy) {
			console.log('onDropInternal: to be implemented', source, nodes, copy);
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
		 * Process dnd item(s) dropped externally from tree onto grid.
		 * @param source
		 * @param nodes
		 * @param copy
		 */
		onDropFromTree: function(source, nodes, copy) {
			var grid = this.rfe.grid, tree = this.rfe.grid;
			var store = this.rfe.storeCache;
			var trgItem = this.getSelectedStoreItemFromGrid();
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
		 * Returns store object form grid row index.
		 * TODO: find shorter name for this which is still descriptive
		 */
		getSelectedStoreItemFromGrid: function() {
			var item = null;
			var grid = this.rfe.grid;
			var store = this.rfe.storeCache.storeMemory;
			if (this.currentRowIdx) {
				item = grid.getItem(this.currentRowIdx);
				item = store.get(grid.store.getValue(item, 'id'));	// use memory store instead of grid's ItemWriteStore for direct property access and to always have same item format
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


