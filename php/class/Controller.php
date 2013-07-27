<?php

/**
 * This class is used as a REST controller.
 * REST resources are transformed into a controller (first path segment) and an array of resources, e.g.:
 * filesystem.php/administration/user/1 would be stored as
 * $this->controller = 'administration' and $this->resources = array('user', 1);
 */

class Controller {

	/** @var int minimum number of bytes before using gzip for response */
	private $gzipThreshold = 300;

	/** @var bool response is automatically gzipped if body is longer than threshold. */
	private $autoCompress = true;

	/** @var null|string http protocol */
	private $protocol = null;

	/** @var null|string http method */
	private $method = null;

	/** @var string holding path */
	private $resource = '';

	/** @var string holding path segments */
	private $resources = '';

	/** @var string|null first path segment */
	private $controller = null;

	/** @var string */
	public $contentType = 'json';

	/** @var bool resource not found */
	public $notFound = false;

	/**
	 * Constructs the controller instance.
	 * @param Header $header
	 * @param Error $error
	 */
	public function __construct($header, $error) {
		$this->header = $header;
		$this->protocol = $_SERVER["SERVER_PROTOCOL"];
		$this->method = $_SERVER['REQUEST_METHOD'];
		$this->resource = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : null;
		$this->err = $error;

		if (!is_null($this->resource)) {
			/* Resource (path) is split into an array. The first segment is saved as the controller. */
			$this->resources = ltrim($this->resource, '/');
			$this->resources = explode('/', $this->resources);
			$this->controller = array_shift($this->resources);
		}
	}

	/**
	 * Converts PHP input parameters to an object
	 * Object properties correspond with request data
	 * @return object|null
	 */
	public function getDataAsObject() {
		switch ($this->method) {
			case 'POST':
				$data = count($_POST) > 0 ? $_POST : file_get_contents('php://input');	// in my local php installation $_POST is always empty, haven't figured out why yet
				$arr = json_decode($data);
				break;
			case 'PUT':
				$data = file_get_contents('php://input');
				$arr = json_decode($data);
				break;
			case 'GET':
				$arr = $_GET;
				break;
			case 'DELETE':
				if ($_SERVER['QUERY_STRING'] !== '') {
					// Delete has no body, but a query string is possible
					parse_str($_SERVER['QUERY_STRING'], $arr);
				}
				else {
					$arr = array();
				}
				break;
			default:
				$arr = array();
		}
		return count($arr) > 0 ? (object) $arr : null;
	}

	/**
	 * Returns the first path segment.
	 * @return null|string
	 */
	public function getController() {
		return $this->controller;
	}

	/**
	 * Returns the http method, e.g. GET, POST, PUT or DELETE
	 * @return null|string
	 */
	public function getMethod() {
		return $this->method;
	}

	/**
	 * Returns the currently used http protocol.
	 * @return null|string
	 */
	public function getProtocol() {
		return $this->protocol;
	}

	/**
	 * Returns the path split into segments (resources).
	 * @return array
	 */
	public function getResources() {
		return $this->resources;
	}

	/**
	 * Returns the full resource (path)
	 * @return string
	 */
	public function getResource() {
		return $this->resource;
	}

	/**
	 * Set gzip threshold.
	 * This is the minimum number of bytes before response is automatically gzipped unless you set autocompress to false.
	 * @param int $gzipThreshold
	 */
	public function setGzipThreshold($gzipThreshold) {
		$this->gzipThreshold = $gzipThreshold;
	}

	/**
	 * Set if response body is automatically compressed.
	 * If body is longer than $this->gzipThreshold it is automatically compressed using gzip unless you set this to false.
	 * @param boolean $autoCompress
	 */
	public function setAutoCompress($autoCompress) {
		$this->autoCompress = $autoCompress;
	}

	/**
	 * Set HTTP header.
	 */
	public function printHeader() {

		header('Content-Type: '.$this->header->getContentType($this->contentType).'; '.$this->header->getCharset());

		// server error
		if (count($this->err->get()) > 0) {
			header($_SERVER['SERVER_PROTOCOL'].' 505 Internal Server Error');
		}
		// resource not found
		else if ($this->notFound) {
			header($this->getProtocol().' 404 Not Found');
		}
		// resource found and processed
		else if ($this->getMethod() == 'POST') {
			header($this->getProtocol().' 201 Created');
		}
		else {
			header($this->getProtocol().' 200 OK');
		}
	}

	/**
	 * Print http response body.
	 * @param string $data response body
	 */
	public function printBody($data = null) {
		if (count($this->err->get()) > 0) {
			if ($this->contentType == 'json') {
				echo $this->err->getAsJson();
			}
			else {
				echo $this->err->getAsString();
			}
		}
		else if ($data) {
			$len = strlen($data);
			if ($this->autoCompress && $len > $this->gzipThreshold) {
				$data = gzencode($data);
				header('Content-Encoding: gzip');
				header('Content-Length: '.$len);
			}
			echo $data;
		}
	}
}