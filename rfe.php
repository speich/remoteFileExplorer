<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<title>Remote File Explorer (rfe)</title>
<link rel="stylesheet" type="text/css" href="/library/dojo/1.16.3/dijit/themes/claro/document.css">
<link rel="stylesheet" type="text/css" href="/library/dojo/1.16.3/dijit/themes/claro/claro.css">
<link rel="stylesheet" href="/library/dgrid/0.3.21/css/skins/claro.css">
<link rel="stylesheet" href="/js/resources/rfe.css">
</head>

<body class="claro rfe">
<div id="remoteFileExplorer" class="rfe"></div>
<script type="text/javascript">
var dojoConfig = {
	async: true,
	packages: [
		{name: 'dgrid', location: '/library/dgrid/0.3.21'},
		{name: 'xstyle', location: '/library/xstyle/0.3.3'},
		{name: 'put-selector', location: '/library/put-selector/0.3.6'},
		{name: 'rfe', location: '/js'},
		{name: 'rfe-php', location: '/php'}
	],
	map: {
		// redirect the following modules to my own modules
		'dijit/tree': {
			'dijit/tree/_dndSelector': 'rfe/dnd/TreeSelector',
			'dijit/tree/dndSource': 'rfe/dnd/TreeSource'
		},
		'dojo/dnd': {
			'dojo/dnd/Selector': 'rfe/dnd/Selector'
		}
	}
};
</script>
<script src="/library/dojo/1.16.3/dojo/dojo.js"></script>
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