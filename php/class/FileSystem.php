<?php
namespace remoteFileExplorer\fs;

interface FileSystem {

	/**
	 * Get a resource.
	 * @param string $resource REST resource
	 */
	public function get($resource);
	
	/**
	 * Create a new resource.
	 * @param object $data file data
	 */
	public function create($data);
	
	/**
	 * Update a resource.
	 * @param object $data file data
	 */
	public function update($data);
	
	/**
	 * Delete a resource.
	 * @param string $resource REST resource
	 */
	public function del($resource);

	/**
	 * Copy a resource.
	 * @param string $resource
	 * @param string $target
	 */
	public function copy($resource, $target);
	
	/**
	 * Set the root directory.
	 * @param string $rootDir
	 * @return void
	 */
	public function setRoot($rootDir);
	
	/**
	 * Return the root directory.
	 * @return string
	 */
	public function getRoot();

	/**
	 * Search for a resource.
	 * @param string $keyword
	 * @param int $start
	 * @param int $end
	 * @return mixed
	 */
	function search($keyword, $start, $end);

	/**
	 * Return the number of records found for a given search.
	 * @param string $keyword
	 * @return int
	 */
	function getNumSearchRecords($keyword);
}