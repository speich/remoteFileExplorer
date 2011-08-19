<?php
/**
 * 
 * @author Simon Speich
 */

abstract class FileExplorer {
		
	/**
	 * Set the root dir.
	 * @param string $rootDir
	 */
	public function __construct($rootDir) {
		$this->rootDir = $rootDir;
	}
	
	/**
	 * REST GET
	 * @param string $resource REST resource
	 */
	abstract public function get($resource);
	
	/**
	 * REST POST
	 * @param string $resource REST resource
	 * @param object $data request data
	 */
	abstract public function create($resource, $data);
	
	/**
	 * REST PUT
	 * @param string $resource REST resource
	 * @param object $data request data
	 */
	abstract public function update($resource, $data);
	
	/**
	 * REST DELETE
	 * @param string $resource REST resource
	 */
	abstract public function delete($resource);
	
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
}

?>