<?php
/**
 * This file contains an error reporting class.
 *
 * @author Simon Speich
 * @package General
 */

/**
 * Class to work with PHP error messages.
 * All native PHP errors (except fatal errors) are caught and logged to an array by using the native set_error_handler function.
 * Additional error messages can be set with the method set().
 *
 * @author Simon Speich
 * @package General
 */
class Error {

	/**
	 * Stores error messages.
	 * @var array $arrErr
	 */
	var $arrErr = null;

	/**
	 * Constructs the error reporting class by setting the native set_error_handler function.
	 * @link http://www.php.net/set_error_handler
	 */
	public function __construct() {
		// set_error_handler() does not catch fatal errors such as exceeding the allowed memory size
		// -> use register_shutdown_function() in addition
		set_error_handler(array($this, 'set'), E_ALL);
	}

	/**
	 * Custom PHP error handling function.
	 * @see http://www.php.net/set_error_handler
	 * @param integer $errNo
	 * @param string $errMsg
	 * @param string $errFile
	 * @param integer $errLine
	 */
	public function set($errNo, $errMsg, $errFile = '', $errLine = 0) {
		if (!is_array($this->arrErr)) {
			$this->arrErr = array();
		}
		$this->arrErr[] = array('code' => $errNo, 'msg' => $errMsg, 'file' => $errFile, 'line' => $errLine);
	}

	/**
	 * Returns all errors.
	 * @return array
	 */
	public function get() {
		return $this->arrErr;
	}

	/**
	 * Resets all errors.
	 */
	public function reset() {
		$this->arrErr = null;
	}

	/**
	 * Returns all errors as a json array.
	 * @return string json
	 */
	public function getAsJson() {
		$errs = $this->get();
		$json = '[';
		foreach ($errs as $key => $err) {
			// json_encode does not work if arr contains null
			$msg = 'Fehler: '.$err['msg'];
			if ($err['line'] > 0) {
				$msg.= ' in '.$err['file'].' on line '.$err['line'];
			}
			$json.= json_encode(array('msg' => $msg));
			if ($key < count($errs) - 1) {
				$json.= ',';
			}
		}
		$json.= ']';
		return $json;
	}

	/**
	 * Returns all errors as a string.
	 * @return string
	 */
	public function getAsString() {
		$str = '';
		$errs = $this->get();
		foreach ($errs as $key => $err) {
			$str.= $err['msg'];
			if ($err['line'] > 0) {
				$str.= ' in '.$err['file'].' on line '.$err['line'];
			}
			$str.= addslashes($str);
			if ($key < count($errs) - 1) {
				$str.= '<br/>';
			}
		}
		return $str;
	}

}
