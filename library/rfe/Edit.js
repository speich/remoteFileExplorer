define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred'
], function(lang, array, declare, Deferred) {

	/**
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
			var self = this, store = this.store;
			var widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree;

			// TODO: make this work also for the tree which doesn't have the same selection object
			// tree's selection is widget.selectedItems which is array of store objects
			for (var id in widget.selection) {
				if (widget.selection[id] === true) {
					Deferred.when(store.remove(id), function() {
						self.removeHistory(id);
					}, function (err) {
						console.log(err);
					});
				}
			}
		},

		/**
		 * Creates a new file or folder object.
		 * @param {object} object
		 * @return {object} dojo.store object
		 */
		create: function(object) {
			var store = this.store;
			var parId = this.currentTreeObject.get('id');
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
			var widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree;
			var store = this.store;
			return Deferred.when(this.create(object), lang.hitch(this, function(object) {
				if (this.context.isOnGrid || this.context.isOnGridPane) {
					var column = widget.columns[store.labelAttr];
					var cell = widget.cell(object.id, column.field);
					widget.edit(cell);
				}
			}))
		},

		/**
		 * Create a new file or folder object.
		 */
		rename: function() {
			var widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree;
			var store = this.store;
			// TODO: make this work also for the tree which doesn't have the same selection object
			// tree's selection is widget.selectedItems which is array of store objects

			var column = widget.columns[store.labelAttr];
			var id, selection = widget.selection;
			for (id in selection) {
				if (selection.hasOwnProperty(id) && selection[id] === true) {
					var cell = widget.cell(id, column.field);
					widget.edit(cell);
				}
			}
		}

	})


});