<?php
namespace WebsiteTemplate;

/**
 * Helper class to work with HTTP headers.
 */
class Header {

	/** @var string $contentType header default MIME type set to text/html */
	private $contentType = 'text/html';

	/** @var string $charset default characterset set to utf-8 */
	private $charset = 'utf-8';

	/** @var array contains additional response headers */
	private $headers = array();

	/** @var array $contentTypes MIME types lookup */
	private $contentTypes = array(
		'text' => 'text/plain',
		'csv' => 'text/csv',
		'json' => 'application/json',
		'pdf' => 'application/pdf',
		'html' => 'text/html',
		'svg'	=> 'image/svg+xml'
	);

	/**
	 * Set the MIME type of the header.
	 * Abbreviations can be used instead of full MIME type for some content types.
	 * @param string $contentType
	 */
	public function setContentType($contentType) {
		$contentType = array_key_exists($contentType, $this->contentTypes) ? $this->contentTypes[$contentType] : $contentType;
		$this->contentType = $contentType;
	}

	/**
	 * Returns the content type (MIME type).
	 * @return string
	 */
	public function getContentType() {
		return $this->contentType;
	}

	/**
	 * Extracts the range start and end from the header.
	 * Returns an array with start and end key or null if range header is not sent.
	 * @return array|null
	 */
	public function getRange() {
		if (isset($_SERVER['HTTP_RANGE'])) {
			$arr = explode('-', substr($_SERVER['HTTP_RANGE'], 6)); // e.g. items=0-24
			return array('start' => $arr[0], 'end' => $arr[1]);
		}
		else {
			return null;
		}
	}

	/**
	 * Creates the range header string.
	 * @param array $arrRange array containing start and end
	 * @param int $numRec total number of items
	 * @return string
	 */
	public function createRange($arrRange, $numRec) {
		return 'Content-Range: items '.$arrRange['start'].'-'.$arrRange['end'].'/'.$numRec;
	}

	/**
	 * Returns the character set
	 * @return string
	 */
	public function getCharset() {
		return $this->charset;
	}

	/**
	 * Add a header to the headers array.
	 * @param {String} $header header string
	 */
	public function add($header) {
		array_push($this->headers, $header);
	}

	/**
	 * Returns the array containing the headers.
	 * @return array
	 */
	public function get() {
		return $this->headers;
	}
}