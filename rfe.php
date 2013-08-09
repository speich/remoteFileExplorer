<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<title>Remote File Explorer (rfe)</title>
<link rel="stylesheet" type="text/css" href="/dojo/1.9.1/dijit/themes/claro/document.css">
<link rel="stylesheet" type="text/css" href="/dojo/1.9.1/dijit/themes/claro/claro.css">
<link rel="stylesheet" href="/dgrid/css/skins/claro.css">
<link rel="stylesheet" href="/js/resources/reset.css">
<link rel="stylesheet" href="/js/resources/rfe.css">
</head>

<body class="claro rfe">
<div id="remoteFileExplorer"></div>
<script type="text/javascript">
var dojoConfig = {
	async: true,
	packages: [
		{name: 'dgrid', location: '/dgrid'},
		{name: 'xstyle', location: '/xstyle'},
		{name: 'put-selector', location: '/put-selector'},
		{name: 'rfe', location: '/js'},
		{name: 'rfe-php', location: '/php'}
	],
	map: {
		// redirect the following modules to my own modules
		'dijit/tree': {
			'dijit/tree/_dndSelector': 'rfe/dnd/TreeSelector',
			'dijit/tree/dndSource': 'rfe/dnd/TreeSource'
		}
	}
};
</script>
<script type="text/javascript" src="/dojo/1.9.1/dojo/dojo.js"></script>
<script type="text/javascript">
require(['dojo/ready', 'rfe/FileExplorer'], function(ready, FileExplorer) {
	ready(function() {
		var rfe = new FileExplorer({
			id: 'remoteFileExplorer',
			origPageUrl: '/rfe.php'
		});
		rfe.startup();
	});
});
</script>
</body>
</html>