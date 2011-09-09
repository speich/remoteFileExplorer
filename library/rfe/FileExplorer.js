define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/keys',
	'dojo/dom',
	'dojo/dom-class',
	'dojo/date/locale',
	'dijit/registry',
	'rfe/Layout',
	'rfe/Edit'
], function(lang, declare, Deferred, keys, dom, domClass, locale, registry, Layout, Edit) {
	/**
	 * File explorer allows you to browse files.
	 *
	 * The file explorer consists of a tree and a grid. The tree loads file
	 * data via php from disk.
	 *
	 * JsonRestStore.save() contains valuable information. *
	 * TODO: grid even selected, focus and selected vs selected but not focus
	 */


	// TODO: multi select (in tree allow only of files but not of folders)
	/**
	 * @class
	 */
	return declare('rfe.FileExplorer', [Layout, Edit], {
		version: '1.0',
		versionDate: '2011',
		currentTreeItem: null, 	// currently selected store object in tree, equals always parent of grid items
		currentGridItem: null,  // currently (last, when multi-) selected store object in grid
		currentWidget: null,    // currently selected widget, which is either tree or grid

		history: {
			steps: [],     // saves the steps
			curIdx: null,	// index of current history array we're on
			numSteps: 5    // number of steps you can go forward/back
		},

		/**
		 * Creates the file explorer.
		 * The global property object contains the urls to communicate with PHP backend.
		 * @param {object} args
		 * @constructor
		 */
		constructor: function(args) {
			// TODO: should tree connect also on right click as grid? If so, attache event to set currentTreeItem
			var grid = this.grid, tree = this.tree;

			lang.mixin(this, args);

			// init tree events
			tree.on('load', lang.hitch(this, function() {
				var root = tree.rootNode;
				var item = root.item;
//				this.tree.set('path', ['root']);
		//		root.setSelected(true); // root is never deselected again
		//		tree.focusNode(root);
				this.showItemChildrenInGrid(item);
				this.setHistory(item.id);
				this.currentTreeItem = item;
			}));
			tree.on('click', lang.hitch(this, function(item) {
				if (item != this.currentTreeItem) { // prevent executing twice (dblclick)
					grid.selection.clear(); // otherwise item in not-displayed folder is still selected or with same idx
					this.showItemChildrenInGrid(item);	// only called, when store.openOnClick is set to false
					this.setHistory(item.id);
				}
				this.currentTreeItem = item;
			}));
			tree.on('keyDown', lang.hitch(this, function(evt) {
				if (evt.keyCode == keys.SPACE) {
					var node = registry.getEnclosingWidget(evt.target);
					tree.focusNode(node);
					this.showItemChildrenInGrid(node.item);
					this.setHistory(node.item.id);
						 this.currentTreeItem = item;
				}
			}));

			grid.on('rowMouseDown', lang.hitch(this, function(evt) {
				// rowMouseDown also registeres right click
				var item = grid.getItem(evt.rowIndex);
				this.currentGridItem = item;
			}));
			grid.on('rowDblClick', lang.hitch(this, function(evt) {
				var item = grid.getItem(evt.rowIndex);
				if (item.dir) {
					this.display(item);
					this.setHistory(item.id);
				}
			}));

			this.createLayout(this.id);
			this.initContextMenu(dom.byId(this.id));
		},

		/**
		 * Displays folder content in grid.
		 * @param {Object} item dojo data item
		 * @return {dojo.Deferred}
		 */
		showItemChildrenInGrid: function(item) {
			// TODO: use on(store.getChildren) instead or even do it in getChildren?
			var grid = this.grid;
			var dfd = new Deferred();
			var store = this.store;
			if (item.dir) {
				store.skipWithNoChildren = false;
				return Deferred.when(store.getChildren(item), function() {
					store.skipWithNoChildren = true;
					grid.setStore(store, {
						parId: item.id
					});
					// grid.setItems(items);	// this can not be used since it kills sorting
				});
			}
			else {
				dfd.resolve(item);
				return dfd;
			}
		},

		/**
		 * Displays folder content in tree.
		 * Returns false if item is not a folder, otherwise returns a dojo.Deferred
		 * @param {Object} item dojo.data.item
		 * @return {object} dojo.Deferred returning boolean
		 */
		showItemInTree: function(item) {
			var dfd = new Deferred();
			if (item.dir) {
				var path = this.store.getPath(item);
				dfd = this.tree.set('path', path);
			}
			else {
				dfd.reject(false);
			}
			this.currentTreeItem = item;
			return dfd;
		},

		/**
		 * Display parent directory.
		 * @param {Object} [item] dojo.data.item
		 */
		goDirUp: function(item) {
			var def;
			if (!item) {
				item = this.currentTreeItem;
			}
			if (item.parId) {
				return Deferred.when(this.store.get(item.parId), lang.hitch(this, function(item) {
					return this.display(item);
				}), function(err) {
					console.debug('Error occurred when going directory up', err);
				});
			}
			else {
				def = new Deferred();
				def.resolve(false);
				return def;
			}
		},

		/**
		 * Displays the data item (folder) in the tree and it's children in the grid.
		 * The tree and the grid can either be in sync meaning that they show the same content (e.g. tree folder is expanded)
		 * or the grid is one level down (e.g. tree folder is selected but not expanded).
		 * @param {Object} [item] dojo.data.item
		 * @return {Object} dojo.Deferred
		 */
		display: function(item) {
			var grid = this.grid;
			var def = this.showItemInTree(item);
			grid.selection.deselectAll();
			def.then(lang.hitch(this, function() {
				grid.showMessage(grid.loadingMessage);
				this.showItemChildrenInGrid(item);
			}));
			return def;
		},

		/**
		 * Reload current folder.
		 */
		reload: function() {
			var grid = this.grid;
			var dndController = this.tree.dndController.declaredClass;

			this.store.storeMemory.data = [];

			// reset grid
			grid._clearData();	// this is not really necessary, more of a visual feedback to user

			// reset and rebuild tree
			this.tree.dndController.destroy();	// cleanup dnd connections and such
			this.tree._itemNodesMap = {};
			this.tree.rootNode.destroyRecursive();
			this.tree.rootNode.state = "UNCHECKED";
			this.tree.dndController = dndController; //'rfe.dnd.TreeSource',
			this.tree.postMixInProperties();
			this.tree.postCreate();

			this.display(this.currentGridItem || this.currentTreeItem);
		},

		/**
		 * Adds current item id to history.
		 * @param {string} resourceId id of JsonRestStore item
		 */
		setHistory: function(resourceId) {
			var hist = this.history;

			// first use: initialize history array
			if (hist.curIdx == null) {
				hist.curIdx = 0;
			}
			// move index since we have not used up all available steps yet
			else if (hist.curIdx < hist.numSteps) {
				hist.curIdx++;
			}
			// back button used: reset hist array
			if (hist.curIdx < hist.steps.length - 1) {
				hist.steps = hist.steps.slice(0, hist.curIdx);
			}
			// keep hist array at constant length of number of steps
			if (hist.steps.length == hist.numSteps + 1) {
				hist.steps.shift();
			}
			hist.steps.push(resourceId);
		},

		/**
		 * Remove item form history.
		 * @param {string} resourceId
		 */
		removeHistory: function(resourceId) {
			var hist = this.history;
			hist.steps = dojo.filter(hist.steps, function(item) {
				return item !== resourceId;
			});
			hist.curIdx--;
		},

		/**
		 * Go back or forward in history.
		 * @param {string} direction
		 * @return {object} dojo.Deferred
		 */
		goHistory: function(direction) {
			var def = new Deferred();
			var hist = this.history;
			var id = null;
			if (direction == 'back' && hist.curIdx > 0) {
				id = hist.steps[--hist.curIdx];
			}
			else if (direction == 'forward' && hist.curIdx < hist.steps.length) {
				id = hist.steps[++hist.curIdx];
			}
			if (id != null) {
				return Deferred.when(this.store.get(id), lang.hitch(this, function(item) {
					return this.display(item);
				}));
			}
			else {
				return def;
			}
		},

		/**
		 * Returns the current date.
		 * @return {string} formated date
		 */
		getDate: function() {
			return locale.format(new Date(), {
					datePattern: 'dd.MM.yyyy',
					timePattern: 'HH:mm'
			  });
		},

		/**
		 * Returns the last selected item of the focused widget.
		 */
		getLastSelectedItem: function() {
			if (this.tree.focused || this.layout.panes.treePane.focused) {
				return this.currentTreeItem;
			}
			else if (this.grid.focused) {
				return this.currentGridItem;
			}
			else {
				return null;
			}
		},

		/**
		 * Returns an object describing on which part of the file explorer we are on
		 * @param {Event} evt
		 * @return {Object}
		 */
		getWidget: function(evt) {
			// find in which pane (of grid/tree) we are and if we are over the grid/tree or below
			// TODO: find better solution for this
			var obj = {};
			var widget = registry.getEnclosingWidget(evt.target);
			if (domClass.contains(widget.domNode, 'dijitTreeNode')) {
				obj.isOnTree = true;
				obj.widget = widget.tree;
			}
			else if (domClass.contains(widget.domNode, 'dijitContentPane')) {
				obj.isOnTreePane = true;
				obj.widget = widget.tree;
			}
			else if (domClass.contains(widget.domNode, 'dojoxGridCell')) {
				obj.isOnGrid = true;
				obj.widget = widget.grid || widget.tree;
			}
			else if (domClass.contains(widget.domNode, 'dojoxGridScrollbox')) {
				obj.isOnGridPane = true;	// = scrollbox
			}
			return obj;
		}

	});

});