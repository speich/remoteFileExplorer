define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
   'dojo/cookie',
	'dojo/keys',
	'dojo/dom',
	'dojo/dom-class',
	'dojo/date/locale',
	'dijit/registry',
	'rfe/Layout',
	'rfe/Edit',
	'rfe/dnd/Avatar'
], function(lang, array, declare, Deferred, cookie, keys, dom, domClass, locale, registry, Layout, Edit) {
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
		version:'1.0',
		versionDate:'2011',
		currentTreeItem:null, // currently selected store object in tree, equals always parent of grid items
		currentGridItem:null, // currently (last, when multi-) selected store object in grid

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
			tree.on('load', lang.hitch(this, this._initState));
			tree.on('click', lang.hitch(this, function(item, node) {
				// note onClick is also fired when user uses keyboard navigation and hits space
				if (item != this.currentTreeItem) {		// prevent executing twice (dblclick)
					grid.selection.clear(); 				// otherwise item in not-displayed folder is still selected or with same idx
					grid.showMessage(grid.loadingMessage);
					Deferred.when(this.showItemChildrenInGrid(item), function() {	// only called, when store.openOnClick is set to false
						tree.focusNode(node);				// refocus node because it got moved to grid
					});
					this.setHistory(item.id);
				}
				this.currentTreeItem = item;
			}));

			grid.on('rowMouseDown', lang.hitch(this, function(evt) {
				// rowMouseDown also registers right click
				this.currentGridItem = grid.getItem(evt.rowIndex);     // TODO use grid.selection instead ?
			}));
			grid.on('rowDblClick', lang.hitch(this, function(evt) {
				// cancel when editing
				if (grid.edit.isEditing()) {
					return;
				}
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
			var grid = this.grid;
			var dfd = new Deferred();
			var store = this.store;

			if (!grid.store) {
				grid.setStore(this.store, {
					parId: item.id
				});
			}

			if (item.dir) {
				store.skipWithNoChildren = false;
				return Deferred.when(store.getChildren(item), function() {
					store.skipWithNoChildren = true;
					grid.setQuery({
						parId: item.id
					});
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
			grid.showMessage(grid.loadingMessage);
			def.then(lang.hitch(this, function() {
				return this.showItemChildrenInGrid(item);
			}));
			return def;
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
		 * @param {string} itemId id of JsonRestStore item
		 */
		setHistory: function(itemId) {
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
			hist.steps.push(itemId);
		},

		/**
		 * Remove item form history.
		 * @param {string} itemId
		 */
		removeHistory: function(itemId) {
			var hist = this.history;
			hist.steps = dojo.filter(hist.steps, function(item) {
				return item !== itemId;
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
            // widget.focused does not work when used from toolbar, since focus is moved to menu
			// TODO use grid.selection and tree.selection instead ?
			if (this.tree.focused || this.layout.panes.treePane.focused) {
				return this.currentTreeItem;
			}
			else if (this.grid.focused) {
				return this.currentGridItem;
			}
			else {
				return this.currentGridItem || this.currentTreeItem;
			}
		},

		/**
		 * Returns an object describing on which part of the file explorer we are on
		 * @param {Event} evt
		 * @return {Object}
		 */
		getContext: function(evt) {
			// find in which pane (of grid/tree) we are and if we are over the grid/tree or below
			// TODO: find better solution for this
			var obj = {
				isOnGrid: false,
				isOnTree: false,
				isOnTreePane: false,
				isOnGridPane: false,
				widget: null
			};
			var node = evt.target || node;
			while (node && node.tagName !== "BODY") {
				if (domClass.contains(node, 'dijitTree')) {
					obj.isOnTree = true;
					obj.widget = this.tree;
					break;
				}
				else if (domClass.contains(node, 'dojoxGridContent')) {
					obj.isOnGrid = true;
					obj.widget = this.grid;
					break;
				}
				else if (domClass.contains(node, 'dijitContentPane')) {
					if (node.id == 'rfeContentPaneTree') {
						obj.isOnTreePane = true;
					}
					else if (node.id == 'rfeContentPaneGrid') {
						obj.isOnGridPane = true;
					}
					break;
				}
				node = node.parentNode;
			}
			return obj;
		},

		/**
		 * Sets the tree to its last state.
		 * Reads the tree cookies to expand and set the tree selected and display the correct folder in the grid.
		 */
		_initState: function() {
			var tree = this.tree, grid = this.grid;
			var item, oreo, arr, id, paths = [];

			grid.showMessage(grid.loadingMessage);
			console.log('patch not applied yet')
			oreo = cookie(tree.dndController.cookieName);
			if (tree.persist && oreo) {
				paths = array.map(oreo.split(","), function(path){
				   return path.split("/");
				})
				tree.set('paths', paths);
				// we only use last to set the folders in the grid (normally there would be one selection only anyway)
				arr = paths[paths.length - 1];
				id = arr[arr.length - 1];
				Deferred.when(this.store.get(id), lang.hitch(this, function(item) {
					this.showItemChildrenInGrid(item); // no return, since we don't have to wait for the grid to load
					this.currentTreeItem = item;
				}));
			}
			else {
				item = tree.rootNode.item;
				id = item.id;
				this.display(item);
			}

			this.setHistory(id);   // do not set history in display() since history uses display too
		}
	});

});