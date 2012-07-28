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
	'dojo/mouse',
	'dojo/Stateful',
	'dijit/registry',
	'rfe/Layout',
	'rfe/Edit',
	'rfe/Store/FileStore',
	'rfe/dnd/Manager'
], function(lang, array, declare, Deferred, cookie, keys, dom, domClass, locale, on, mouse, Stateful, registry, Layout, Edit, FileStore) {

	// TODO: multiselect (in tree allow only of files but not of folders)
	// TODO: override dgrid.renderRow() to create different views for grid content (e.g. view = list, details, thumbnails, etc.)

	/**
	 * File explorer allows you to browse files.
	 * It consists of a tree and a grid. The tree loads file data over REST via php from remote server.
	 * @class
	 * @name rfe.FileExplorer
	 * @property {string} version
	 * @property {string} versionDate
	 * @property {dojo.Stateful} currentTreeObject keeps track of currently selected store object in tree. Equals always parent of grid items
	 * @property {dojo.Stateful} context keeps track of widget the context menu was created on (right clicked on)
	 * @config {boolean} isOnGrid
	 * @config {boolean} isOnTree
	 * @config {boolean} isOnGridPane
	 * @config {boolean} isOnTreePane
	 * @property {object} history
	 * @config {array} steps saves the steps
	 * @config {int} curIdx index of current step we're on
	 * @config {int} numSteps number of steps you can go forward/back
	 * @property {rfe.store.FileStore}
	 *
	 */
	return declare([Layout, Edit], /** @lends rfe.FileExplorer.prototype */ {
		version: '1.0',
		versionDate: '2012',
		currentTreeObject: null,
		context: null,
		history: null,
		store: null,

		/**
		 * Creates the file explorer.
		 * The global property object contains the urls to communicate with PHP backend.
		 * @constructor
		 */
		constructor: function() {
			// TODO: should tree connect also on right click as grid? If so, attache event to set currentTreeItem
			this.currentTreeObject = new Stateful();	// allows Toolbar and Menubar to keep track of selected item in tree
			this.history = {
				steps: [],
				curIdx: null,
				numSteps: 5
			};
			this.store = new FileStore();
			this.context = new Stateful({
				isOnGrid: false,
				isOnTree: false,
				isOnTreePane: false,
				isOnGridPane: false
			});
		},

		startup: function() {
			this.init();
			this.initEvents();
//			this.initContextMenu(dom.byId(this.id));
		},

		initEvents: function() {
			var self = this,
				grid = this.grid, tree = this.tree,
				store = this.store;

			tree.onClick = function(object) {
				self.displayChildrenInGrid(object);
				self.setHistory(object.id);
				self.currentTreeObject.set(object);
			};
			tree.onDblClick = function(object, nodeWidget, evt) {
				if(nodeWidget.isExpandable){
					this._onExpandoClick({ node: nodeWidget });
				}
				self.displayChildrenInGrid(object);
				self.setHistory(object.id);
				self.currentTreeObject.set(object);
			};
			tree.on('load', lang.hitch(this, this.initState));

			grid.on('dblclick', function(evt) {
				// TODO: prevent that this also fires  on header dblclick
				var obj = grid.row(evt.target).data;
				if (obj.dir){
					self.display(obj);
					self.setHistory(obj.id);
				}
			});
			grid.on("dgrid-datachange", function(evt) {
				var obj = evt.cell.row.data;
				obj[store.labelAttr] = evt.value;
				Deferred.when(store.put(obj), function() {
					grid.save();
				}, function() {
					grid.revert();
				});
			});

			// TODO: Set context also when using keyboard navigation
			on(this.panes.domNode, '.rfeTreePane:mousedown, .rfeGridPane:mousedown, .dijitTreeRow:mousedown, .dgrid-row:mousedown', function(evt) {
				var node = this;
				//console.log('setting context to', node)
				lang.hitch(self, self._setContext(evt, node));
			});

		},

		/**
		 * Displays folder content in grid.
		 * @param {Object} object dojo data object
		 * @return {dojo.Deferred}
		 */
		displayChildrenInGrid: function(object) {
			var grid = this.grid,
				store = this.store,
				dfd = new Deferred();

			if (object.dir) {
				dfd = Deferred.when(store.getChildren(object), function() {  // TODO:  I think we can use memory store directly because they are already loaded
					//grid.renderArray(children)
					// cache.query() always queries the master store -> no caching!
					var sort = grid.get('sort');
					if (sort.length === 1) {
						sort.unshift({attribute: store.childrenAttr, descending: false});
					}
					grid.set('query', {parId: object.id}, {sort: sort});
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
			var path, dfd = new Deferred();
			if (object.dir) {
				path = this.store.getPath(object);
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
			if (hist.curIdx === null) {
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
			if (hist.steps.length === hist.numSteps + 1) {
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
			hist.steps = array.filter(hist.steps, function(object) {
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
			var def = new Deferred(),
				hist = this.history,
				id = null;
			if (direction === 'back' && hist.curIdx > 0) {
				id = hist.steps[--hist.curIdx];
			}
			else if (direction === 'forward' && hist.curIdx < hist.steps.length) {
				id = hist.steps[++hist.curIdx];
			}
			if (id !== null) {
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
		 * Returns an object describing on which part of the file explorer we are on
		 * @param {Event} evt
		 */
		_setContext: function(evt, node) {
			/*if (!mouse.isRight(evt)) {
				return;
			}*/
			this.context.set({
				isOnGrid: domClass.contains(node, 'dgrid-row'),
				isOnGridPane: domClass.contains(node, 'rfeGridPane'),
				isOnTree: domClass.contains(node, 'dijitTreeRow'),
				isOnTreePane: domClass.contains(node, 'rfeTreePane')
			});

		},

		/**
		 * Initializes the default or last state of the tree and the grid.
		 * Expects the tree to be loaded and expanded otherwise it will be set to root, then displays the correct folder in the grid.
		 */
		initState: function() {
			var tree = this.tree, grid = this.grid, store = this.store,
				object, oreo, arr, id, paths = [];

			oreo = tree.dndController.cookieName ? cookie(tree.dndController.cookieName) : false;	// not available in 1.7.2
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
						// Setting caching store for grid would not use cache, because cache.query() always uses the
						// master store => use storeMemory.
						grid.set('store', store.storeMemory, { parId: id });
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