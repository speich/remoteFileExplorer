<?php
namespace WebsiteTemplate;

/**
 * Helper class to parse HTTP responses.
 */
class Http {

	/**
	 * Extract the http response header into array.
	 * @param string $str http response
	 * @return array
	 */
	public function parseHeader($str) {
		// code by bsdnoobz http://stackoverflow.com/users/1396314/bsdnoobz
		$lines = explode("\r\n", $str);
		$head = array(array_shift($lines));
		foreach ($lines as $line) {
			list($key, $val) = explode(':', $line, 2);
			if ($key == 'Set-Cookie') {
				$head['Set-Cookie'][] = trim($val);
			}
			else {
				$head[$key] = trim($val);
			}
		}
		return $head;
	}

	/**
	 * Decode the chunked-encoded string.
	 * @param $str
	 * @return string
	 */
	function decodeChunked($str) {
		// code by bsdnoobz http://stackoverflow.com/users/1396314/bsdnoobz
		for ($res = ''; !empty($str); $str = trim($str)) {
			$pos = strpos($str, "\r\n");
			$len = hexdec(substr($str, 0, $pos));
			$res .= substr($str, $pos + 2, $len);
			$str = substr($str, $pos + 2 + $len);
		}
		return $res;
	}

	/**
	 * Splits the http response into header and body.
	 * @param string $str http response
	 * @return array
	 */
	public function getHeaderAndBody($str) {
		$pos = strpos($str, "\r\n\r\n");
		return array(
			'header' => substr($str, 0, $pos),
			'body' => substr($str, $pos + 2)
		);
	}
}