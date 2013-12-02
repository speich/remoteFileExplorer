define([
	'dojo/_base/declare',
	'dojo/on',
	'dojo/dnd/Selector'
], function(declare, on, Selector) {

	return declare([Selector], {

		onMouseDown: function(evt) {
			// onMouseDown calls stopPropagation() which prevents setting context -> add it back with emit()
			// @see https://bugs.dojotoolkit.org/ticket/17606
			this.inherited('onMouseDown', arguments);
			on.emit(evt.target, 'mousedown', {
				bubbles: true,
				cancelable: true
			});
		}
	});



	// TODO: unify dgrid.selection and dijit.tree.selectedItems
	// dgrid.selection{} is a hash where ids are store object ids, dgrid.dndSource.Selection{} is a hasg where ids are node ids
	// dijit.tree.selectedItems = [id] array of store item ids dijit.tree.dndSource.
});