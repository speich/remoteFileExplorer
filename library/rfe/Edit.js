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
			var object, objects, widget;

			widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree;
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
			store.add(object);
			/*
			return Deferred.when(store.add(object), function() {
				return object;
			})*/
		},

		/**
		 * Create and rename an file or folder object
		 * Creates a new item, selects it in the grid and switches to edit mode.
		 * @param {object} itemProps
         *
		 */
		createRename: function(object) {
			this.create(object);
/*			return Deferred.when(this.create(object), lang.hitch(this, function(object) {
console.log('created store object', object)
			}))*/
		}

	})


});