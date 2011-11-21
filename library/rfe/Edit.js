define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/aspect',
	'dojo/mouse',
	'dojo/dom',
	'dojo/dom-class',
	'dijit/registry',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/PopupMenuItem'
], function(lang, array, declare, Deferred, on, aspect, mouse, dom, domClass, registry, Menu, MenuItem, PopupMenuItem) {

	return declare('rfe.Edit', null, {
		editor: {
			contextMenu: null,   // reference to the context menu
			context: null  // reference to the widget the context menu was created on (right clicked on)
		},

		/**
		 * Initialize context menu for the file explorer.
		 * @target {object} target domNode
		 */
		initContextMenu: function() {
			var menu = Menu({
				id: 'rfeContextMenu',
				targetNodeIds: ['rfeContentPaneTree','rfeGrid'],   // grid extends to same size as pane, tree not
				popUpDelay: 0
			});
			var subMenu = Menu();

			// Override to enable context menu, since grid stops this event by default
			this.grid.onCellContextMenu = function() {};

			// Enable/disable menu items before displaying it:
			array.forEach(menu.targetNodeIds, function(id) {
				var context, domNode = dom.byId(id);
				on(domNode, 'mousedown', lang.hitch(this, function(evt) {
					if (!mouse.isRight(evt)) {
						return;
					}
					context = this.getContext(evt);
					this.enableContextMenuItems(menu, context);
					this.editor.context = context;
				}));
			}, this);

			menu.addChild(PopupMenuItem({
				label: 'New',
				popup: subMenu,
				iconClass: "dijitEditorIcon dijitEditorIconNewPage"
			}));
			menu.addChild(MenuItem({
				label: 'Rename',
				onClick: lang.hitch(this, this.edit)
			}));
			menu.addChild(MenuItem({
				label: 'Delete',
				onClick: lang.hitch(this, this.deleteItems)
			}));

			// subMenu new
			subMenu.addChild(MenuItem({
				label: 'Directory',
				onClick: lang.hitch(this, function() {
					this.createRenameItem({
						dir: true
					});
				})
			}));
			subMenu.addChild(MenuItem({
				label: 'File',
				onClick: lang.hitch(this, this.createRenameItem)
			}));

			menu.startup();
			this.editor.contextMenu = menu;
		},

		/**
		 * Enables or disables context menu items depending on the clicked context.
		 * @param {dijit.Menu} menu
		 * @param {object} context
		 */
		enableContextMenuItems: function(menu, context) {
			// TODO: this does not work with i18n since it uses the labels...
			// If not clicked on a item (tree.node or grid.row), but below widget and nothing is selected,
			// then set all menuItems to disabled except create/upload
			var label = '';
			if (context.isOnTree || context.isOnTreePane) {
				array.filter(menu.getChildren(), function(item) {
					label = item.get('label');
					if (label != 'New' && label != 'Upload') {
						item.set('disabled', true);
					}
				});
			}
			else if (context.isOnGridPane) {
				array.filter(menu.getChildren(), function(item) {
					label = item.get('label');
					if (label == 'Rename' || label == 'Delete') {
						item.set('disabled', true);
					}
				});
			}
			else if (context.isOnGrid) {
				array.forEach(menu.getChildren(), function(item) {
					item.set('disabled', false);
				});
			}
		},

		/**
		 * Delete selected item(s).
		 */
		deleteItems: function() {
            // TODO: return deferred list of all deleted items
			// Notes:
			// A. When deleting from toolbar we only use selected items from the grid (or use focus?). Currently this
			// happens from the different menu in layout.js -> move here?
			// B. When deleting from context menu use source to decide which selected items to use
			var self = this, store = this.store;
			var context = this.editor.context;
			var i = 0, len;
			var item, items, widget;

			widget = context.isOnGrid || context.isOnGridPane ? this.grid : this.tree;
            items = widget.selection.getSelected();	// TODO: make this work also for the tree which doesn't have the same selection object
			len = items.length;
			for (; i < len; i++) {
				item = items[i];
				Deferred.when(store.remove(item.id), function() {
					self.removeHistory(item.id);
					// When deleting folder in tree, grid is not updated by store.onDelete() since grid only contains folders children!
					if (item.dir && (context.isOnTree || context.isOnTreePane)) {
						console.log('deleteItems: refreshing grid');
						self.grid._refresh();   // note: grid._refresh has a timeout, so it doesn't matter to call it in rapid succession (in a loop)
					}
				}, function(err) {
					console.log(err);
				});
			}
		},

		/**
		 * Creates a new file object.
		 * @param {object} itemProps
		 * @return {object} dojo.store object
		 */
		createItem: function(itemProps) {
			var store = this.store;
			var parId = this.currentTreeItem.id;
			var item = {
				size: 0,
				parId: parId,
				mod: this.getDate()
			};
			if (itemProps && itemProps.dir) {
				item.dir = true;
				item.name = 'new directory';
			}
			else {
				item.name = 'new text file.txt';
			}

			return Deferred.when(store.add(item), function() {
				return item;
			})
		},

		/**
		 * Create and rename an item
		 * Creates a new item, selects it in the grid and switches to edit mode.
		 * @param {object} itemProps
         *
		 */
		createRenameItem: function(itemProps) {
            // TODO: return item after it is renamed
			// createItem makes the grid update all its rows -> we cant rename the new item right away since it's not rendered yet
			// Connect to endUpdate to time it right
			return Deferred.when(this.createItem(itemProps), lang.hitch(this, function(item) {
				var grid = this.grid;
				// store.add calls onNew() before returning. The grid listens to onNew() and calls grid._addItem() in turn.
				// So item is added to internal grid index before it is rendered, e.g. rowIndex is available right away
				var itemRowIndex = grid.getItemIndex(item);
				var itemRowIndex = grid.getItemIndex(item);
				var signal = aspect.after(grid, 'renderRow', lang.hitch(this, function(rowIndex) {
					if (rowIndex == itemRowIndex) {
						signal.remove();
						grid.selection.setSelected(rowIndex, true);	// new item in grid needs to be selected before it can be renamed
						this.currentGridItem = item;	// TODO use grid.selection instead ?
						this.edit();
					}
				}), true);
			}))
		},

      /**
         * Display grid's inline editor.
         */
      edit: function() {
            // note: rfe.Grid.doApplyCellEdit() does the actual renaming, e.g. call store.put
            var grid = this.grid, cell = grid.getCell(0); // TODO: get cell index from item.name instead
            var item = this.getLastSelectedItem(); // rename item is either called through contextMenu or menu toolbar
            cell.editable = true;
            grid.edit.setEditCell(cell, grid.getItemIndex(item));
        }

	});


});