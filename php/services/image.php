<?php
require_once '../inc_global.php';
require_once 'CacheStore.php';
require_once 'ImageTool.php';
require_once 'Error.php';
require_once 'Controller.php';
require_once 'Header.php';
require_once 'Http.php';

// This file is just a quick and dirty hack to generate the thumbnails. The size is created exactly to the posted width.
// Instead the dimensions should be created in discrete steps, the browser could then scale them to the required width.
// Also paths are not created when they do not exist, cache size is not limited, ...

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

	if (!file_exists($rfeConfig['paths']['thumbnailCache'].$id.".jpg")) {
		$filters = array(
			'unsharpMask' => array()
		);
		$imgWidth = property_exists($data, 'w') ? $data->w : 256;
		$jpgQuality = 80;
		$imgSrc = $rfeConfig['paths']['fileSystemRoot'].ltrim($resource, '/');
		$imgTrg = $rfeConfig['paths']['thumbnailCache'].$id.".jpg";
		$imgTool->createThumb($imgSrc, $imgTrg, $imgWidth, $jpgQuality, $filters);
	}
}
else {
	$err->set(0, 'thumbnail not found');
	$ctrl->notFound = true;
}

if ($err->get()) {
	$ctrl->printHeader();
	$ctrl->printBody();
}
else {
	ob_start();
	header('Content-Type: image/jpeg');	// thumbnails are always jpg
	readfile($rfeConfig['paths']['thumbnailCache'].$id.".jpg");
	ob_end_flush();
}