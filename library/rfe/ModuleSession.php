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
	private $fsDefault = array(
		'root' => array('id' => 'root', 'name' => 'web root', 'size' => 0, 'mod' => '21.03.2010', 'dir' => true),

		1 => array('id' => 1, 'parId' => 'root', 'name' => 'folder 1', 'size' => 0, 'mod' => '21.03.2010', 'dir' => true),
		2 => array('id' => 2, 'parId' => 'root', 'name' => 'folder 2', 'size' => 0, 'mod' => '23.03.2010', 'dir' => true),
		24 => array('id' => 24, 'parId' => 'root', 'name' => 'folder 3', 'size' => 0, 'mod' => '23.03.2010', 'dir' => true),
		3 => array('id' => 3, 'parId' => 'root', 'name' => 'texts', 'size' => 0, 'mod' => '20.04.2010', 'dir' => true),
		4 => array('id' => 4, 'parId' => 'root', 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),
		5 => array('id' => 5, 'parId' => 'root', 'name' => 'fenalet.jpg', 'size' => 321, 'mod' => '09.10.2002'),

		6 => array('id' => 6, 'parId' => 1, 'name' => 'photo01.jpg', 'size' => 129631, 'mod' => '27.03.2010'),
		7 => array('id' => 7, 'parId' => 1, 'name' => 'photo02.jpg', 'size' => 29634, 'mod' => '27.03.2010'),
		8 => array('id' => 8, 'parId' => 1, 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),
		26 => array('id' => 26, 'parId' => 1, 'name' => 'photo01.jpg', 'size' => 129631, 'mod' => '27.03.2010'),
		27 => array('id' => 27, 'parId' => 1, 'name' => 'photo02.jpg', 'size' => 29634, 'mod' => '27.03.2010'),
		28 => array('id' => 28, 'parId' => 1, 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),
		29 => array('id' => 29, 'parId' => 1, 'name' => 'photo01.jpg', 'size' => 129631, 'mod' => '27.03.2010'),
		30 => array('id' => 30, 'parId' => 1, 'name' => 'photo02.jpg', 'size' => 29634, 'mod' => '27.03.2010'),
		31 => array('id' => 31, 'parId' => 1, 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),
		32 => array('id' => 32, 'parId' => 1, 'name' => 'photo01.jpg', 'size' => 129631, 'mod' => '27.03.2010'),
		33 => array('id' => 33, 'parId' => 1, 'name' => 'photo02.jpg', 'size' => 29634, 'mod' => '27.03.2010'),
		34 => array('id' => 34, 'parId' => 1, 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),
		35 => array('id' => 35, 'parId' => 1, 'name' => 'photo01.jpg', 'size' => 129631, 'mod' => '27.03.2010'),
		36 => array('id' => 36, 'parId' => 1, 'name' => 'photo02.jpg', 'size' => 29634, 'mod' => '27.03.2010'),
		37 => array('id' => 37, 'parId' => 1, 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),
		38 => array('id' => 38, 'parId' => 1, 'name' => 'photo01.jpg', 'size' => 129631, 'mod' => '27.03.2010'),
		39 => array('id' => 39, 'parId' => 1, 'name' => 'photo02.jpg', 'size' => 29634, 'mod' => '27.03.2010'),
		40 => array('id' => 40, 'parId' => 1, 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),
		41 => array('id' => 41, 'parId' => 1, 'name' => 'photo01.jpg', 'size' => 129631, 'mod' => '27.03.2010'),
		42 => array('id' => 42, 'parId' => 1, 'name' => 'photo02.jpg', 'size' => 29634, 'mod' => '27.03.2010'),
		43 => array('id' => 43, 'parId' => 1, 'name' => 'photo03.jpg', 'size' => 79308, 'mod' => '27.07.2009'),

		9 => array('id' => 9, 'parId' => 2, 'name' => 'subfolder 21', 'size' => 0, 'mod' => '27.03.2010', 'dir' => true),
		10 => array('id' => 10, 'parId' => 2, 'name' => 'file5.txt', 'size' => 1631, 'mod' => '06.11.1973'),
		11 => array('id' => 11, 'parId' => 2, 'name' => 'file1.txt', 'size' => 9638, 'mod' => '27.01.2010'),
		12 => array('id' => 12, 'parId' => 2, 'name' => 'subfolder 22', 'size' => 0, 'mod' => '27.03.2010', 'dir' => true),
		25 => array('id' => 25, 'parId' => 2, 'name' => 'test dnd 1', 'size' => 1631, 'mod' => '06.11.1973'),
		44 => array('id' => 44, 'parId' => 2, 'name' => 'test dnd 2', 'size' => 9638, 'mod' => '27.01.2010'),

		13 => array('id' => 13, 'parId' => 3, 'name' => 'file3.pdf', 'size' => 8923, 'mod' => '27.03.2001'),
		14 => array('id' => 14, 'parId' => 3, 'name' => 'file1.pdf', 'size' => 8925, 'mod' => '13.02.2002'),
		15 => array('id' => 15, 'parId' => 3, 'name' => 'file2.pdf', 'size' => 8923, 'mod' => '01.03.2003'),

		16 => array('id' => 16, 'parId' => 9, 'name' => 'test 21', 'size' => 30, 'mod' => '27.03.2010'),
		17 => array('id' => 17, 'parId' => 9, 'name' => 'subfolder 22', 'size' => 0, 'mod' => '21.05.2010', 'dir' => true),

		18 => array('id' => 18, 'parId' => 12, 'name' => 'file4.xls', 'size' => 128923, 'mod' => '27.03.2010'),
		19 => array('id' => 19, 'parId' => 12, 'name' => 'file5.xls', 'size' => 428925, 'mod' => '27.03.2010'),
		20 => array('id' => 20, 'parId' => 12, 'name' => 'file6.xls', 'size' => 448927, 'mod' => '27.03.2010'),

		21 => array('id' => 21, 'parId' => 17, 'name' => 'test.doc', 'size' => 128923, 'mod' => '12.12.2011'),
		22 => array('id' => 22, 'parId' => 17, 'name' => 'some.xls', 'size' => 428925, 'mod' => '17.03.1990'),
		23 => array('id' => 23, 'parId' => 17, 'name' => 'any.xls', 'size' => 448927, 'mod' => '08.03.2010')
	);

	/**
	 * Instantiates the session based filesystem.
	 * The string root dir is used as the session name.
	 * @param string $rootDir
	 */
	public function __construct($rootDir) {
		parent::__construct($rootDir);
//		if (!isset($_SESSION['rfe'])) {
			$_SESSION['rfe'][$rootDir] = serialize($this->fsDefault);
			$_SESSION['rfe']['lastUsedItemId'] = count($this->fsDefault);	// this is a very simple way which is not very robust // TODO: better way to create an id
//		}
	}
	
	/**
	 * Reads requested resource from file system array.
	 * @param string $resource REST resource
	 * @return json|false
	 */
	public function get($resource) {
		$json = false;
		$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
		if (substr($resource, -1) === '/') {   // query for children of $resource
			$json = $this->getChildren(rtrim($resource, '/'), $fs);
		}
		else if (array_key_exists($resource, $fs)) { // get item
			$items = $fs[$resource];
			$json = json_encode($items);
			$json = preg_replace('/"([\d]+)"/', '$1', $json);
		}
		return $json;
	}

	/**
	 * Returns the children of a directory.
	 * @param string $resource
	 * @param array $fs array with files
	 * @return json
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
			$json = json_encode($arr);
			$json = preg_replace('/"([\d]+)"/', '$1', $json);
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
	 * @return json|false
	 */
	public function update($resource, $data) {
		$json = false;
		$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);

		if (array_key_exists($resource, $fs)) {
			$fs[$resource]['name'] = $data->name;
			$fs[$resource]['mode'] = $data->mod;
			$fs[$resource]['parId'] = $data->parId;

			$_SESSION['rfe'][$this->getRoot()] = serialize($fs);
			$json = json_encode($fs[$resource]);
			$json = preg_replace('/"([\d]+)"/', '$1', $json);
		}
		return $json;
	}
	
	/**
	 * Create item located at resource.
	 * @param string $resource REST resource
	 * @param object $data request data
	 * @return json|false resource location or false
	 */
	public function create($resource, $data) {
		$json = false;
		if (count($this->fsDefault) <= $this->numItemLimit) {
			// number of items in filesystem is limited
			// TODO: raise error instead of $json = false
			$fs = unserialize($_SESSION['rfe'][$this->getRoot()]);
			$id = $this->getId(); // $ref/id do not start with a slash
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
			$json = json_encode($item);
			$json = preg_replace('/"([\d]+)"/', '$1', $json);
		}
		return $json;
	}
	
	/**
	 * Delete resource from filesystem.
	 * @param string $resource REST resource
	 * @return json|false
	 */
	public function delete($resource) {
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


}
?>