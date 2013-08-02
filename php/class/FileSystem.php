<?php
/**
 * 
 * @author Simon Speich
 */

namespace remoteFileExplorer\fs;

abstract class FileSystem {
		
	/**
	 * Set the root dir.
	 * @param string $rootDir
	 */
	public function __construct($rootDir) {
		$this->rootDir = $rootDir;
	}
	
	/**
	 * Get a resource
	 * @param string $resource REST resource
	 */
	abstract public function get($resource);
	
	/**
	 * Create a new resource.
	 * @param object $data request data
	 */
	abstract public function create($data);
	
	/**
	 * REST PUT
	 * @param string $resource REST resource
	 * @param object $data request data
	 */
	abstract public function update($resource, $data);
	
	/**
	 * Delete a resource
	 * @param string $resource REST resource
	 */
	abstract public function del($resource);

	/**
	 * Copy a resource.
	 * @param string $resource REST resource to copy
	 * @param object $data data to copy
	 */
	abstract public function copy($resource, $data);
	
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