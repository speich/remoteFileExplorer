/**
 * File explorer allows you to browse files.
 *
 * The file explorer consists of a tree and a grid. The tree loads file
 * data via php from disk.
 *
 * JsonRestStore.save() contains valuable information. *
 * TODO: grid even selected, focus and selected vs selected but not focus
 */
dojo.provide('rfe.FileExplorer');

dojo.require('rfe.Layout');
dojo.require('rfe.Edit');
dojo.require('dojo.date.locale');

// TODO: multi select (in tree allow only of files but not of folders)
/**
 * @class
 */
dojo.declare('rfe.FileExplorer', [rfe.Layout, rfe.Edit], {
	version: '1.0',
	versionDate: '2011',
	currentTreeItem: null, 	// currently selected store object in tree, equals always parent of grid items
	currentGridItem: null,  // currently selected store object in grid

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
		var grid = this.grid, tree = this.tree;

		dojo.safeMixin(this, args);

		// init tree events
		dojo.connect(tree, 'onLoad', this, function() {
			var root = tree.rootNode;
			var item = root.item;
//			root.setSelected(true);
//			tree.focusNode(root);
			this.showItemChildrenInGrid(item);
			this.setHistory(item.id);
			this.currentTreeItem = item;
		});
		dojo.connect(tree, 'onClick', this, function(item) {
			if (item != this.currentTreeItem) { // prevent executing twice (dblclick)
				grid.selection.clear(); // otherwise item in not-displayed folder is still selected or with same idx
				this.showItemChildrenInGrid(item);	// only called, when store.openOnClick is set to false
				this.setHistory(item.id);
			}
			this.currentTreeItem = item;
		});
		dojo.connect(tree, 'onKeyDown', this, function(evt) {
			if (evt.keyCode == dojo.keys.SPACE) {
				var node = dijit.getEnclosingWidget(evt.target);
				tree.focusNode(node);
				this.showItemChildrenInGrid(node.item);
				this.setHistory(node.item.id);
                this.currentTreeItem = item;
			}
		}, tree);

		dojo.connect(grid, 'onRowDblClick', this, function(evt) {
			var store = this.storeCache.storeMemory;
			var item = grid.getItem(evt.rowIndex);
			var id = grid.store.getValue(item, 'id');
			item = store.get(id);	// use memory store instead of grid's ItemWriteStore for direct property access and to always have same item format
			if (item != this.currentGridItem && item.dir) {	// prevent executing twice
				this.display(item);
				this.setHistory(item.id);
				this.currentGridItem = item;
			}
		});
		this.createLayout(this.id);
		this.createContextMenu(dojo.byId(this.id));
	},

	/**
	 * Displays folder content in grid.
	 * @param {Object} item dojo data item
	 * @return {dojo.Deferred}
	 */
	showItemChildrenInGrid: function(item) {
		var grid = this.grid;
		var dfd = new dojo.Deferred();
		var s1 = this.storeCache, s2 = grid.store;
		if (item.dir) {
			s1.skipWithNoChildren = false;
			return dojo.when(s1.getChildren(item), function(items) {
				s1.skipWithNoChildren = true;
				s2.clearOnClose = true;
            s2.data = {
					identifier: 'id',
					items: dojo.clone(items)   // prevents item properties to be converted to an array in the storeCache
				};
				s2.close();
				grid.setStore(s2);
				// unfortunately, this can not be used since sorting would not work anymore
				//grid.setItems(items);
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
		var dfd = new dojo.Deferred();
		if (item.dir) {
			var path = this.storeCache.getPath(item);
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
		var def = new dojo.Deferred();
		if (!item) {
			item = this.currentTreeItem;
		}
		if (item.parId) {
			return dojo.when(this.storeCache.get(item.parId), dojo.hitch(this, function(item) {
				return this.display(item);
         }), function(err) {
				console.debug('Error occurred when going directory up', err);
			});
		}
		else {
			return def.resolve(false);
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
	//	grid.selection.clear();
		grid.selection.deselect();
		def.then(dojo.hitch(this, function() {
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
		var gridStore = grid.store;
		var dndController = this.tree.dndController.declaredClass;

		this.storeCache.storeMemory.data = [];

		// reset grid
		gridStore.clearOnClose = true;
      gridStore.data = {
			identifier: 'id',
			items: []
		};
		gridStore.close();
		grid.setStore(gridStore);

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
		var def = new dojo.Deferred();
		var hist = this.history;
		var id = null;
		if (direction == 'back' && hist.curIdx > 0) {
			id = hist.steps[--hist.curIdx];
		}
		else if (direction == 'forward' && hist.curIdx < hist.steps.length) {
			id = hist.steps[++hist.curIdx];
		}
		if (id != null) {
			return dojo.when(this.storeCache.get(id), dojo.hitch(this, function(item) {
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
		return dojo.date.locale.format(new Date(), {
            datePattern: 'dd.MM.yyyy',
            timePattern: 'HH:mm'
        });
	},

	/**
	 * Returns the selected item.
	 * Returns the item that is currently selected in the grid or tree. Grid takes precedence over tree.
	 * @return {object|null} dojo.store object
	 */
	getSelectedItem: function() {
		var item = null, id;
		var grid = this.grid, tree = this.tree;
		var idx = grid.selection.selectedIndex;
		if (idx > -1) {
			item = grid.getItem(idx);
			id = grid.store.getValue(item, 'id');
			item = this.storeCache.storeMemory.get(id);   // dojo.data.item has different structure than dojo.store.item
		}
		else if (tree.get('selectedItem')) {
			item = tree.get('selectedItem');
		}
		return item;
	}
});