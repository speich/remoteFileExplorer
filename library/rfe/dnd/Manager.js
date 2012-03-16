define(['dojo/_base/declare', 'dojo/dnd/Manager', 'rfe/dnd/Avatar'], function(declare, Manager, Avatar) {
	Manager.prototype.makeAvatar = function() {
		return new Avatar(this);
	}
});
