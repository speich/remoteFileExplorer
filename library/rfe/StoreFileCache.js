define('rfe/StoreFileCache', [
	'dojo',
	'dojo/store/Observable',
	'dojo/store/Cache'], function(dojo) {

	dojo.declare('rfe.StoreFileCache', null, {
		storeMaster: null,
		storeMemory: null,
		childrenAttr: 'dir',
		parentAttr: 'parId',
		labelAttr: 'name',
		rootId: 'root',
		skipWithNoChildren: true, // getChildren returns only folders

		/**
		 * Constructs the caching file store.
		 * @constructor
		 * @param {dojo.store.JsonRest} storeMaster
		 * @param {dojo.store.Memory} storeMemory
		 * @param {object} options
		 */
		constructor: function(storeMaster, storeMemory, options) {
			var storeCache;
			this.storeMaster = storeMaster;
			this.storeMemory = storeMemory;
			storeCache = new dojo.store.Cache(this.storeMaster, this.storeMemory);

			dojo.safeMixin(this, storeCache);
			dojo.safeMixin(this, options);
		},

		getRoot: function(onItem) {
			dojo.when(this.get(this.rootId), function(item) {
				this.root = item;
				onItem(this.root);
			});
		},

		getLabel: function(item) {
			return item[this.labelAttr];
		},

		mayHaveChildren: function(item) {
			return item[this.childrenAttr];
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
			var dfd = new dojo.Deferred();

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
				//query.observe(dojo.hitch(this, self.observeChildren));
				dfd = dojo.when(query, function(children) {
					for (var i = 0, len = children.length; i < len; i++) {
						self.storeMemory.put(children[i]);
					}
					if (self.skipWithNoChildren) {
						childItems = dojo.filter(children, function(child) {
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
		 * Observes the store for changes and updates the tree accordingly.
		 * @param item
		 * @param removedFrom
		 * @param insertedInto
		 */
		observeChildren: function(item, removedFrom, insertedInto) {
			// TODO: enable this as soon as bug http://bugs.dojotoolkit.org/ticket/12835 is fixed
			// -> remove the methods below from Edit.js and enable it in getChildren
			// add
			if (removedFrom == -1 && insertedInto > -1) {
				console.log('add', item);
				this.onNewItem(item); // creates new item in tree
			}
			// put
			else if (removedFrom > -1 && insertedInto > -1) {
				console.log('put', item);
				this.onChange(item); // Updates the tree
			}
			// remove
			else if (removedFrom > -1 && insertedInto == -1) {
				console.log('remove', item);
				this.onDelete(item); // Removes item from tree
			}
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


		/*
		 * Methods below are required by Tree or TreeStoreModel to monitor changes in items.
		 * Tree connects to these model's methods:
		 * onChange()
		 * onChildrenChange()
		 * onDelete()
		 *
		 * The Model calls the above methods in:
		 * onChange:         onSetItem()                => put()
		 * onChildrenChange: onSetItem() / onNewItem()  => add()
		 * onDelete:         onDeleteItem()             => remove()
		 */

		/**
		 * Callback whenever an item has changed, so that Tree can update the label, icon, etc.
		 * Note that changes to an item's children or parent(s) will trigger an onChildrenChange()
		 * so you can ignore those changes here.
		 * @param {object} item
		 */
		onChange: function(item) {
		},

		/**
		 * Callback to do notifications about new, updated, or deleted items.
		 * @param {object} parent item
		 * @param {array} newChildrenList
		 */
		onChildrenChange: function(item, children) {
		},

		/**
		 * Callback when an item has been deleted.
		 * Note that there will also be an onChildrenChange() callback for the parent	of this item.
		 * @param {object} parent parent item
		 */
		onDelete: function(parent) {
			// tree connects _onItemDelete to this
		},

		/**
		 * Used by dijit.tree.dndSource.onDndDrop to check if the dropped node's (dojo.dnd.item) is from the same model/store
		 * isItem is part of the dojo.data.api
		 * @param item
		 */
		isItem: function(item) {
			return (typeof item == 'object') && item[this.idProperty] && item[this.childrenAttr] && item[this.parentAttr] && item[this.labelAttr];
		},

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
			dojo.when(this.getChildren(parItem), dojo.hitch(this, function(children) {
				this.onChildrenChange(parItem, children);
			}));
		},

		/**
		 * Creates a new item when item from external source dropped onto tree.
		 * @param item
		 * @param parent
		 * @param insertIndex
		 */
		newItem: function(item, newParent, insertIndex) {
			// TODO: Currently this is also wrongly called when dragging from grid onto tree since there is a bug in dijit.tree.dndSource.onDndDrop
			// because if item is from save store it should only be pasteItem and not newItem
			/*var pInfo = {
				parent: newParent,
				attribute: this.childrenAttr
			}*/
			//var newItem;

			if (item.id) { // in case of drag n drop item already has an id
				// Maybe there's already a corresponding item in the store; if so, reuse it.
				var oldParent = this.storeMemory.get(item.parId);
         	this.pasteItem(item, oldParent, newParent, false);
				// TODO: remove from grid, but how?
				// TODO: fix tree.dndSource instead, since we would also have to fix copy
			}
			else {
				// [as far as we know] there is no id so we must assume this is a new item
				/*newItem = this.store.newItem(args, pInfo);
				if (newItem && (insertIndex != undefined)) {
					// Move new item to desired position
					this.pasteItem(newItem, parent, parent, false, insertIndex);
				}*/
				this.add(item);
			}
		},

		/**
		 * Move or copy an item from one parent to another parent.
		 * Used in drag & drop within tree, from tree to grid or from grid to tree.
		 * @param {object} item dojo.store object
		 * @param {object} oldParentItem dojo.store object
		 * @param {object} newParentItem dojo.store object
		 * @param {boolean} copy copy or move item
		 * @param {target} target of dnd
		 */
		pasteItem: function(item, oldParentItem, newParentItem, copy) {
			var dfd, self = this;
			var newItem;

			// copy item
			if (copy) {
				// create new item based on item and use same id -> when server sees POST with id this means copy (implicitly)
				newItem = dojo.clone(item);
				newItem[this.parentAttr] = newParentItem.id;
				dfd = this.add(newItem, {
					incremental: true	// store JsonRest does POST instead of PUT even if object has an id
				});
			}
			// move item
			else {
				// Update item's parent attribute to point to new parent
				item[this.parentAttr] = newParentItem.id;
				dfd = this.put(item);

				// update old parent in tree
				dojo.when(dfd, function() {
					dojo.when(self.getChildren(oldParentItem), function(children) {
						self.onChildrenChange(oldParentItem, children);
					});
				})
			}

			// update new parent in tree
			dojo.when(dfd, function() {
				dojo.when(self.getChildren(newParentItem), function(children) {
					self.onChildrenChange(newParentItem, children);
				});
			})

			// grid (currently) uses its own ItemReadStore (because it doesn't support the new stores yet)
			// -> remove it there and not here

			return dfd;
		}

	});

	return rfe.StoreFileCache;
});