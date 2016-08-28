<?php
/**
 * This file contains the class Controller.
 */
namespace WebsiteTemplate;

use stdClass;


/**
 * This class is used as a REST controller.
 * REST resources are transformed into a controller (first path segment) and an array of resources, e.g.:
 * controller.php/administration/user/1 would be stored as
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

	/** @var array array of path segments */
	private $resources = array();

	/** @var string|null first path segment */
	private $controller = null;

	/** @var null|Header  */
	private $header = null;

	/** @var bool respond with 404 resource not found */
	public $notFound = false;

	/** @var bool flush buffer every bytes */
	public $outputChunked = false;

	/** @var int chunk size for flushing */
	public $chunkSize = 4096;	// = 1 KB

	/**
	 * Constructs the controller instance.
	 * If you don't want the first path segment to be set as the controller, set $useController to false.
	 * @param Header $header
	 * @param Error $error
	 * @param Boolean $useController
	 */
	public function __construct(Header $header, Error $error, $useController = true) {
		$this->header = $header;
		$this->protocol = $_SERVER["SERVER_PROTOCOL"];
		$this->method = $_SERVER['REQUEST_METHOD'];
		$this->resources = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : null;
		$this->err = $error;

		if (!is_null($this->resources)) {
			/* Resource (path) is split into an array. The first segment is saved as the controller. */
			$this->resources = trim($this->resources, '/');
			$this->resources = explode('/', $this->resources);
			if ($useController) {
				$this->controller = array_shift($this->resources);
			}
		}
	}

	/**
	 * Converts PHP input parameters to an object
	 * Object properties correspond with request data
	 * @param bool $json handle post data as json
	 * @return stdClass |null
	 */
	public function getDataAsObject($json = false) {
		switch ($this->method) {
			case 'POST':
				if ($json) {
					$arr = json_decode(file_get_contents('php://input'));
				}
				else {
					// note: Make sure you set the correct Content-Type when doint a xhr POST
					$arr = $_POST;
				}
				break;
			case 'PUT':
				$data = file_get_contents('php://input');
				if ($json) {
					$arr = json_decode($data);
				}
				else {
					parse_str($data, $arr);
				}
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
	 * Prints the header section of the HTTP response.
	 * Sets the Status Code, Content-Type and additional headers set optionally.
	 */
	public function printHeader() {
		$contentType = $this->notFound ? 'text/html' : $this->header->getContentType();
		header('Content-Type: '.$contentType.'; '.$this->header->getCharset());
		foreach($this->header->get() as $header) {
			header($header);
		}

		// server error
		if (count($this->err->get()) > 0) {
			header($this->getProtocol().' 505 Internal Server Error');
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
	 * Prints the body section of the HTTP response.
	 * Automatically compresses body if autoCompress is set to true and length threshold is reached.
	 * Prints the body in chunks if outputChunked is set to true.
	 * @param string $data response body
	 */
	public function printBody($data = null) {
		if (count($this->err->get()) > 0) {
			if ($this->header->getContentType() === 'application/json') {
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
				// recalc length after compressing
				$len = strlen($data);
				header('Content-Encoding: gzip');
				header('Content-Length: '.$len);
			}

			if ($this->outputChunked) {
				$chunks = str_split($data, $this->chunkSize);
				foreach ($chunks as $chunk) {
					echo $chunk;
					ob_flush();
					flush();
				}
			}
			else {
				echo $data;
			}
		}
		else {
			if ($this->header->getContentType() === 'application/json') {
				echo '{}';
			}
		}
	}
}