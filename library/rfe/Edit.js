define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred'
], function(lang, array, declare, Deferred) {

	/**
	 * Provides functionality to edit files and folders.
	 * @class
	 * @name rfe.Edit
	 */
	return declare(null, /** @lends rfe.Edit.prototype */ {

		/**
		 * Delete selected file or folder object(s).
		 */
		del: function() {
			// Note: delete is a reserved word -> del
            // TODO: return deferred list of all deleted items
			// Notes:
			// A. When deleting from toolbar we only use selected items from the grid (or use focus?). Currently this
			// happens from the different menu in layout.js -> move here?
			// B. When deleting from context menu use source to decide which selected items to use
			var self = this, id, parId, store = this.store, widget, selection;

			function remove(id, parId) {
				return function() {
					console.log(id, parId);
					var obj;
					self.removeHistory(id);
					if (self.context.isOnTree || self.context.isOnTreePane) {
						obj = self.store.storeMemory.get(parId);
						self.display(obj);
					}
				};
			}
			function error() {
				return function(err) {
					console.log(err);
				};
			}

			if (this.context.isOnGrid || this.context.isOnGridPane) {
				widget = this.grid;
				selection =  widget.selection;
				for (id in selection) {
					if (selection.hasOwnProperty(id) && selection[id] === true) {
						Deferred.when(store.remove(id), remove(id), error());
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
					Deferred.when(store.remove(id), remove(id, parId), error());
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
				size: 0,
				parId: parId,
				mod: this.getDate()
			});
			object.name = object.dir ? 'new directory' : object.name = 'new text file.txt';
			return Deferred.when(store.add(object), function(object) {
				return object;
			})
		},

		/**
		 * Create and rename an file or folder object
		 * Creates a new item, selects it in the grid and switches to edit mode.
		 * @param {object} object file/folder object
		 */
		createRename: function(object) {
			var widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree,
				store = this.store;

			return Deferred.when(this.create(object), lang.hitch(this, function(object) {
				if (this.context.isOnGrid || this.context.isOnGridPane) {
					var column = widget.columns[store.labelAttr],
						cell = widget.cell(object.id, column.field);
					console.log(widget)
					widget.edit(cell);
				}
			}))
		},

		/**
		 * Create a new file or folder object.
		 */
		rename: function() {
			// TODO: make this work also for the tree which doesn't have the same selection object
			// tree's selection is widget.selectedItems which is array of store objects
			var widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree,
				store = this.store,
				column = widget.columns[store.labelAttr],
				id, selection = widget.selection;

			for (id in selection) {
				if (selection.hasOwnProperty(id) && selection[id] === true) {
					var cell = widget.cell(id, column.field);
					console.log(widget)
					widget.edit(cell);
					console.log(widget)
				}
			}
		}
	})

});