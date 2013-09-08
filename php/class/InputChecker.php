<?php
/**
 * Created by PhpStorm.
 * User: Simon
 * Date: 03.08.13
 * Time: 15:56
 */
namespace remoteFileExplorer;

class InputChecker {

	/**
	 * Check input object for properties.
	 * Triggers an error if undefined (illegal) property is found.
	 * @param object $input
	 * @param array $properties properties to check for
	 * @return bool
	 */
	public function sanitizeProperties($input, $properties) {
		foreach ($input as $key => $value) {
			if (array_search($key, $properties) === false) {
				trigger_error('input contains illegal property');
				return false;
			}
		}
		return true;
	}
} 