define([
	"dojo",
	'dijit',
	'dijit/Tree',
	"dijit/tree/_dndSelector",
	"dojo/dnd/Manager", // dojo.dnd.manager
	"dojo/_base/array", // dojo.forEach dojo.indexOf dojo.map
	"dojo/_base/connect", // dojo.isCopyKey dojo.subscribe dojo.unsubscribe
	"dojo/_base/declare", // dojo.declare
	"dojo/_base/html" // dojo.addClass dojo.position
], function(dojo, dijit) {

	dojo.declare("rfe.dnd.TreeSource", dijit.tree._dndSelector, {
		// summary:
		//		Handles drag and drop operations (as a source or a target) for `dijit.Tree`

		// isSource: [private] Boolean
		//		Can be used as a DnD source.
		isSource: true,

		// accept: String[]
		//		List of accepted types (text strings) for the Tree; defaults to
		//		["text"]
		accept: ['treeNode', 'gridNode'],

		// copyOnly: [private] Boolean
		//		Copy items, if true, use a state of Ctrl key otherwise
		copyOnly: false,

		// dragThreshold: Number
		//		The move delay in pixels before detecting a drag; 5 by default
		dragThreshold: 5,

		constructor: function(/*dijit.Tree*/ tree, /*dijit.tree.__SourceArgs*/ params) {
			// summary:
			//		a constructor of the Tree DnD Source
			// tags:
			//		private

			dojo.mixin(this, params || {});

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
			dojo.addClass(this.node, "dojoDndSource");
			dojo.addClass(this.node, "dojoDndTarget");

			// set up events
			this.topics = [
				dojo.subscribe("/dnd/source/over", this, "onDndSourceOver"),
				dojo.subscribe("/dnd/start", this, "onDndStart"),
				dojo.subscribe("/dnd/drop", this, "onDndDrop"),
				dojo.subscribe("/dnd/cancel", this, "onDndCancel")
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

		copyState: function(keyPressed) {
			// summary:
			//		Returns true, if we need to copy items, false to move.
			//		It is separated to be overwritten dynamically, if needed.
			// keyPressed: Boolean
			//		The "copy" control key was pressed
			// tags:
			//		protected
			return this.copyOnly || keyPressed;	// Boolean
		},

		destroy: function() {
			// summary:
			//		Prepares the object to be garbage-collected.
			this.inherited("destroy", arguments);
			dojo.forEach(this.topics, dojo.unsubscribe);
			this.targetAnchor = null;
		},

		_onDragMouse: function(e) {
			// summary:
			//		Helper method for processing onmousemove/onmouseover events while drag is in progress.
			//		Keeps track of current drop target.

			var m = dojo.dnd.manager(),
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

		onMouseMove: function(e) {
			// summary:
			//		Called for any onmousemove/ontouchmove events over the Tree
			// e: Event
			//		onmousemouse/ontouchmove event
			// tags:
			//		private
			if (this.isDragging && this.targetState == "Disabled") {
				return;
			}
			this.inherited(arguments);
			var m = dojo.dnd.manager();
			if (this.isDragging) {
				this._onDragMouse(e);
			} else {
				if (this.mouseDown && this.isSource &&
				(Math.abs(e.pageX - this._lastX) >= this.dragThreshold || Math.abs(e.pageY - this._lastY) >= this.dragThreshold)) {
					var nodes = this.getSelectedTreeNodes();
					if (nodes.length) {
						if (nodes.length > 1) {
							//filter out all selected items which has one of their ancestor selected as well
							var seen = this.selection, i = 0, r = [], n, p;
							nextitem: while ((n = nodes[i++])) {
								for (p = n.getParent(); p && p !== this.tree; p = p.getParent()) {
									if (seen[p.id]) { //parent is already selected, skip this node
										continue nextitem;
									}
								}
								//this node does not have any ancestors selected, add it
								r.push(n);
							}
							nodes = r;
						}
						nodes = dojo.map(nodes, function(n) {
							return n.domNode
						});
						m.startDrag(this, nodes, this.copyState(dojo.isCopyKey(e)));
					}
				}
			}
		},

		onMouseDown: function(e) {
			// summary:
			//		Event processor for onmousedown/ontouchstart
			// e: Event
			//		onmousedown/ontouchend event
			// tags:
			//		private
			this.mouseDown = true;
			this.mouseButton = e.button;
			this._lastX = e.pageX;
			this._lastY = e.pageY;
			this.inherited(arguments);
		},

		onMouseUp: function(e) {
			// summary:
			//		Event processor for onmouseup/ontouchend
			// e: Event
			//		onmouseup/ontouchend event
			// tags:
			//		private
			if (this.mouseDown) {
				this.mouseDown = false;
				this.inherited(arguments);
			}
		},

		onMouseOut: function() {
			// summary:
			//		Event processor for when mouse is moved away from a TreeNode
			// tags:
			//		private
			this.inherited(arguments);
			this._unmarkTargetAnchor();
		},

		// topic event processors
		onDndSourceOver: function(source) {
			// summary:
			//		Topic event processor for /dnd/source/over, called when detected a current source.
			// source: Object
			//		The dijit.tree.dndSource / dojo.dnd.Source which has the mouse over it
			// tags:
			//		private
			if (this != source) {
				this.mouseDown = false;
				this._unmarkTargetAnchor();
			} else if (this.isDragging) {
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

			if (this.isSource) {
				this._changeState("Source", this == source ? (copy ? "Copied" : "Moved") : "");
			}
			var accepted = this.checkAcceptance(source, nodes);

			this._changeState("Target", accepted ? "" : "Disabled");

			if (this == source) {
				dojo.dnd.manager().overSource(this);
			}

			this.isDragging = true;
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
				dojo.when(dfd, dojo.hitch(dndItem, function() {
					// TODO: find better solution, e.g. generic
					console.log('treeSource removeFromSelection', this, source.selection)
					source.removeFromSelection(this.data.gridRowIndex);	// will call removeFromSelection
				}))
			}
		},

		onDndCancel: function() {
			// summary:
			//		Topic event processor for /dnd/cancel, called to cancel the DnD operation
			// tags:
			//		private
			this._unmarkTargetAnchor();
			this.isDragging = false;
			this.mouseDown = false;
			delete this.mouseButton;
			this._changeState("Source", "");
			this._changeState("Target", "");
		},

		// When focus moves in/out of the entire Tree
		onOverEvent: function() {
			// summary:
			//		This method is called when mouse is moved over our container (like onmouseenter)
			// tags:
			//		private
			this.inherited(arguments);
			dojo.dnd.manager().overSource(this);
		},
		onOutEvent: function() {
			// summary:
			//		This method is called when mouse is moved out of our container (like onmouseleave)
			// tags:
			//		private
			this._unmarkTargetAnchor();
			var m = dojo.dnd.manager();
			if (this.isDragging) {
				m.canDrop(false);
			}
			m.outSource(this);

			this.inherited(arguments);
		},

		_isParentChildDrop: function(source, targetRow) {
			// summary:
			//		Checks whether the dragged items are parent rows in the tree which are being
			//		dragged into their own children.
			//
			// source:
			//		The DragSource object.
			//
			// targetRow:
			//		The tree row onto which the dragged nodes are being dropped.
			//
			// tags:
			//		private

			// If the dragged object is not coming from the tree this widget belongs to,
			// it cannot be invalid.
			if (!source.tree || source.tree != this.tree) {
				return false;
			}

			var root = source.tree.domNode;
			var ids = source.selection;

			var node = targetRow.parentNode;

			// Iterate up the DOM hierarchy from the target drop row,
			// checking of any of the dragged nodes have the same ID.
			while (node != root && !ids[node.id]) {
				node = node.parentNode;
			}

			return node.id && ids[node.id];
		},

		_unmarkTargetAnchor: function() {
			// summary:
			//		Removes hover class of the current target anchor
			// tags:
			//		private
			if (!this.targetAnchor) {
				return;
			}
			this.targetAnchor = null;
		},

		_markDndStatus: function(copy) {
			// summary:
			//		Changes source's state based on "copy" status
			this._changeState("Source", copy ? "Copied" : "Moved");
		}
	});

	return rfe.dnd.TreeSource;
});
