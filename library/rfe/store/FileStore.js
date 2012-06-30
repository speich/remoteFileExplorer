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
	 * @extends {dojo.store.Cache}          	 *
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
			var storeMaster = this.storeMaster = JsonRest({
				target: '/library/rfe/controller.php/'
			});
			var storeMemory = this.storeMemory = Observable(Memory());
			var storeCache = Cache(storeMaster, storeMemory);

			refPut = storeCache.put;
			refDel = storeCache.remove;
			refAdd = storeCache.add;
			storeCache.put = this.put;
			storeCache.remove = this.remove;
			storeCache.add = this.add;

			lang.mixin(this, storeCache);
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
			var self = this;
			var object = this.get(id);
			return Deferred.when(refDel.apply(this, arguments), function() {
				self.onDelete(object);	// notifies tree
			}, function(err) {
				console.log('error', err);
			});
		},


		/**
		 * Find all ids of and item's parents and return them as an array.
		 * Includes the item's own id in the path.
		 * @param {object} object
		 * @return {Array}
		 */
		getPath: function(object) {
			var store = this.storeMemory;
			var arr = [];
			while (object[this.parentAttr]) {
				// Convert ids to string, since tree.set(path) expects strings
				arr.unshift(String(object[this.idProperty]));
				object = store.get(object[this.parentAttr]);
			}
			arr.unshift(String(object[this.idProperty]));
			return arr;
		},



		// METHODS BELOW ARE NEEDED BY THE TREE MODEL

		getChildren: function(object, options) {
			var self = this;
			var obj = {};
			var cached = true;
			var id = object[this.idProperty];
			var results, resultsDirOnly, children;

			obj[this.parentAttr] = id;

			// check if children are available from cache
			results = this.storeMemory.query(obj);	// query has to be an object

			// children not cached yet, query master store and add them to cache
			if (results.length === 0) {
				cached = false;
				results = self.storeMaster.query(id + '/');	// query has to be a string, otherwise will add querystring instead of REST resource
			}

			resultsDirOnly = results.filter(function(child) {
				if (!cached) {
//					console.log('adding', child, 'to cache', self.storeMemory);
					self.storeMemory.add(child);	// saves looping twice, but should be in foreEach
				}
				return child[self.childrenAttr];	// only display directories in the tree
			});
			children = this.skipWithNoChildren ? resultsDirOnly : results;
			if (lang.isFunction(options)) {
				// only used by tree
				Deferred.when(children, function(result) {
					options(result);	// calls onComplete
				})
			}
			return children;
		},

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
		},

		/**
		 * Move or copy an item from one parent item to another.
		 * Used in drag & drop by the tree and the grid.
		 * @param {object} child child object beeing pasted
		 * @param {object} oldParent parent object where the child was dragged from
		 * @param {object} newParent new parent of the child object, where the child was dragged to
		 * @param {boolean} copy copy or move item
		 * @return {dojo/_base/Deferred}
		 */
		pasteItem: function(child, oldParent, newParent, copy) {
			var dfd;
			var self = this, newObject;

			// copy item
			if (copy) {
				// create new object based on child and use same id -> when server sees POST with id this means copy (implicitly)
				// TODO: also recursively copy all children
				newObject = lang.clone(child);
				newObject[this.parentAttr] = newParent.id;
				dfd = Deferred.when(this.add(newObject, {
					incremental: true	// otherwise store JsonRest does POST instead of PUT even if object has an id
				}), function(newId) {
					newObject.id = newId;
					return newId;
				});
			}
			// move item
			else {
				// TODO: Maybe I need to use the id instead of the items, because this.put calls remove on the cache and then
				// re-indexes the cache. Items get a new index while newParent and oldParent use the old?

				// Update object's parent attribute to new parent id
				//			console.log('pasteItem', item)
				child[this.parentAttr] = newParent.id;
				dfd = Deferred.when(this.put(child), function() {
					// Notify tree to update old parent (its children)
					// Note: load children after put has completed, because put modifies the cache
					return Deferred.when(self.getChildren(oldParent), function(children) {
						self.onChildrenChange(oldParent, children);
					});
				});
			}

			// notify tree to update new parent (its children)
			dfd = Deferred.when(dfd, function() {
				return Deferred.when(self.getChildren(newParent), function(children) {
					self.onChildrenChange(newParent, children);
				});
			});

			return dfd;
		}

	});
});