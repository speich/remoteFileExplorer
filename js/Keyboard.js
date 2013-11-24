define(['dojo/_base/declare', 'dojo/has', 'dojo/on'], function(declare, has, on) {

	var ctrlEquiv = has("mac") ? "metaKey": "ctrlKey";

	return declare(null, {

		/**
		 * Hash mapping key codes to functions to be executed within the tree or grid's body
		 */
		keyMapContent: null,

		/**
		 * Hash mapping key codes to function to be executed outside of the tree or grids content
		 */
		keyMap: null,

		constructor: function() {
			this.keyMapContent = {
				46: this.del,
				ctrl: {
					65: this.selectAll,	// a
					67: this.copy,		// c
					86: this.paste,		// v
					88: this.cut		// x
				}
			};
		},

		_handleKey: function(evt) {
			var map, handler,
				nodeType = evt.target.nodeName.toLowerCase();

			if (nodeType === 'input' || nodeType === 'textarea') {
				// prevent calling delete/copy-paste in form
				return;
			}
			//map = (this.context.isOnGrid || this.context.isOnTree) ? this.keyMapContent : this.keyMap;
			map = this.keyMapContent;
			map = evt[ctrlEquiv] ? map.ctrl : map;
			handler = map[evt.keyCode];
			if (handler) {
				evt.preventDefault();
				handler.call(this, evt);
			}
		},

		postCreate: function() {
			this.inherited('postCreate', arguments);

			var rfe = this;

			on(this.domNode, 'keydown', function(evt) {
				rfe.set('context', evt, this);
				rfe._handleKey(evt);
			});
		},

		/**
		 * Select/deselect all rows in grid
		 * Cancels selecting of all text in file explorer by browser.
		 */
		selectAll: function() {
			if (this.context.isOnGrid) {
				// already handled by grid Keyboard.js
				return;
			}
			// do not select everything, only grid content
			this.grid[this.grid.allSelected ? "clearSelection" : "selectAll"]();
		}

	});
});