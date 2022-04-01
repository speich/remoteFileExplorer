<?php

namespace remoteFileExplorer;

interface FileSystem
{

    /**
     * Get a resource.
     * @param string $resource REST resource
     */
    public function get(string $resource);

    /**
     * Create a new resource.
     * @param object $data file data
     */
    public function create(object $data);

    /**
     * Update a resource.
     * @param object $data file data
     */
    public function update(object $data);

    /**
     * Delete a resource.
     * @param string $resource REST resource
     */
    public function del(string $resource);

    /**
     * Copy a resource.
     * @param string $resource
     * @param string $target
     */
    public function copy(string $resource, string $target);

    /**
     * Set the root directory.
     * @param string $rootDir
     * @return void
     */
    public function setRoot(string $rootDir): void;

    /**
     * Return the root directory.
     * @return string
     */
    public function getRoot(): string;

    /**
     * Search for a resource.
     * @param string $keyword
     * @param int $start
     * @param int $end
     * @return mixed
     */
    public function search(string $keyword, int $start, int $end): mixed;

    /**
     * Return the number of records found for a given search.
     * @param string $keyword
     * @return int
     */
    public function getNumSearchRecords($keyword): int;
}