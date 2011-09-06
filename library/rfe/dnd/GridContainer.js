define([
	"dojo/_base/lang",
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/on',
	'dojo/mouse',
	'dojo/dom-class',
	"dojo/dnd/Container"
], function(lang, array, declare, on, mouse, domClass, Container) {

	return declare("rfe.dnd.GridContainer", null, {

		constructor: function(grid, params) {
			// summary: a constructor of the Container modeled after dijit.tree._dndContainer
			// params: Object: a dict of parameters, which gets mixed into the object
			this.grid = grid;
			this.domNode = this.grid.domNode;
			this.dndType = 'gridNode';

			lang.mixin(this, params);

			this.currentRowNode = null;
			this.currentRowIndex = -1;

			// states
			this.containerState = "";
			domClass.contains(this.domNode, "dojoDndContainer");

			// set up events
			this.events = [
				on(this.grid.domNode, mouse.enter, lang.hitch(this, "onOverEvent")),
			   on(this.grid.domNode, mouse.leave, lang.hitch(this, "onOutEvent")),
				this.grid.on("rowMouseOver", lang.hitch(this, "onMouseOver")),
				this.grid.on("rowMouseOut", lang.hitch(this, "onMouseOut"))
			];
		},

		// abstract access to the map
		getItem: function(/*String*/ key) {
			// summary: returns a data item by its key (id)

			// note: key = id and not the same as rowIndex. Can be called by any other dnd source with node.id = key
			var grid = this.grid;
			var node = this.selection[key];
			node.item = grid.getItem(node.gridRowIndex);
			return {
				data: node,
				type: [this.dndType]
			};
		},

		destroy: function() {
			// summary: prepares the object to be garbage-collected
			array.forEach(this.events, remove);
		},

		/**
		 * Keep track on which row the mouse is over
		 * @param e
		 */
		onMouseOver: function(e) {
			this.currentRowNode = e.rowNode;
			this.currentRowIndex = e.rowIndex;
		},

		onMouseOut: function(e) {
			this.currentRowNode = null;
			this.currentRowIndex = -1;
		},

		_changeState: function(type, newState) {
			// summary: changes a named state to new state value
			// type: String: a name of the state to change
			// newState: String: new state
			var prefix = "dojoDnd" + type;
			var state = type.toLowerCase() + "State";
			domClass.replace(this.domNode, prefix + newState, prefix + this[state]);
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
		}

	});

});