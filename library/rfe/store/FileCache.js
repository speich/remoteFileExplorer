/**
 * This stores caching algorithm has one flaw: If item doesn't have children it is not cached, since the cache checks for
 * the items children in the cache.
 */
define([
	'dojo/regexp',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/_base/array',
	'dojo/store/Memory',
	'dojo/store/JsonRest',
	'dojo/store/Observable',
	'dojo/store/Cache'
], function(regexp, declare, lang, Deferred, array, Memory, JsonRest, Observable, Cache) {

	return declare('rfe.Store.FileCache', null, {
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
			var storeMaster, storeMemory, storeCache;
			storeMaster = new JsonRest({target: '/library/rfe/controller.php/'});
			storeMemory = new Memory({
				// Observable only works correctly when object has an id. Memory store does not add id to object when creating an object
				// see bugs http://bugs.dojotoolkit.org/ticket/12835 and http://bugs.dojotoolkit.org/ticket/14281
				// Will be fixed with dojo 1.8
				// Also Observable does not work correctly with JsonRest. Therefore we use the grid with the Memory Store and the Observable
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

			this.storeMaster = storeMaster;
			this.storeMemory = Observable(storeMemory);
			storeCache = new Cache(this.storeMaster, this.storeMemory);
			this.refPut = storeCache.put;
			this.refDel = storeCache.remove;
			this.refNew = storeCache.add;
			storeCache.put = this.put;
			storeCache.remove = this.remove;
			storeCache.add = this.add;
			lang.mixin(this, storeCache);    // TODO: necessary?
		},

		put: function(item) {
			var self = this;
			return Deferred.when(this.refPut.apply(this, arguments), function(id) {
				self.onChange(item);	// notifies the tree (e.g. renamed an item)
				// TODO: find out if this is necessary
				self.onChildrenChange(item, self.getChildren(item));	// do we need this?
//				console.log('StoreFileCache.onSet()', item);
				self.onSet(item);
				return id;
			}, function() {
				self.revert();
			});
		},

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

		/**
		 * Get children of an item.
		 * @param {dojo.store.item} item
		 * @param {Function} onComplete
		 * @return {dojo.Deferred}
		 */
		getChildren: function(item, onComplete, onError) {
			var self = this, query;
			var childItems, children;
			var obj = {};
			var id = item[this.idProperty];
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
					for (var i = 0, len = children.length; i < len; i++) {
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
				})
			}
			return dfd;
		},

		/**
		 * Find all ids of and item's parents and return them as an array.
		 * Includes the item's own id in the path.
		 * @param {object} item StoreFileCache item
		 * @return {Array}
		 */
		getPath: function(item) {
			var store = this.storeMemory;
			var arr = [];
			while (item[this.parentAttr]) {
				// Convert ids to string, since tree.set(path) expects strings
				arr.unshift(String(item[this.idProperty]));
				item = store.get(item[this.parentAttr]);
			}
			arr.unshift(String(item[this.idProperty]));
			return arr;
		},


		paste: function(copy) {},

		/**
		 * Move or copy an item from one parent item to another.
		 * Used in drag & drop by the tree and the grid.
		 * @param {object} item dojo.store object
		 * @param {object} oldParentItem dojo.store object
		 * @param {object} newParentItem dojo.store object
		 * @param {boolean} copy copy or move item
		 * @return {dojo/_base/Deferred}
		 */
		pasteItem: function(item, oldParentItem, newParentItem, copy) {
			var dfd;
			var self = this, newItem;

			// copy item
			if (copy) {
				// TODO: test if copy works correctly
				// create new item based on item and use same id -> when server sees POST with id this means copy (implicitly)
                console.log('pasteItem copy', item, oldParentItem, newParentItem, copy)
				// TODO: update date of item, but where? here or in onPasteItem callback?
				newItem = lang.clone(item);
				newItem[this.parentAttr] = newParentItem.id;
				dfd = this.add(newItem, {
					incremental: true	// otherwise store JsonRest does POST instead of PUT even if object has an id
				});
			}
			// move item
			else {
				// TODO: Maybe I need to use the id instead of the items, because this.put calls remove on the cache and then
				// re-indexes the cache. Items get a new index while newParent and oldParent use the old?

				// Update item's parent attribute to new parent
	//			console.log('pasteItem', item)
				item[this.parentAttr] = newParentItem.id;
				dfd = this.put(item);

				// notify grid to remove item. Note: we can't use onDelete since that would also notify tree
				Deferred.when(dfd, function(id) {
					Deferred.when(self.storeMemory.get(id), function(item) {
						self.onPasteItem(item, copy)
					});
				});

				// updates old parent in tree
				Deferred.when(dfd, function() {
					Deferred.when(self.getChildren(oldParentItem), function(children) {
						self.onChildrenChange(oldParentItem, children);
					});
				});
			}

			// update new parent in tree
			Deferred.when(dfd, function(id) {
				Deferred.when(self.getChildren(newParentItem), function(children) {
					self.onChildrenChange(newParentItem, children);
				});
			});

			return dfd;
		},

		onPasteItem: function(item, copy) {},	// callback event for grid

		/************************************
		 * Methods for dojo.data 				*
		 ************************************/

		/**
		 *	Check if object is an item form the store.
		 */
		isItem: function() {
			// also used by the tree on drop
			return true;
		},

		isItemLoaded: function() {
			return true;
		},

		/**
		 *
		 * @param {dojo/store/object} item
		 */
		getLabel: function(item) {
			// used by the tree
			return item[this.labelAttr];
		},

		getValue: function(item, attribute) {
			return attribute in item ? item[attribute] : undefined;
		},

		setValue: function(item, attribute, value) {
			item[attribute] = value;
			this.put(item);
		},

		onNew: function(item) {},

		onSet: function(item) {},

		/**
		 * Callback when an item has been deleted.
		 * Used by the tree and the grid.
		 * @param {object} item parent item
		 */
		onDelete: function(item) {},

		revert: function() {},

		/*********************************************
		 * Methods below are used by the dijit.Tree	*

		 * They are required by Tree or TreeStoreModel to monitor changes in items.
		 * Tree connects to these model's methods:
		 * onChange()
		 * onChildrenChange()
		 * onDelete()
		 *
		 * The Model calls the above methods in:
		 * onChange:         onSetItem()                => put()
		 * onChildrenChange: onSetItem() / onNewItem()  => add()
		 * onDelete:         onDeleteItem()             => remove()
		 *********************************************/

		/**
		 * Callback to do notifications about new, updated, or deleted items.
		 * @param {object} parent item
		 * @param {array} newChildrenList
		 */
		onChildrenChange: function(item, children) {},



		mayHaveChildren: function(item) {
			return item[this.childrenAttr];
		},

		/**
		 * Callback whenever an item has changed, so that Tree can update the label, icon, etc.
		 * Note that changes to an item's children or parent(s) will trigger an onChildrenChange()
		 * so you can ignore those changes here.
		 * @param {object} item
		 */
		onChange: function(item) {},

		/**
		 *	Handler for when new items appear in the store, either from a drop operation or some other way.
		 *	Updates the tree view (if necessary).
		 *	If the new item is a child of an existing item, calls onChildrenChange()
		 *	with the new list of children for that existing item.
		 * @param item
		 */
		onNewItem: function(item) {
			var parItem = this.storeMemory.get(item.parId);
			// since we now, that the items with this parItem are already cached (except the new one), we just query the memoryStore and add it
			Deferred.when(this.getChildren(parItem), lang.hitch(this, function(children) {
				this.onChildrenChange(parItem, children);
			}));
		},



		// NEEDED BY THE TREE
		getRoot: function(onItem) {
			console.log('loading root', onItem)
			Deferred.when(this.get(this.rootId), function(item) {
				this.root = item;
				onItem(this.root);
			});
		}

	});
});