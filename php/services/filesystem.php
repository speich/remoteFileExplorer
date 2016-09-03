<?php
use remoteFileExplorer\fs\FileSession;
use remoteFileExplorer\InputChecker;
use WebsiteTemplate\Controller;
use WebsiteTemplate\Error;
use WebsiteTemplate\Header;


require_once __DIR__.'/../inc_global.php';
require_once 'Error.php';
require_once 'Controller.php';
require_once 'Header.php';
require_once 'Http.php';
require_once 'InputChecker.php';

$err = new Error();
$header = new Header();
$header->setContentType('json');
$ctrl = new Controller($header, $err);
$data = $ctrl->getDataAsObject(true);
$controller = $ctrl->getResources();
$controller = is_array($controller) ? $controller[0] : null;
$resource = $ctrl->getResources(true);
$moduleType = 'session';
$response = null;


switch($moduleType) {
	case 'session':
		// use session to store the user's filesystem
		require_once('FileSession.php');
		$fsData = require_once $rfeConfig['paths']['demo'].'demodata.php';
		$fs = new FileSession($rfeConfig['paths']['demo'], $fsData);
		break;
	case 'sqlite':
		// TODO: use ModuleSQLite to store user's file system
		break;
	case 'disk':
		// TODO: use web server's filesystem
		break;
}

// for testing async
//time_nanosleep(0, rand(1, 2) * 250000000);	// = rand * 0.25 seconds

$checker = new InputChecker();

if ((is_null($data) || $checker->sanitizeProperties($data, $fs->fields))) {
		switch ($ctrl->getMethod()) {
			case 'GET':
				if ($controller === 'search') {
					$keyword = str_replace('*', '', $data->name);
					$numRec = $fs->getNumSearchRecords($keyword);
					$ranges = $header->getRange();
					$rangeHeader = $header->createRange($ranges, $numRec);
					$header->add($rangeHeader);
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

if (is_null($response)) {
	$ctrl->notFound = true;
}
$ctrl->printHeader();
$ctrl->printBody($response);