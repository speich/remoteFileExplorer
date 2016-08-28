<?php
/**
 * Sets global variables, includes class files and intializes main objects.
 * This file needs to be included in every page
 * 
 * @package NAFIDAS
 */

session_start();

$timeout = 60;
set_time_limit($timeout);
date_default_timezone_set('Europe/Zurich');

// If you want to work on different servers and subdirectories set this path
$path = '/';

// make include paths available to pages independent on subdir they reside in. On windows this has to be absolute paths
$absPath = rtrim($_SERVER['DOCUMENT_ROOT'], '/').$path;
$incPath = $absPath.'php/class'.PATH_SEPARATOR;
$incPath.= $absPath.'php/services';
set_include_path($incPath);


// config paths
$rfeConfig = [
	'paths' => [
		'webroot' => $absPath,
		'demo' => $absPath.'php/fs/demo/',
		'fileSystemRoot' => $absPath.'php/fs/',
		'thumbnailCache' => $absPath.'php/fs/cache/'
	]
];