/**
 * @module rfe/store/FileStore
 * Note: This stores caching algorithm has one flaw: If item doesn't have children it is not cached, since the cache checks for
 * the items children in the cache.
 */
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/_base/array',
	'dojo/store/Memory',
	'dojo/store/JsonRest',
	'dojo/store/Observable',
	'dojo/store/Cache'
], function(declare, lang, Deferred, array, Memory, JsonRest, Observable, Cache) {

	// references for MonkeyPatching the store.Cache
	var refPut, refDel, refAdd;

	/**
	 * Class which creates a store to work with remote files over REST and local caching.
	 * @class
	 * @name rfe.store.FileStore
	 * @property {dojo.store.JsonRest} storeMaster
	 * @property {dojo.store.Memory} storeMemory
	 * @property {string} childrenAttr
	 * @property {string} parentAttr
	 * @property {string} rootId
	 * @property {string} rootLabel
	 * @property {boolean} skipWithNoChildren getChildren returns only folders
	 * @extends {dojo.store.Cache}
	 */
	return declare(null, /** @lends rfe.store.FileStore.prototype */ {
		storeMaster: null,
		storeMemory: null,
		childrenAttr: 'dir',
		parentAttr: 'parId',
		labelAttr: 'name',
		rootId: 'root',
		rootLabel: 'web root',
		skipWithNoChildren: true,

		/**
		 * Constructs the caching file store.
		 * @constructor
		 */
		constructor: function() {
			var storeMaster, storeMemory, storeCache;

			storeMaster = new JsonRest({
				target: '/library/rfe/controller.php/'
			});
			this.storeMaster = storeMaster;

			storeMemory = new Observable(new Memory({
				parentAttr: this.parentAttr,
				childrenAttr: this.childrenAttr,
				labelAttr: this.labelAttr
			}));
			this.storeMemory = storeMemory;

			storeCache = new Cache(storeMaster, storeMemory);
			refPut = storeCache.put;
			refDel = storeCache.remove;
			refAdd = storeCache.add;
			storeCache.put = this.put;
			storeCache.remove = this.remove;
			storeCache.add = this.add;
			lang.mixin(this, storeCache);

			this.childrenCached = {};	// Deferred map from id to boolean is cached
		},

		/**
		 * Extend put to comply to dojo.data.api, e.g. notify tree
		 * @param {object} object
		 * @param {object} options
		 */
		put: function(object, options) {
			var self = this;
			return Deferred.when(refPut.apply(this, arguments), function(id) {
				self.onChange(object);
				return id;
			}, function(err) {
				console.log('error', err);
			});
		},

		add: function(object, options) {
			var self = this;
			return Deferred.when(refAdd.apply(this, arguments), function(newId) {
				object.id = newId;
				self.onNewItem(object);	// notifies tree
				return newId;
			}, function(err) {
				console.log('error', err);
			});
		},

		remove: function(id) {
			var self = this, object = this.get(id);
			return Deferred.when(refDel.apply(this, arguments), function() {
				self.onDelete(object);	// notifies tree
			}, function(err) {
				console.log('error', err);
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
		 * If children were previously load returns the cached result otherwise master store is
		 * queried and cached.
		 * @param object
		 * @param options
		 * @return {dojo/Deferred}
		 */
		getChildren: function(object, options) {
			var self = this, cached, queryObj = {},
				id = object[this.idProperty],
				results, resultsDirOnly, children;

			// check if children are already cached
			if (this.childrenCached[id]) {
				queryObj[this.parentAttr] = id;
				results = this.storeMemory.query(queryObj);
				cached = true;
			}
			// children not cached yet, query master store and add them to cache
			else {
				results = self.storeMaster.query(id + '/');	// query has to be a string, otherwise will add querystring instead of REST resource
				cached = false;
			}

			resultsDirOnly = results.filter(function(child) {
				if (!cached) {
					self.storeMemory.add(child);	// saves looping twice, but should logically be in own foreEach
				}
				return child[self.childrenAttr];	// only display directories in the tree
			});
			children = this.skipWithNoChildren ? resultsDirOnly : results;

			// notify tree by calling onComplete
			if (lang.isFunction(options)) {
				Deferred.when(children, function(result) {
					options(result);
				});
			}
			this.childrenCached[id] = children;
			return children;
		},


		/**
		 * Move or copy an store object from one folder (parent object) to another.
		 * Used in drag & drop by the tree and the grid.
		 * @param {object} object object being pasted
		 * @param {object} oldParentObject old parent object where the object was dragged from
		 * @param {object} newParentObject new parent of the object, where the child was dragged to
		 * @param {boolean} copy copy or move object
		 * @return {dojo/Deferred}
		 */
		pasteItem: function(object, oldParentObject, newParentObject, copy) {
			var cachedChildren, dfd, self = this, newObject,
				oldParentId, newParentId;

			oldParentId = object[this.parentAttr];
			newParentId = newParentObject.id;

			// copy object
			if (copy) {
				// create new object based on child and use same id -> when server sees POST with id this means copy (implicitly)
				// TODO: if object is a folder then recursively copy all its children
				newObject = lang.clone(object);
				newObject[this.parentAttr] = newParentId;
				dfd = this.add(newObject, {
					incremental: true   // otherwise store JsonRest does POST instead of PUT even if object has an id
					// TODO: use  overwrite: true instead of incremental?
				});
				dfd = Deferred.when(dfd, function(newId) {
					newObject.id = newId;
					return newId;
				});
			}
			// move object
			else {
				// target folder might be cached (was visible at least once) then add to cache
				// otherwise (its not visible) and we just put it to the server (master store)

				// put updates the cache and consequently getChildren() will return the cached items
				// and not query the masterStore anymore. If the new parent's children have not been cached previously,
				// only the moved object(s) will be returned from cache and the potential children will not be loaded
				// from the masterStore -> check if cached previously and if not, remove putted objects from cache

				// Set object's parent attribute to new parent id
				object[this.parentAttr] = newParentId;

				dfd = Deferred.when(this.storeMaster.put(object), function() {

					// only add to cache if folder was cached previously
					if (self.childrenCached[newParentId]) {
						self.storeMemory.put(object);
					}

					// Notify tree to update old parent (its children)
					// Note: load children after put has completed, because put might modify the cache
					return Deferred.when(self.getChildren(oldParentObject), function(children) {
						self.onChildrenChange(oldParentObject, children);
					});
				}, function() {
					object[self.parentAttr] = oldParentId;
				});
			}

			// notify tree to update new parent (its children)
			dfd = Deferred.when(dfd, function() {
				return Deferred.when(self.getChildren(newParentObject), function(children) {
					self.onChildrenChange(newParentObject, children);
				});
			});

			return dfd;
		},


		/**
		 * Find all ids of and item's parents and return them as an array.
		 * Includes the item's own id in the path.
		 * @param {object} object
		 * @return {Array}
		 */
		getPath: function(object) {
			var store = this.storeMemory, arr = [];
			while (object[this.parentAttr]) {
				// Convert ids to string, since tree.set(path) expects strings
				arr.unshift(String(object[this.idProperty]));
				object = store.get(object[this.parentAttr]);
			}
			arr.unshift(String(object[this.idProperty]));
			return arr;
		},



		// METHODS BELOW ARE NEEDED BY THE TREE MODEL


		/**
		 * Callback to do notifications about new, updated, or deleted items.
		 * @param {object} parent item
		 * @param {array} newChildrenList
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
			Deferred.when(this.getChildren(parent), lang.hitch(this, function(children) {
				this.onChildrenChange(parent, children);
			}));
		}

	});
});