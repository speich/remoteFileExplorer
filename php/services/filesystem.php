<?php

use remoteFileExplorer\FileSession;
use remoteFileExplorer\InputChecker;
use WebsiteTemplate\Controller;
use WebsiteTemplate\Error;
use WebsiteTemplate\Header;


require_once __DIR__.'/../inc_global.php';


$err = new Error();
$header = new Header();
$header->setContentType('json');
$ctrl = new Controller($header, $err);
$data = $ctrl->getDataAsObject(true);
$resources = $ctrl->getResource();
$controller = is_array($resources) ? $resources[0] : null;
$resource = $ctrl->getResource(true);
$moduleType = 'session';
$response = null;


switch ($moduleType) {
    case 'session':
        session_start();
        // use session to store the user's filesystem
        $fsData = require $rfeConfig['paths']['demo'].'demodata.php';
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

if (($data === null || $checker->sanitizeProperties($data, $fs->fields))) {
    switch ($ctrl->getMethod()) {
        case 'GET':
            if ($controller === 'search') {
                $keyword = str_replace('*', '', $data->name);
                $numRec = $fs->getNumSearchRecords($keyword);
                $ranges = $header->getRange();
                $rangeHeader = $header->createRange($ranges, $numRec);
                $header->add($rangeHeader[0], $rangeHeader[1]);
                $response = $fs->search($keyword, $ranges['start'], $ranges['end']);
            } else {
                $response = $fs->get($resource);
            }
            break;
        case 'POST':
            if ($resource) {
                $response = $fs->copy($resource, $data->parId);
            } else {
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

if ($response === null) {
    $ctrl->notFound = true;
}
$ctrl->printHeader();
$ctrl->printBody($response);