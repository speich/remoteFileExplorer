<?php
/**
 * Class Header
 */
class Header {

	private $charset = 'utf-8';

	/** @var string http header content type*/
	private $contentTypes = array(
		'text' => 'text/plain',
		'json' => 'application/json',
		'pdf' => 'application/pdf',
		'html' => 'text/html',
		'svg'	 => 'image/svg+xml',
		'jpg' => 'image/jpeg'
	);

	/**
	 * @param string $type
	 * @return string
	 */
	public function getContentType($type) {
		return $this->contentTypes[$type];
	}

	/**
	 * Extracts the range start and end from the header.
	 * Returns an array with start and end key.
	 * @return array
	 */
	public function getRange() {
		$arr = explode('-', substr($_SERVER['HTTP_RANGE'], 6));	// e.g. items=0-24
		return array('start' => $arr[0], 'end' => $arr[1]);
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
	 * Return the character set.
	 * @return string
	 */
	public function getCharset() {
		return $this->charset;
	}
}