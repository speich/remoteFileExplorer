define([
	"dojo/_base/lang",
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/event',
	'dojo/on',
	'dojo/mouse',
	'dojo/dom-class',
	"dojo/dnd/Container"
], function(lang, array, declare, event, on, mouse, domClass, Container) {

	return declare("rfe.dnd.GridContainer", null, {

		constructor: function(grid, params) {
			// summary: a constructor of the Container modeled after dijit.tree._dndContainer
			// params: Object: a dict of parameters, which gets mixed into the object
			this.grid = grid;
			this.node = this.grid.domNode;
			this.dndType = 'gridNode';

			lang.mixin(this, params);

			this.currentRowIndex = -1;

			this.containerState = "";
			domClass.add(this.node, "dojoDndContainer");

			this.events = [
				// container events
				on(this.node, mouse.enter, lang.hitch(this, "onOverEvent")),
				on(this.node, mouse.leave, lang.hitch(this, "onOutEvent")),
				// row events
				on(this.grid, "rowMouseOver", lang.hitch(this, "onMouseOver")),
				on(this.grid, "rowMouseOut", lang.hitch(this, "onMouseOut")),

				// cancel text selection and text dragging
				on(this.node, "dragstart", lang.hitch(event, "stop")),
				on(this.node, "selectstart", lang.hitch(event, "stop"))
			];
		},

		destroy: function() {
			// summary: prepares the object to be garbage-collected
			array.forEach(this.events, remove);
			this.node = this.parent = null;
		},

		/**
		 * Called when mouse is over a RowNode.
		 * Adds the properties item and id to the row to make it equal with tree for easy processing.
		 * @param {Event} e Decorated event object that contains reference to grid, cell, and rowIndex.
		 */
		onMouseOver: function(e) {
			this.addIdToRow(e.rowIndex);
			this.currentRowIndex = e.rowIndex;
		},

		/**
		 * Called when mouse moves away from rowNode.
		 * @param {Event} e Decorated event object that contains reference to grid, cell, and rowIndex.
		 */
		onMouseOut: function(e) {
			this.currentRowIndex = -1;
		},

		_changeState: function(type, newState) {
			// summary: changes a named state to new state value
			// type: String: a name of the state to change
			// newState: String: new state
			var prefix = "dojoDnd" + type;
			var state = type.toLowerCase() + "State";
			domClass.replace(this.node, prefix + newState, prefix + this[state]);
			this[state] = newState;
		},

		_addItemClass: function(node, type) {
			// summary: adds a class with prefix "dojoDndItem"
			// node: Node: a node
			// type: String: a variable suffix for a class name
			domClass.add(node, "dojoDndItem" + type);
		},

		_removeItemClass: function(node, type) {
			// summary: removes a class with prefix "dojoDndItem"
			// node: Node: a node
			// type: String: a variable suffix for a class name
			domClass.remove(node, "dojoDndItem" + type);
		},

		onOverEvent: function() {
			// summary:
			//		This function is called once, when mouse is over our container
			// tags:
			//		protected
			this._changeState("Container", "Over");
		},

		onOutEvent: function(){
			// summary:
			//		This function is called once, when mouse is out of our container
			// tags:
			//		protected
			this._changeState("Container", "");
		},

		/**
		 * Add store object's id to row node.
		 * @param {number} rowIndex
		 */
		addIdToRow: function(rowIndex) {
			// add id to rowNode since it's needed for the dnd.getItem() method and rowNodes only have a rowIndex
			var grid = this.grid;
			var item, node;

			node = grid.getRowNode(rowIndex);
			if (!node.id) {
				// Grid rows don't have an id. But we need one to be able to return the corresponding
		 		// dnd.item (other dnd sources use source.getItem(id), which is expected to return a dnd.item.
				item = grid.getItem(rowIndex);	// != this.getItem(key)
				node.id = this.dndType + '_' + item.id;
			}
		}

	});

});