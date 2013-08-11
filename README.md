This web application manages files and folders on a remote web server directly within your browser. It copies the behavior of Windows Explorer.
remoteFileExplorer (rfe) is programmed in JavaScript using dojo on the client side and PHP on the server side.
All communication with the web server is done through REST.

Working [demo of the remoteFileExplorer](http://www.speich.net/projects/programming/remoteFileExplorer.php)

## Features
* REST-based file operations on remote server (create, rename and delete)
* lazy loading combined with client-side caching of files and folders
* move (multiple) files and folder with drag and drop (copy not implemented yet)
* keyboard support
* list and icons view of files
* vertical or horizontal layout with or without navigation pane (tree view)
* searching for files and folders
* sorting of files and folders
* access folders and files directly over the address bar of the browser
* net panel logging all requests and server errors
* remember opened folder and selection state
* server side automatic generation of thumbnails with caching

## JavaScript Dependencies
Requires the following dependencies to be installed or mapped:
* [The Dojo Toolkit](http://dojotoolkit.org) SDK version 1.8.1 or higher, mapped to /dojo
* [dgrid](https://github.com/SitePen/dgrid), mapped to /dgrid
* [xstyle](https://github.com/kriszyp/xstyle), mapped to /xstyle
* [put-selector](https://github.com/kriszyp/put-selector), mapped to /put-selector

## PHP Dependencies
Requires the following additional extensions to be loaded:
* php_gd2.dll
* php_mbstring.dll
* php_exif
* php_pdo_sqlite.dll