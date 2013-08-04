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

		/**
		 * Delete selected file or folder object(s).
		 */
		del: function() {
			// Note: delete is a reserved word -> del
            // TODO: return deferred list of all deleted items
			// Notes:
			// A. When deleting from toolbar we only use selected items from the grid (or use focus?). Currently this
			// happens from the different menu in layout.js -> move here?
			// B. When deleting from context menu use context to decide which selected items to use
			var self = this, id, parId, store = this.store, widget, selection;

			function remove(id, parId) {
				// note: remove creates closure for id in loop
				var dfd, obj, dialog;
				dialog = dialogs.getByFileObj('deleteFile', store.storeMemory.get(id));
				dfd = dialog.show();
				dfd = dfd.then(function() {
					return store.remove(id);
				});
				dfd.then(function() {
					self.removeHistory(id);
					if (self.context.isOnTreeRow || self.context.isOnTreeContainer) {
						obj = self.store.storeMemory.get(parId);
						self.display(obj);
					}
				}, error);
			}

			function error() {
				return function(err) {
					console.log(err);
				};
			}

			if (this.context.isOnGridRow || this.context.isOnGridContainer) {
				widget = this.grid;
				selection =  widget.selection;
				for (id in selection) {
					if (selection.hasOwnProperty(id) && selection[id] === true) {
						remove(id);
					}
				}
			}
			else {
				widget = this.tree;
				selection = widget.selectedItems;
				// multiple selection in tree is/has to be disabled, only one at a time
				if (selection.length > 0) {
					id = selection[0].id;
					parId = selection[0].parId;
					remove(id, parId);
				}
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
				size: 0,
				mod: this.getDate()
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
			var widget = this.context.isOnGridRow || this.context.isOnGridContainer ? this.grid : this.tree,
				store = this.store;

			return this.create(object).then(lang.hitch(this, function(object) {
				var element, column;

				if (this.context.isOnGridRow || this.context.isOnGridContainer) {
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
			var widget = this.context.isOnGridRow || this.context.isOnGridContainer ? this.grid : this.tree,
				store = this.store,
				column = widget.columns[store.labelAttr],
				element,
				id, selection = widget.selection;

			for (id in selection) {
				if (selection.hasOwnProperty(id) && selection[id] === true) {
					element = widget.get('editableElement', id, column.field);
					widget.edit(element);
				}
			}
		}
	})

});