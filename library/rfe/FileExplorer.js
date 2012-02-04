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
	'dojo/on',
	'dojo/Stateful',
	'dijit/registry',
	'rfe/Layout',
	'rfe/Edit',
	'rfe/Store/FileCache',
	'rfe/dnd/Avatar'
], function(lang, array, declare, Deferred, cookie, keys, dom, domClass, locale, on, Stateful, registry, Layout, Edit, FileCache) {
	/**
	 * File explorer allows you to browse files.	 *
	 * The file explorer consists of a tree and a grid. The tree loads file
	 * data via php from disk.
	 */


	// TODO: multi select (in tree allow only of files but not of folders)
	/**
	 * @class
	 */
	return declare('rfe.FileExplorer', [Layout, Edit], {
		version: '1.0',
		versionDate: '2012',
		currentTreeObject: null, // currently selected store object in tree, equals always parent of grid items
		currentGridObject: null, 	 // currently (last, when multi-) selected store object in grid

		history: null,

		/**
		 * Creates the file explorer.
		 * The global property object contains the urls to communicate with PHP backend.
		 * @param {object} props
		 * @constructor
		 */
		constructor: function(props) {
			// TODO: should tree connect also on right click as grid? If so, attache event to set currentTreeItem
			this.currentTreeObject = new Stateful();	// allows Toolbar and Menubar to keep track of selected item in tree
			this.history = {
				steps: [],		// saves the steps
				curIdx: null,	// index of current history array we're on
				numSteps: 5		// number of steps you can go forward/back
			};
			this.store = new FileCache();
		},

		startup: function() {
			this.create();
			this.initEvents();
//			this.initContextMenu(dom.byId(this.id));
		},

		initEvents: function() {
			var grid = this.grid, tree = this.tree;
			tree.on('click', lang.hitch(this, function(object, node) {
				if (object.id != this.currentTreeObject.id) {	// prevent executing twice (dblclick)
//					grid.selection.clear(); 					// otherwise object in not-displayed folder is still selected or with same idx
					this.displayChildrenInGrid(object);
					this.setHistory(object.id);
				}
				this.currentTreeObject.set(object);
			}));
			tree.on('load', lang.hitch(this, this.initState));

			grid.on('dblclick', lang.hitch(this, function(evt){
				var obj = grid.row(evt.target).data;
				if (obj.dir){
					this.display(obj);
					this.setHistory(obj.id);
				}
			}));
			 /*
			 					on(this.borderContainer.domNode, 'contextmenu', function(evt) {
						event.stop(evt);
					});
			 */
		},


		/**
		 * Displays folder content in grid.
		 * @param {Object} object dojo data object
		 * @return {dojo.Deferred}
		 */
		displayChildrenInGrid: function(object) {
			var grid = this.grid;
			var dfd = new Deferred();
			if (object.dir) {
				dfd = Deferred.when(this.store.getChildren(object), function() {				  // TODO:  I think we can use memory store directly because they are already loaded
					grid.setQuery({
						parId: object.id
					});
				});
			}
			else {
				dfd.resolve(object);
			}
			return dfd;
		},

		/**
		 * Displays the store object (folder) in the tree and it's children in the grid.
		 * The tree and the grid can either be in sync meaning that they show the same content (e.g. tree folder is expanded)
		 * or the grid is one level down (e.g. tree folder is selected but not expanded).
		 * @param {Object} object store object
		 * @return {dojo/Deferred}
		 */
		display: function(object) {
			var dfd = new Deferred();
			if (object.dir) {
				var path = this.store.getPath(object);
				dfd = this.tree.set('path', path);
			}
			else {
				dfd.reject(false);
			}
			dfd.then(lang.hitch(this, function() {
				return this.displayChildrenInGrid(object);
			}));
			this.currentTreeObject.set(object);
			return dfd;
		},

		/**
		 * Display parent directory.
		 * @param {Object} [object] dojo.data.object
		 */
		goDirUp: function(object) {
			var def;
			if (!object) {
				object = this.currentTreeObject;
			}
			if (object.parId) {
				def = Deferred.when(this.store.get(object.parId), lang.hitch(this, function(object) {
					return this.display(object);
				}), function(err) {
					console.debug('Error occurred when going directory up', err);
				});
			}
			else {
				def = new Deferred();
				def.resolve(false);
			}
			return def;
		},

		/**
		 * Reload current folder.
		 */
		reload: function() {
			var dndController = this.tree.dndController.declaredClass;

			this.store.storeMemory.setData([]);
			this.grid.refresh();

			// reset and rebuild tree
			this.tree.dndController.destroy();	// cleanup dnd connections and such
			this.tree._itemNodesMap = {};
			this.tree.rootNode.destroyRecursive();
			this.tree.rootNode.state = "UNCHECKED";
			this.tree.dndController = dndController; //'rfe.dnd.TreeSource',
			this.tree.postMixInProperties();
			this.tree.postCreate();
		},

		/**
		 * Adds current object id to history.
		 * @param {string} itemId id of JsonRestStore object
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
		 * Remove object form history.
		 * @param {string} itemId
		 */
		removeHistory: function(itemId) {
			var hist = this.history;
			hist.steps = dojo.filter(hist.steps, function(object) {
				return object !== itemId;
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
				return Deferred.when(this.store.get(id), lang.hitch(this, function(object) {
					return this.display(object);
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
		 * Returns the last selected object of the focused widget.
		 */
		getLastSelectedItem: function() {
			// widget.focused does not work when used from toolbar, since focus is moved to menu
			// TODO use grid.selection and tree.selection instead ?
			if (this.tree.focused || this.layout.panes.treePane.focused) {
				return this.currentTreeObject;
			}
			else if (this.grid.focused) {
				return this.currentGridObject;
			}
			else {
				return this.currentGridObject || this.currentTreeObject;
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
		 * Initializes the default or last state of the tree and the grid.
		 * Expects the tree to be loaded and expanded otherwise it will be set to root, then displays the correct folder in the grid.
		 */
		initState: function() {
			var tree = this.tree, grid = this.grid;
			var store = this.store;
			var object, oreo, arr, id, paths = [];

			oreo = cookie(tree.dndController.cookieName);
			if (tree.persist && oreo) {
				// extract information to display folder content in grid
				paths = array.map(oreo.split(","), function(path) {
					return path.split("/");
				});
				// we only use last object in array to set the folders in the grid (normally there would be one selection only anyway)
				arr = paths[paths.length - 1];
				id = arr[arr.length - 1];

				Deferred.when(store.get(id), lang.hitch(this, function(object) {
					Deferred.when(store.getChildren(object), function() {	// load children first before setting store
						grid.setStore(store.storeMemory, {	// also calls setQuery
							parId: id
						});
					});
					this.currentTreeObject.set(object);
				}));
			}
			else {
				// no cookie available use root
				object = tree.rootNode.item;
				id = object.id;
				this.display(object);
			}

			this.setHistory(id);   // do not set history in display() since history uses display too in goHistory()
		}
	});

});