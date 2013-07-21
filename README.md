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
* net panel logging all requests and server errors
* remember opened folder and selection state

## Dependencies
Requires the following dependencies to be installed or mapped into the folder /library:
* [The Dojo Toolkit](http://dojotoolkit.org) SDK version 1.8.1 or higher
* [dgrid](https://github.com/SitePen/dgrid)
* [xstyle](https://github.com/kriszyp/xstyle)
* [put-selector](https://github.com/kriszyp/put-selector)
