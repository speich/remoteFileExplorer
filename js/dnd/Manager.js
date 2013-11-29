define(['dojo/dnd/Manager', 'rfe/dnd/Avatar'], function(Manager, Avatar) {
	Manager.prototype.makeAvatar = function() {
		return new Avatar(this);
	};

	// make the dragged icons appear under mouse pointer
	//Manager.prototype.OFFSET_X += -60;
	//Manager.prototype.OFFSET_Y += -60;
});
