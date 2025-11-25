<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <title>Remote File Explorer (rfe)</title>
    <link rel="stylesheet" type="text/css" href="/library/dojo/dijit/themes/claro/document.css">
    <link rel="stylesheet" type="text/css" href="/library/dojo/dijit/themes/claro/claro.css">
    <link rel="stylesheet" href="/library/dgrid/css/skins/claro.css">
    <link rel="stylesheet" href="/js/resources/reset.css">
    <link rel="stylesheet" href="/js/resources/rfe.css">
</head>

<body class="claro rfe">
<div id="remoteFileExplorer" class="rfe"></div>
<script type="text/javascript">
  var dojoConfig = {
    async: true,
    baseUrl: '/library/dojo',
    packages: [
      {name: 'dojo', location: 'dojo'},
      {name: 'dijit', location: 'dijit'},
      {name: 'dgrid', location: '../dgrid'},  /* this is the last (known) working version */
      {name: 'xstyle', location: '../xstyle'},
      {name: 'put-selector', location: '../put-selector'},
      {name: 'rfe', location: '../../js'},
      {name: 'rfe-php', location: '../../php'}
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
<script src="/library/dojo/dojo/dojo.js"></script>
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