define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/Deferred',
	'rfe/dialogs/dialogs'
], function(lang, array, declare, Deferred, dialogs) {

	/**
	 * Provides functionality to edit files and folders.
	 * @module Edit rfe/Edit
	 */
	return declare(null, {
		// Note: An item might be selected, but not ma

		/** @property {object} stores objects for copy-paste */
		objects: {},

		/**
		 * Delete selected file or folder object(s).
		 */
		del: function() {
			// Note: delete is a reserved word -> del
            // TODO: return deferred list of all deleted items
			// Notes:
			// A. When deleting from toolbar, we only use selected items from the grid (or use focus?). Currently this
			// happens from the different menu in layout.js -> move here?
			// B. When deleting from context menu, use context to decide which selected items to use
			var self = this, store = this.store,
				selection, id, doNotAskAgain = true, dfd = new Deferred();

			function remove(id) {
				// note: remove creates closure for id in loop
				var obj = store.storeMemory.get(id),
					dialog = dialogs.getByFileObj('deleteFile', obj);

				dfd.resolve(doNotAskAgain).then(function(remember) {
					if (remember === false) {
						return dialog.show();
					}
					else {
						return true;
					}
				}).then(function(remember) {
					doNotAskAgain = remember;
					return store.remove(id);
				}).then(function() {
					self.removeHistory(id);
					// point address bar (history) to parent folder of deleted
					window.history.pushState('', '', self.origPageUrl + obj.parId + window.location.search);
					if (self.context.isOnTree) {
						obj = self.store.storeMemory.get(obj.parId);
						self.display(obj);
					}
				}, error);
			}

			function error() {
				return function(err) {
					console.log(err);
				};
			}

			// create one dialog for all selected nodes per call of this method and only update its content
			selection = this.context.isOnGrid ? this.grid.selection : this.tree.selectedItems;
			for (id in selection) {
				remove(id);
			}
		},

		/**
		 * Creates a new file or folder object.
		 * @param {object} object
		 * @return {object} dojo.store object
		 */
		create: function(object) {
			var store = this.store,
				parId = this.currentTreeObject.get('id');

			object = lang.mixin(object || {}, {
				parId: parId,
				size: 0
			});
			object.name = object.dir ? 'new directory' : object.name = 'new text file.txt';
			return store.add(object);
		},

		/**
		 * Create and rename an file or folder object
		 * Creates a new item, selects it in the grid and switches to edit mode.
		 * @param {object} object file/folder object
		 */
		createRename: function(object) {
			var context = this.context,
				widget = context.isOnGrid ? this.grid : this.tree,
				store = this.store;

			return this.create(object).then(lang.hitch(this, function(object) {
				var element, column;

				if (context.isOnGrid) {
					column = widget.columns[store.labelAttr];
					element = widget.get('editableElement', object.id, column.field);
					widget.edit(element);
				}
			}));
		},

		/**
		 * Create a new file or folder object.
		 */
		rename: function() {
			// TODO: make this work also for the tree which doesn't have the same selection object. Use dijit.inlineEditBox
			// tree's selection is widget.selectedItems which is array of store objects
			var widget = this.context.isOnGrid ? this.grid : this.tree,
				store = this.store,
				column = widget.columns[store.labelAttr],
				element,
				id, selection = widget.selectedItems || widget.selection;

			for (id in selection) {
				element = widget.get('editableElement', id, column.field);
				widget.edit(element);
			}
		},

		copy: function() {
			var id, selection,
				store = this.store,
				objects = this.objects = {};

			selection = this.context.isOnGrid ? this.grid.selection : this.tree.selectedItems;
			for (id in selection) {
				objects[id] = store.storeMemory.get(id);	// todo: store only store ids or whole objects (speed vs memory)?
			}
		},

		cut: function() {

		},

		paste: function() {
			var id, selection,
				store = this.store,
				objects = this.objects,
				storeMemory = store.storeMemory,
				widget, newParentObject, oldParentObject;

			// Note: all nodes in grid share same parent and you can only select one node in tree

			// selection/focus in grid takes precedence over tree
			widget = this.context.isOnGrid ? this.grid : this.tree;

			// get new parent object
			selection = widget.selectedItems || widget.selection;
			for (id in selection) {
				if (selection[id] === true) {
					newParentObject = storeMemory.get(id);
					break;
				}
			}
			if (widget === this.grid) {
				// target object type does not matter we just paste to to current grid folder
				newParentObject = storeMemory.get(newParentObject.parId);
			}

			for (id in objects) {
				if (objects[id]) {
					oldParentObject = oldParentObject || storeMemory.get(objects[id].parId);
					store.pasteItem(objects[id], oldParentObject, newParentObject, true);
				}
			}
		}

	})
});