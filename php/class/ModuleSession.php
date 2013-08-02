<?php
/**
 * Module for the class FileExplorer.
 * Allows you to store a virtual file system as an array in a session variable.
 * Directories are directly referenced for fast lookup.
 * @author Simon Speich
 */

require_once 'FileExplorer.php';

class ModuleSession extends FileExplorer {

	/** @var int limit number of items that can be in filesystem */
	private $numItemLimit = 100;

	/**
	 * Array storing the file system (fsArray).
	 * Provides a default file system prefilled with some files and folders.
	 * Note: References ($ref) never start with a slash since this would overwrite the JsonRestStore's target
	 * and send the GET as www.mysite.ch/resource instead of www.mysite.ch/target/resource
	 * @var array
	 */
	private $fsDefault = array();

	/**
	 * Instantiates the session based filesystem.
	 * The string root dir is used as the session name.
	 * @param string $rootDir
	 * @param array $data
	 */
	public function __construct($rootDir, $data) {
		parent::__construct($rootDir);
		if (!isset($_SESSION['rfe'])) {
			$this->fsDefault = $data;
			$_SESSION['rfe'][$rootDir] = serialize($data);
			$_SESSION['rfe']['lastUsedItemId'] = count($data);	// this is a very simple way which is not very robust // TODO: better way to create an id
		}
	}
	
	/**
	 * Reads requested resource from file system array.
	 * @param string $resource REST resource
	 * @return string|bool json or false
	 */
	public function get($resource) {
		$json = false;
		$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
		if (substr($resource, -1) === '/') {   // query for children of $resource
			$json = $this->getChildren(rtrim($resource, '/'), $fs);
		}
		else if (array_key_exists($resource, $fs)) { // get item
			$item = $fs[$resource];
			$json = json_encode($item, JSON_NUMERIC_CHECK);
		}
		return $json;
	}

	/**
	 * Returns the children of a directory.
	 * @param string $resource
	 * @param array $fs array with files
	 * @return string json
	 */
	public function getChildren($resource, $fs) {
		$arr = array();
		foreach ($fs as $row) {
			if (array_key_exists('parId', $row) && $row['parId'] == $resource) {
				$arr[] = $row;
			}
		}
		// sort array to display folders first, then alphabetically
		// Obtain a list of columns for multisort
		if (count($arr) > 0) {
			$dirs = array();
			$names = array();
			foreach ($arr as $key => $row) {
				$dirs[$key] = array_key_exists('dir', $row) ? 'a' : 'b';
				$names[$key] = $row['name'];
			}
			array_multisort($dirs, SORT_ASC, $names, SORT_ASC, $arr);
			$json = json_encode($arr, JSON_NUMERIC_CHECK);
		}
		else {
			$json = '[]';
		}
		return $json;
	}

	/**
	 * Update item located at resource.
	 * @param string $resource REST resource
	 * @param object $data request data
	 * @return string|bool json or false
	 */
	public function update($resource, $data) {
		$json = false;
		$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
		if (array_key_exists($resource, $fs)) {
			$fs[$resource]['name'] = $data->name;
			$fs[$resource]['mod'] = $data->mod;
			$fs[$resource]['parId'] = $data->parId;

			$_SESSION['rfe'][$this->getRoot()] = serialize($fs);
			$json = json_encode($fs[$resource], JSON_NUMERIC_CHECK);
		}
		return $json;
	}
	
	/**
	 * Create item located at resource.
	 * @param string $resource REST resource
	 * @param object $data request data
	 * @return string|bool json or false resource location or false
	 */
	public function create($resource, $data) {
		$json = false;
		if (count($this->fsDefault) <= $this->numItemLimit) {
			// number of items in filesystem is limited
			// TODO: raise error instead of $json = false
			$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
			$id = '/'.$this->getId();
			$item = array(
				'id' => $id,
				'parId' => $data->parId,
				'name' => $data->name,
				'mod' => $data->mod,
				'size' => 0,
			);
			if (property_exists($data, 'dir')) {
				$item['dir'] = true;
			}
			$fs[$id] = $item;
			$_SESSION['rfe'][$this->getRoot()] = serialize($fs);
			$json = json_encode($item, JSON_NUMERIC_CHECK);
		}
		return $json;
	}
	
	/**
	 * Delete resource from filesystem.
	 * @param string $resource REST resource
	 * @return string|bool json or false
	 */
	public function del($resource) {
		$json = false;
		$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
		if (array_key_exists($resource, $fs)) {
			// if $item has children, delete all children too
			if (array_key_exists('dir', $fs[$resource])) {
				for ($i = 0, $len = count($fs); $i < $len; $i++) {
					if (isset($fs[$i]['parId']) && $fs[$i]['parId'] == $resource) {
						unset($fs[$i]);
					}
				}
			}
			unset($fs[$resource]);
			$_SESSION['rfe'][$this->getRoot()] = serialize($fs);
			$json = '[{"msg": "item deleted"}]';
		}
		return $json;
	}

	/**
	 * Returns a new unused id to use as a resource.
	 * @return integer
	 */
	private function getId() {
		return $_SESSION['rfe']['lastUsedItemId']++;
	}

	/**
	 * Search files system array for keyword(s) in name.
	 * @param $keyword
	 * @param $start
	 * @param $end
	 * @return string json
	 */
	public function search($keyword, $start, $end) {
		// this would be slow on large arrays, but since the demo arrays are short it doesn't matter
		$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
		$arr = array();
		$count = 0;
		if ($keyword === '') {
			foreach($fs as $file) {
				if ($count >= $start && $count <= $end) {
					$file['path'] = $this->createPath($fs, $file);
					$arr[] = $file;
				}
				$count++;
			}
		}
		else {
			foreach($fs as $file) {
				if (strpos($file['name'], $keyword) !== false) {
					if ($count >= $start && $count <= $end) {
						$file['path'] = $this->createPath($fs, $file);
						$arr[] = $file;
					}
					$count++;
				}
			}
		}
		return json_encode($arr);
	}

	public function getNumSearchRecords($keyword) {
		// this would be slow on large arrays, but since the array of the demo is short it doesn't matter

		$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
		$keyword = str_replace('*', '', $keyword);
		if ($keyword === '') {
			return count($fs);
		}
		$count = 0;
		foreach($fs as $file) {
			if (strpos($file['name'], $keyword) !== false) {
				$count++;
			}
		}
		return $count;
	}

	public function createPath($fs, $file) {
		$path = '';

		if (!isset($file['parId'])) {
			return $file['id'];
		}

		$parId = $file['parId'];
		while(isset($fs[$parId])) {
			$path = $fs[$parId]['id'].'/'.$path;
			$parId = isset($fs[$parId]['parId']) ? $fs[$parId]['parId'] : null;
		}
		return $path.$file['id'];
	}
}