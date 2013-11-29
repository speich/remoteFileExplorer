/**
 * Note: This stores caching algorithm has one flaw: If item doesn't have children it is not cached, since the cache checks for
 * the items children in the cache.
 * @module rfe/store/FileStore
 */
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/when',
	'dojo/Deferred',
	'dojo/_base/array',
	'dojo/store/Memory',
	'dojo/store/JsonRest',
	'dojo/store/Observable',
	'dojo/store/Cache',
	'dijit/tree/ObjectStoreModel'
], function(declare, lang, when, Deferred, array, Memory, JsonRest, Observable, Cache, ObjectStoreModel) {

	// references for MonkeyPatching the store.Cache
	var refPut, refDel, refAdd;

	/**
	 * Class which creates a store to work with remote files over REST and local caching.
	 * @alias module:rfe/store/FileStore
	 * @property {dojo/store/JsonRest} storeMaster
	 * @property {Memory} storeMemory
	 * @property {string} childrenAttr
	 * @property {string} parentAttr
	 * @property {string} rootId
	 * @property {string} rootLabel
	 * @property {boolean} skipWithNoChildren getChildren returns only folders
	 * @extends {Cache}
	 */
	return declare([ObjectStoreModel], {
		storeMaster: null,
		storeMemory: null,
		childrenAttr: 'dir',
		parentAttr: 'parId',
		labelAttr: 'name',
		rootId: '/demo',
		rootLabel: 'demo',
		skipWithNoChildren: true,

		/**
		 * Constructs the caching file store.
		 * @constructor
		 */
		constructor: function() {
			var storeMaster, storeMemory, storeCache;

			storeMaster = new JsonRest({
				target: require.toUrl('rfe-php') + '/services/filesystem.php'
			});
			this.storeMaster = lang.delegate(storeMaster, {
				getPath: lang.hitch(this, this._getPath)
			});

			storeMemory = new Observable(new Memory({
				parentAttr: this.parentAttr,
				childrenAttr: this.childrenAttr,
				labelAttr: this.labelAttr
			}));
			this.storeMemory = lang.delegate(storeMemory, {
				getPath: lang.hitch(this, this._getPathFromCache)
			});

			storeCache = new Cache(storeMaster, storeMemory);
			refPut = storeCache.put;
			refDel = storeCache.remove;
			refAdd = storeCache.add;
			storeCache.put = this.put;
			storeCache.remove = this.remove;
			storeCache.add = this.add;
			lang.mixin(this, storeCache);

			this.childrenCache = {};	// Deferred map from id to boolean is cached
		},

		/**
		 * Extend put to comply to dojo.data.api, e.g. notify tree
		 * @param {object} object
		 * @param {object} options
		 */
		put: function(object, options) {
			var self = this, oldParentId;

			oldParentId = object[this.parentAttr];
			if (options && options.parent) {
				object[this.parentAttr] = options.parent[this.idProperty];
			}
			return refPut.apply(this, arguments).then(function(id) {
				self.onChange(object);
				return id;
			}, function() {
				// when request fails change id back
				object[self.parentAttr] = oldParentId;
			});
		},

		add: function(object, options) {
			var self = this;
			return refAdd.apply(this, arguments).then(function(newId) {
				object.id = newId;
				self.onNewItem(object);	// notifies tree
				return newId;
			});
		},

		remove: function(id) {
			var self = this, object = this.get(id);
			return refDel.apply(this, arguments).then(function() {
				self.onDelete(object);	// notifies tree
			});
		},

		/**
		 * Iterates over the objects in the cache to find first
		 * .r, it stops and returns true as soon as it encounters an item for which the provided callback returns true.
		 * If the callback doesn’t return true for even a single item, dojo.some returns false.
		 */
		queryCacheSome: function(query) {
			var results, callback, data = this.storeMemory.data;

			// create filter callback function
			callback = function(object) {
				for (var key in query) {
					var required = query[key];
					if (required != object[key]) {
						return false;
					}
				}
				return true;
			};

			results = array.some(data, callback);
			return results;
		},

		/**
		 * Returns a folders (cached) children.
		 * If children were loaded previously, this returns the cached result otherwise the master store is queried first
		 * and then the result is cached.
		 * @param {object} object store object
		 * @param [onComplete]
		 * @return {dojo/Deferred}
		 */
		getChildren: function(object, onComplete) {
			var self = this, alreadyCached,
				queryObj = {},
				id = object[this.idProperty],
				results, resultsDirOnly, children;

			// check if children are already cached
			if (this.childrenCache[id]) {
				queryObj[this.parentAttr] = id;
				results = this.storeMemory.query(queryObj);
				alreadyCached = true;
			}
			// children not cached yet, query master store and add result to cache
			else {
				results = self.storeMaster.query(id + '/');	// query has to be a string, otherwise jsonrest will add a querystring instead of REST resource
				alreadyCached = false;
			}

			return when(results, lang.hitch(this, function(results) {
				var options = {
					overwrite: true
				};
				// only display directories in the tree ? / add children to cache
				resultsDirOnly = results.filter(function(child) {
					if (!alreadyCached) {
						// some items might already be cached from a previous drag n drop (though folder itself is not)
						// Just overwrite (is this the right place to to this?)
						self.storeMemory.put(child, options);	// saves looping twice, but should logically be in own foreEach
					}
					return child[self.childrenAttr];
				});
				children = this.skipWithNoChildren ? resultsDirOnly : results;

				// notify tree by calling onComplete
				if (lang.isFunction(onComplete)) {
					when(children, function(result) {
						onComplete(result);
					});
				}
				this.childrenCache[id] = children;
				return children;
			}));
		},

		/**
		 * Move or copy an store object from one folder (parent object) to another.
		 * Used in drag & drop by the tree and the grid.
		 * @param {object} object object being pasted
		 * @param {object} oldParentObject old parent object where the object was dragged from
		 * @param {object} newParentObject new parent of the object, where the child was dragged to
		 * @param {boolean} copy copy or move object
		 * @return {dojo.Deferred}
		 */
		pasteItem: function(object, oldParentObject, newParentObject, copy) {
			var dfd, self = this, options, newObject;

			// copy object
			if (copy) {
				// create new object based on child and use same id -> when server sees POST with id this means copy (implicitly)
				newObject = lang.clone(object);
				newObject[this.parentAttr] = newParentObject.id;
				dfd = this.add(newObject, {
					incremental: true,	// lets jsonrest do a POST even if an id is present
					parent: newParentObject
				});
			}
			// move object
			else {
				// If target folder was cached previously, we have to update the dropped object in the cache, e.g. its parent attribute
				// Otherwise we just put it to the server (master store), which updates the cache automatically.
				// Set object's parent attribute to new parent id
				options = {
					overwrite: true,
					parent: newParentObject
				};

				dfd = this.put(object, options).then(function() {	// note: put does not return the object, but only it's id
					// Opening (loading with getChildren) an uncached folder after having dropping objects onto it will
					// add all content from that folder to the cache, but this will lead to an error of some objects already
					// existing in cache (the dropped ones) -> remove from cache, they will be added back when loading folder.

					// Notify tree to update old parent (its children)
					// Note: load children after put has completed, because put might modify the cache
					return when(self.getChildren(oldParentObject), function(children) {
						self.onChildrenChange(oldParentObject, children);
					});
				});
			}

			// notify tree to update new parent (its children), will issue GET request with new parentId
			dfd = dfd.then(function() {
				return when(self.getChildren(newParentObject), function(children) {
					self.onChildrenChange(newParentObject, children);
				});
			});

			return dfd;
		},


		/**
		 * Find all id parent id of an item in the cache and return them as an array.
		 * Assumes that if an item is loaded all it's parent items must be loaded to.
		 * Includes the item's own id in the path.
		 * @param {object} object
		 * @private
		 * @return {Array}
		 */
		_getPathFromCache: function(object) {
			// TODO: add this to subclassed memory store instead?
			var store = this.storeMemory, arr = [];

			while (object[this.parentAttr]) {
				// Convert ids to string, since tree.set(path) expects strings
				arr.unshift(String(object[this.idProperty]));
				object = store.get(object[this.parentAttr]);
			}
			arr.unshift(String(object[this.idProperty]));

			return arr;
		},

		/**
		 * Recursively load all parent objects and return their paths.
		 * @param object
		 * @returns {dojo/promise}
		 * @private
		 */
		_getPath: function(object) {
			var self = this,
				arr = [],
				dfd = new Deferred();

			function loadParent(object) {
				if (object[self.parentAttr]) {
					arr.unshift(String(object[self.idProperty]));
					return when(self.get(object[self.parentAttr]), function(object) {
						return loadParent(object);
					});
				}
				else {
					arr.unshift(self.rootId);
					return dfd.resolve(arr);
				}
			}

			return loadParent(object);
		},



		// METHODS BELOW ARE NEEDED BY THE TREE MODEL

		/**
		 * Callback to do notifications about new, updated, or deleted items.
		 * @param {object} parent item
		 * @param {array} children
		 */
		onChildrenChange: function(parent, children) {},

		/**
		 * Callback whenever an item has changed, so that Tree can update the label, icon, etc.
		 * Note that changes to an item's children or parent(s) will trigger an onChildrenChange()
		 * so you can ignore those changes here.
		 * @param {object} object
		 */
		onChange: function(object) {},

		/**
		 * Indicate whether or not an object may have children prior to actually loading the children.
		 * The presence of the property defined in this.childrenAttr (=dir) means having children.
		 * @param {object} object
		 */
		mayHaveChildren: function(object) {
			return object[this.childrenAttr];
		},

		/**
		 * Retrieves the root node.
		 * @param onItem
		 * @param onError
		 */
		getRoot: function(onItem, onError) {
			this.get(this.rootId).then(onItem, onError);
		},

		/**
		 * Returns the label for the object.
		 * @param {object} object
		 */
		getLabel: function(object) {
			return object[this.labelAttr];
		},

		/**
		 *	Handler for when new items appear in the store, either from a drop operation or some other way.
		 *	Updates the tree view (if necessary).
		 *	If the new item is a child of an existing item, calls onChildrenChange()
		 *	with the new list of children for that existing item.
		 * @param {object} object
		 */
		onNewItem: function(object) {
			var parent = this.storeMemory.get(object.parId);
			// since we know, that objects with this parItem are already cached (except the new one), we just query the memoryStore and add it
			when(this.getChildren(parent), lang.hitch(this, function(children) {
				this.onChildrenChange(parent, children);
			}));
		}

	});
});