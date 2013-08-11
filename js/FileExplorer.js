define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/Deferred',
	'dojo/when',
	'dojo/cookie',
	'dojo/keys',
	'dojo/dom',
	'dojo/dom-class',
	'dojo/date/locale',
	'dojo/on',
	'dojo/topic',
	'dojo/query',	// required for dojo/on event delegation
	'dojo/io-query',
	'dojo/Stateful',
	'dijit/registry',
	'rfe/_Base',
	'rfe/Layout',
	'rfe/History',
	'rfe/Edit',
	'rfe/store/FileStore',
	'rfe/dialogs/dialogs',
	'rfe/dnd/Manager'	// needs to be loaded for dnd
], function(lang, declare, Deferred, when, cookie, keys, dom, domClass, locale, on, topic, query, ioQuery, Stateful,
				registry, _Base, Layout, History, Edit, FileStore, dialogs) {

	/**
	 * A module that creates an application that allows you to manage and browse files and directories on a remote web server.
	 * It consists of tree and a grid. The tree loads file data over REST via php from remote server.
	 * @module FileExplorer rfe/FileExplorer
	 */

	// TODO: multiselect (in tree allow only of files but not of folders)

	/*
	 *	@constructor
	 *	@extends {rfe/Layout}
	 * @mixes {rfe/Edit}
	 * @property {string} version
	 * @property {string} versionDate
	 * @property {dojo/Stateful} currentTreeObject keeps track of currently selected store object in tree. Equals always parent of grid items
	 * @property {dojo/Stateful} context keeps track of widget the context menu was created on (right clicked on)
	 * @config {boolean} isOnGridRow
	 * @config {boolean} isOnTreeRow
	 * @config {boolean} isOnGridContainer
	 * @config {boolean} isOnTreeContainer
	 * @property {object} history
	 * @config {array} steps saves the steps
	 * @config {int} curIdx index of current step we're on
	 * @config {int} numSteps number of steps you can go forward/back
	 * @property {rfe/store/FileStore} store
	 *
	 */
	return declare([_Base, History, Layout, Edit], {
		version: '0.9',
		versionDate: '2013',
		currentTreeObject: null,
		context: null,
		store: null,

		/**
		 * Need to know the page url in order to know which part of path is resource to load into app
		 * @param {string} origPageUrl url of application without path to a file/folder
		 **/
		origPageUrl: '/',

		constructor: function() {
			// TODO: should tree connect also on right click as grid? If so, attache event to set currentTreeItem
			this.currentTreeObject = new Stateful();	// allows Toolbar and Edit to keep track of selected object in tree
			this.store = new FileStore();
			this.context = {
				isOnGridRow: false,
				isOnGridContainer: false,
				isOnTreeRow: false,
				isOnTreeContainer: false
			};
			this.domNode = dom.byId(this.id);
		},

		startup: function() {
			this.init();
			this.initEvents();
		},

		initEvents: function() {
			var self = this,
				grid = this.grid,
				tree = this.tree,
				store = this.store;

			tree.on('click', function(object) {	// when calling tree.on(click, load) at once object is not passed
				self.displayChildrenInGrid(object).then(function() {
					self.currentTreeObject.set(object);
					self.set('history', object.id);
				});
			});
			tree.on('load', lang.hitch(this, this.initState));

			grid.on('.dgrid-row:click, .dgrid-row:dblclick', function(evt) {
				var object = grid.row(evt.target).data;
				if (evt.type == 'dblclick' && object.dir){
					self.display(object).then(function() {
						self.set('history', object.id);
					});
				}
				else {
					self.set('history', object.id);
				}
			});
			grid.on('dgrid-datachange', function(evt) {
				// catch using editor when renaming
				var obj = evt.cell.row.data;

				obj[store.labelAttr] = evt.value;
				store.put(obj).then(function() {
					grid.save();
				}, function() {
					grid.revert();
				});
			});

			on(this.panes.domNode, '.rfeTreePane:mousedown, .rfeGridPane:mousedown', function(evt) {
				self.set('context', evt, this);
			});

			on(this.domNode, '.dgrid-content:keydown, .dijitTreeContainer:keydown',  function(evt) {
				self.set('context', evt, this);
				self._onKeyDown(evt, this);
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
				dfd = when(store.getChildren(object), function() {
					var sort = grid.get('sort');
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
				path = this.store.storeMemory.getPath(object);
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
				def = when(this.store.get(object.parId), lang.hitch(this, function(object) {
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
			/*
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
			this.initState();
			*/
		},

		/**
		 * Handle key events on grid and tree.
		 * @private
		 */
		_onKeyDown: function(evt, sourceNode) {

			var nodeType = evt.target.nodeName.toLowerCase();

			if (nodeType === 'input' || nodeType === 'textarea') {
				// prevent calling delete
				return;
			}

			switch(evt.keyCode){
				// TODO: copy, paste, cut
				case keys.DELETE:
					this.del();
					break;
			}
		},

		/**
		 * Returns the current date.
		 * @return {string} formatted date
		 */
		getDate: function() {
			return locale.format(new Date(), {
				datePattern: 'dd.MM.yyyy',
				timePattern: 'HH:mm'
			});
		},

		/**
		 * Set object properties describing on which part of the file explorer we are on.
		 * @param {Event} evt
		 * @param {HTMLElement} node
		 */
		_setContext: function(evt, node) {
			var widget = registry.getEnclosingWidget(evt.target),
				isGridRow = typeof this.grid.row(evt) !== 'undefined',
				isTreeRow = widget && widget.baseClass === 'dijitTreeNode';

			this.context = {
				isOnGridRow: isGridRow,
				isOnGridContainer: domClass.contains(node, 'rfeGridPane') && !isGridRow,
				isOnTreeRow: isTreeRow,
				isOnTreeContainer: domClass.contains(node, 'rfeTreePane') && !isTreeRow
			};
		},

		/**
		 * Initializes the default or last state of the tree and the grid.
		 * Expects the tree to be loaded and expanded otherwise it will be set to root, then displays the correct folder in the grid.
		 */
		initState: function() {
			var self = this, arr, id,
				tree = this.tree,
				grid = this.grid,
				store = this.store,
				file = false,
				path = window.location.pathname.replace(this.origPageUrl, ''),
				paths,
				dfd = new Deferred();

			// id form url, can either be a file or a folder
			if (path !== '') {
				// load all parent paths since path can also just be an id instead of a full hierarchical file path
				dfd = when(store.get(path), function(object) {
					return store.storeMaster.getPath(object).then(function(paths) {
						if (object.dir) {
							id = object.id;
						}
						else {
							file = object;
							id = object.parId; // display parent folder of file in tree
							paths.pop();
						}
						return [paths];
					});
				});
			}
			// id from cookie
			else {
				paths = this.tree.loadPaths();
				if (paths.length > 0) {
					// we only use last object in array to set the folders in the grid (normally there would be one selection only anyway)
					arr = paths[paths.length - 1];
					id = path = arr[arr.length - 1];
				}
				// use tree root
				else {
					id = tree.rootNode.item.id;
				}
				dfd.resolve(paths);
			}

			// expand all paths
			dfd = dfd.then(function(paths) {
				return tree.set('paths', paths);
			});
			// get object from id of last item in path
			dfd = dfd.then(function() {
				return when(store.get(id), function(object) {
					self.set('history', path);
					self.currentTreeObject.set(object);
					self.context.isOnTreeRow = true;
					return object;
				});
			});
			// get objects children and display them in grid
			dfd = dfd.then(function(object) {
					// TODO: when object is a file get parent object's children
					return when(store.getChildren(object), function() {	// load children puts them in the cache, then set grid's store
						// Setting caching store for grid would not use cache, because cache.query() always uses the
						// master store => use storeMemory.
						grid.set('store', store.storeMemory, { parId: id });
						if (file) {
							var row = grid.row(file.id);
							grid.select(row);
						}
					});
			});
			return dfd;
		},

		showFileDetails: function() {
			// Note: A visible file/folder object is always loaded
			var dialog, id, store = this.store,
				i = 0, len,
				widget = this.context.isOnGridRow || this.context.isOnGridContainer ? this.grid : this.tree,
				sel = widget.selection;

			// TODO: if multiple selected file objects, only use one dialog with multiple values (and sum of all file sizes). Requires preloading folder contents first!
			// grid
			if (sel) {
				for (id in sel) {
					if (sel[id] === true) {
						dialog = dialogs.getByFileObj('fileProperties', store.get(id));
						dialog.show();
					}
				}
			}
			// TODO: extend dijit.tree._dndSelector to work same way as grid.selection ? so we don't need to differentiate here
			// tree
			else if (widget.selectedItems) {
				len = widget.selectedItems.length;
				for (i; i < len; i++) {
					dialog = dialogs.getByFileObj('fileProperties', widget.selectedItems[i]);
					dialog.show();
				}
			}
		}
	});

});