<?php
require_once '../../inc_global.php';
require_once 'CacheStore.php';
require_once 'ImageTool.php';
require_once 'Error.php';
require_once 'Controller.php';
require_once 'Header.php';
require_once 'Http.php';

// TODO: have a registry for all the different paths in a central location
$fsRoot = 'demo/';
$imgPath = 'cache/256/';

$err = new Error();
$ctrl = new Controller(new Header(), $err);
$data = $ctrl->getDataAsObject();
$resource = $ctrl->getResource();
$ctrl->contentType = 'json';
$response = false;
$header = false;

if ($resource) {

	$imgTool = new ImageTool();

	// check if image resource is already in cache, then either create it or return it
	// TODO: Limit cache size!
	$db = new CacheStore();
	$db = $db->connect();

	$db->beginTransaction();
	$sql = "SELECT id FROM cache WHERE resource = :resource";
	$stmt = $db->prepare($sql);
	$stmt->bindParam(':resource', $resource);
	$stmt->execute();
	$rec = $stmt->fetchObject();

	if (!$rec) {
		$sql = "INSERT INTO cache (resource) VALUES (:resource)";
		$stmt = $db->prepare($sql);
		$stmt->bindParam(':resource', $resource);
		$stmt->execute();
		$id = $db->lastInsertId();
	}
	else {
		$id = $rec->id;
	}
	$db->commit();

	if (!file_exists($imgPath.$id)) {
		$filters = array(
			'unsharpMask' => array()
		);
		$imgWidth = 256;
		$jpgQuality = 70;
		$imgSrc = $resource;
		$imgTrg = $imgPath.$id;
		$imgTool->createThumb($imgSrc, $imgTrg, $imgWidth, $jpgQuality);
	}
}
else {
	$err->set(0, 'thumbnail not found');
	$ctrl->notFound = true;
}

if ($err) {
	$ctrl->printHeader();
	$ctrl->printBody();
}
else {
	ob_start();
	header('Content-Type: image/jpeg');	// thumbnails are always jpg
	readfile($imgPath.$id);
	ob_end_flush();
}