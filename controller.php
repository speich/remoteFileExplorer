<?php
require_once 'inc_global.php';
require_once 'Error.php';
require_once 'Controller.php';
require_once 'Header.php';
require_once 'Http.php';

$err = new Error();
$ctrl = new Controller(new Header(), $err);
$data = $ctrl->getDataAsObject();
$controller = $ctrl->getController();
$resources = $ctrl->getResources();
$ctrl->contentType = 'json';
$response = false;
$header = false;
$moduleType = 'session';

switch($moduleType) {
	case 'session':
		// use session to store the user's filesystem
		// root dir is used for the session's name 
		require_once('ModuleSession.php');
		$rootDir ='virtFileSystem';
		$fs = new ModuleSession($rootDir);
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

switch($ctrl->getMethod()) {
	case 'GET':
		if ($controller == 'search') {
			$keyword = str_replace('*', '', $data->name);
			$numRec = $fs->getNumSearchRecords($keyword);
			$ranges = $ctrl->header->getRange();
			$header = $ctrl->header->createRange($ranges, $numRec);
			$response = $fs->search($keyword, $ranges['start'], $ranges['end']);
		}
		else {
			$response = $fs->get(implode('/', $resources));
		}
		break;
	case 'POST':
		$response = $fs->create($resources, $data);
		break;
	case 'PUT':
		$response = $fs->update($resources, $data);
		break;
	case 'DELETE':
		$response = $fs->del($resources);
		break;
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