<?php
/**
 * 
 * @author Simon Speich
 */

namespace remoteFileExplorer\fs;

abstract class FileSystem {

	/** @var array properties of a file object */
	public $fields = array();
		
	/**
	 * Set the root dir.
	 * @param string $rootDir
	 */
	public function __construct($rootDir) {
		$this->rootDir = $rootDir;
	}
	
	/**
	 * Get a resource.
	 * @param string $resource REST resource
	 */
	abstract public function get($resource);
	
	/**
	 * Create a new resource.
	 * @param object $data file data
	 */
	abstract public function create($data);
	
	/**
	 * Update a resource.
	 * @param object $data file data
	 */
	abstract public function update($data);
	
	/**
	 * Delete a resource.
	 * @param string $resource REST resource
	 */
	abstract public function del($resource);

	/**
	 * Copy a resource.
	 * @param string $resource
	 * @param string $target
	 */
	abstract public function copy($resource, $target);
	
	/**
	 * Set the root directory.
	 * @param string $rootDir
	 * @return void
	 */
	public function setRoot($rootDir) {
		$this->rootDir = $rootDir;
	}
	
	/**
	 * Get root directory
	 * @return string
	 */
	public function getRoot() {
		return $this->rootDir;
	}

	/**
	 * Search for a resource.
	 * @param string $keyword
	 * @param int $start
	 * @param int $end
	 * @return mixed
	 */
	abstract function search($keyword, $start, $end);

	/**
	 * Return the number of records found for a given search.
	 * @param string $keyword
	 * @return int
	 */
	abstract function getNumSearchRecords($keyword);
}