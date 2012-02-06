/**
 * This stores caching algorithm has one flaw: If item doesn't have children it is not cached, since the cache checks for
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

	return declare(null, {
		// references for MonkeyPatching the store.Cache
		refPut: null,
		refDel: null,
		refNew: null,
		storeMaster: null,
		storeMemory: null,
		childrenAttr: 'dir',
		parentAttr: 'parId',
		labelAttr: 'name',
		rootId: 'root',	// for tree
		rootLabel: 'web root',		// for tree
		skipWithNoChildren: true, // getChildren returns only folders

		/**
		 * Constructs the caching file store.
		 * @constructor
		 */
		constructor: function() {

			var storeMaster = this.storeMaster = Observable(new JsonRest({target: '/library/rfe/controller.php/'}));
			var storeMemory = this.storeMemory = new Memory({
				// Memory store does not add id to object when creating an object
				// See bugs http://bugs.dojotoolkit.org/ticket/12835 and http://bugs.dojotoolkit.org/ticket/14281
				// Will be fixed with dojo 1.8
				put: function(object, options) {
					var data = this.data, index = this.index, idProperty = this.idProperty;
					var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
					if (id in index) {
						if (options && options.overwrite === false) {
							throw new Error("Object already exists");
						}
						data[index[id]] = object;
					}
					else {
						index[id] = data.push(object) - 1;
					}
					return id;
				}
			});
			var storeCache = new Cache(storeMaster, storeMemory);

			// Fix for cache not working with jsonrest
			// See http://bugs.dojotoolkit.org/ticket/14704
			// Will be fixed with dojo 1.8
			storeCache.add = function(object, directives){
				return Deferred.when(storeMaster.add(object, directives), function(result){
					// now put result in cache
					storeCache.add(typeof result == "object" ? result : object, directives);
					return result; // the result from the add should be dictated by the masterStore and be unaffected by the cachingStore
				});
			};
			storeCache.put = function(object, directives){
				// first remove from the cache, so it is empty until we get a response from the master store
				storeMemory.remove((directives && directives.id) || this.getIdentity(object));
				return Deferred.when(storeMaster.put(object, directives), function(result){
					// now put result in cache
					storeMemory.put(typeof result == "object" ? result : object, directives);
					return result; // the result from the put should be dictated by the masterStore and be unaffected by the cachingStore
				});
			};


			this.refPut = storeCache.put;
//			this.refDel = storeCache.remove;
//			this.refNew = storeCache.add;
			storeCache.put = this.put;
//			storeCache.remove = this.remove;
//			storeCache.add = this.add;

			lang.mixin(this, storeCache);
		},

		put: function(object, options) {
			this.onChildrenChange(object, this.getChildren(object));
			this.onChange(object);	// notifies the tree (e.g. renamed an item)
			return JsonRest.prototype.put.apply(this, arguments);
		},

		/*
		add: function(item) {
			var self = this;
			return Deferred.when(this.refNew.apply(this, arguments), function(newId) {
				item.id = newId
				self.onNewItem(item);	// tree only
				self.onNew(item);		// dojo.data.api
				return newId;
			}, function() {
				self.revert();
			});
		},

		remove: function(id) {
			var self = this;
			var item = this.get(id);
			return Deferred.when(this.refDel.apply(this, arguments), function() {
				self.onDelete(item);	// notifies tree and the grid
			}, function() {
				self.revert();
			});
		},
          */



		/**
		 * Find all ids of and item's parents and return them as an array.
		 * Includes the item's own id in the path.
		 * @param {object} item StoreFileCache item
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

		/**
		 * Get children of an object.
		 * @param {dojo.store.object} object
		 * @param {Function} onComplete
		 * @return {dojo.Deferred}
		 */
		getChildren: function(object, onComplete, onError) {
			var self = this, query;
			var childItems, children;
			var obj = {};
			var id = object[this.idProperty];
			var dfd = new Deferred();

			obj[this.parentAttr] = id;
			children = this.storeMemory.query(obj);

			// Children are available e.g. already cached in storeMemory
			if (children.length > 0) {
				if (self.skipWithNoChildren) {
					childItems = children.filter(function(child) {
						if (child[self.childrenAttr]) {  // only display directories in the tree
							return true;
						}
					});
				}
				else {
					childItems = children;
				}
				if (onComplete) {
					onComplete(childItems);
				}
				dfd.resolve(childItems);
			}
			// Items not cached yet, add them to the storeCache
			else {
				query = self.storeMaster.query(id + '/');
				// TODO: enable as soon as bug http://bugs.dojotoolkit.org/ticket/12835 is fixed
				//query.observe(lang.hitch(this, self.observeChildren));
				dfd = Deferred.when(query, function(children) {
					var i = 0, len = children.length;
					for (; i < len; i++) {
						self.storeMemory.put(children[i]);
					}
					if (self.skipWithNoChildren) {
						childItems = array.filter(children, function(child) {
							if (child[self.childrenAttr]) {  // only display directories in the tree
								return true;
							}
						});
					}
					else {
						childItems = children;
					}
					if (onComplete) {
						onComplete(childItems);
					}

					return childItems;

				}, function(error) {
					console.error(error);
					onComplete([]);
				})
			}
			return dfd;
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
		 * @param {object} item
		 */
		onChange: function(object) {},

		mayHaveChildren: function(object) {
			return object[this.childrenAttr];
		},

		getRoot: function(onItem, onError) {
			this.get(this.rootId).then(onItem, onError);
		},

		getLabel: function(object) {
			return object[this.labelAttr];
		}



	});
});