define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'put-selector/put'
], function(lang, array, declare, Deferred, put) {

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
			return Deferred.when(store.add(object), function(object) {
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
			var widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree;

			return Deferred.when(this.create(object), lang.hitch(this, function(object) {
				console.log('created store object', object)
				if (this.context.isOnGrid || this.context.isOnGridPane) {
					var newRow = widget.row(object.id)	// properies are data, elememt, id
					console.log(widget.editor, newRow)
				}
			}))
		},

		rename: function() {
			var widget = this.context.isOnGrid || this.context.isOnGridPane ? this.grid : this.tree;
			var store = this.store;
			// TODO: make this work also for the tree which doesn't have the same selection object
			// tree's selection is widget.selectedItems which is array of store objects

			// find label column
			var i = 0, len = widget.columns;
			for (; i < len; i++) {
				if (widget.columns[i].field == widget.store.labelAttr) {
					return;
				}
			}
			var column = widget.columns[i];
			for (var id in widget.selection) {
				if (widget.selection[id] === true) {
					var row = widget.row(id);	// properies are data, elememt, id
					var cell = widget.cell(id, 0);


					//var column = widget.columns[0];	// should get by store.labelAttr
					var editor = column.editorInstance;	// input field
					console.log(widget, row, cell, column)
					put(cell, editor.domNode || editor);

					//column.onShowEditor();
					//widget.editor.renderInput(value, cell, object);
				}
			}
		}

	})


});