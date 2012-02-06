define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred'
], function(lang, array, declare, Deferred) {

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
			// B. When deleting from context menu use source to decide which selected items to use
			var self = this, store = this.store;
			var context = this.getContext();
			var i = 0, len;
			var object, objects, widget;

			widget = context.isOnGrid || context.isOnGridPane ? this.grid : this.tree;
            objects = widget.selection.getSelected();	// TODO: make this work also for the tree which doesn't have the same selection object
			len = objects.length;
			for (; i < len; i++) {
				object = objects[i];
				Deferred.when(store.remove(object.id), function() {
					self.removeHistory(object.id);
					// When deleting folder in tree, grid is not updated by store.onDelete() since grid only contains folders children!
					if (object.dir && (context.isOnTree || context.isOnTreePane)) {
						console.log('deleteItems: refreshing grid');
						self.grid._refresh();   // note: grid._refresh has a timeout, so it doesn't matter to call it in rapid succession (in a loop)
					}
				}, function(err) {
					console.log(err);
				});
			}
		},

		/**
		 * Creates a new file or folder object.
		 * @param {object} itemProps
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
			return Deferred.when(store.add(object), function() {
				return object;
			})
		},

		/**
		 * Create and rename an file or folder object
		 * Creates a new item, selects it in the grid and switches to edit mode.
		 * @param {object} itemProps
         *
		 */
		createRename: function(object) {

			return Deferred.when(this.create(object), lang.hitch(this, function(object) {

			}))
		}

	})


});