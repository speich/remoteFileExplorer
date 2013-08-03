<?php
use remoteFileExplorer\fs as fs;

require_once '../inc_global.php';
require_once 'Error.php';
require_once 'Controller.php';
require_once 'Header.php';
require_once 'Http.php';
require_once 'InputChecker.php';

$err = new Error();
$ctrl = new Controller(new Header(), $err);
$data = $ctrl->getDataAsObject();
$resource = $ctrl->getResource();
$controller = $ctrl->getController();
$resources = $ctrl->getResources();
$ctrl->contentType = 'json';
$response = false;
$header = false;
$moduleType = 'session';


switch($moduleType) {
	case 'session':
		// use session to store the user's filesystem
		require_once('FileSession.php');
		$fsData = require_once $rfeConfig['paths']['demo'].'demodata.php';
		$fs = new fs\FileSession($rfeConfig['paths']['demo'], $fsData);
		break;
	case 'sqlite':
		// TODO: use ModuleSQLite to store user's file system
		break;
	case 'disk':
		// TODO: use web server's filesystem
		break;
}

//sleep(1); // for testing async
//time_nanosleep(0, 500000000);	// = 0.5 seconds
$checker = new \remoteFileExplorer\InputChecker();

if (is_null($data) || $checker->sanitizeProperties($data, $fs->fields)) {

	if ($resource || $data) {
		switch ($ctrl->getMethod()) {
			case 'GET':
				if ($controller == 'search') {
					$keyword = str_replace('*', '', $data->name);
					$numRec = $fs->getNumSearchRecords($keyword);
					$ranges = $ctrl->header->getRange();
					$header = $ctrl->header->createRange($ranges, $numRec);
					$response = $fs->search($keyword, $ranges['start'], $ranges['end']);
				}
				else {
					$response = $fs->get($resource);
				}
				break;
			case 'POST':
				if ($resource) {
					$response = $fs->copy($resource, $data->parId);
				}
				else {
					$response = $fs->create($data);
				}
				break;
			case 'PUT':
				$response = $fs->update($data);
				break;
			case 'DELETE':
				$response = $fs->del($resource);
				break;
		}
	}

}

// resource found and processed
if ($response) {
	if ($header) {
		header($header);
	}
}
else {
	$ctrl->notFound = true;
}

$ctrl->printHeader();
$ctrl->printBody($response);