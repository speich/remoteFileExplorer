<?php

namespace remoteFileExplorer;


use function array_key_exists;
use function count;

class FileSession implements FileSystem
{

    /** @var array define allowed 'database' fields */
    public array $fields = [
        'id',
        'parId',
        'name',
        'size',
        'mod',
        'cre',
        'dir',
        'mime'
    ];

    /** @var int limit number of items that can be in filesystem */
    private int $numItemLimit = 100;

    /**
     * Array storing the file system (fsArray).
     * Provides a default file system prefilled with some files and folders.
     * Note: References ($ref) never start with a slash since this would overwrite the JsonRestStore's target
     * and send the GET as www.mysite.ch/resource instead of www.mysite.ch/target/resource
     * @var array
     */
    private array $fsDefault = [];

    private string $rootDir;

    /**
     * Instantiates the session based filesystem.
     * The string root dir is used as the session name.
     * @param string $rootDir
     * @param array $data
     */
    public function __construct(string $rootDir, array $data)
    {
        $this->rootDir = $rootDir;
        if (!isset($_SESSION['rfe'])) {
            $this->fsDefault = $data;
            $_SESSION['rfe'][$rootDir] = serialize($data);
            $_SESSION['rfe']['lastUsedItemId'] = count($data);    // this is a very simple way which is not very robust // TODO: better way to create an id
        }
    }

    /**
     * Set the root directory.
     * @param string $rootDir
     * @return void
     */
    public function setRoot(string $rootDir): void
    {
        $this->rootDir = $rootDir;
    }

    /**
     * Get root directory
     * @return string
     */
    public function getRoot(): string
    {
        return $this->rootDir;
    }

    /**
     * Reads requested resource from file system array.
     * @param string $resource REST resource
     * @return string|bool json or false item data
     */
    public function get(string $resource): bool|string
    {
        $json = false;
        $fs = unserialize($_SESSION['rfe'][$this->getRoot()], ['allowed_classes' => false]);
        if (str_ends_with($resource, '/')) {   // query for children of $resource
            $json = $this->getChildren(rtrim($resource, '/'), $fs);
        } elseif (array_key_exists($resource, $fs)) { // get item
            $item = $fs[$resource];
            $json = json_encode($item, JSON_NUMERIC_CHECK);
        }
        return $json;
    }

    /**
     * Returns the children of an item (directory).
     * @param string $resource
     * @param array $fs array with files
     * @return string json children data
     */
    public function getChildren(string $resource, $fs): string
    {
        $arr = [];
        foreach ($fs as $row) {
            if (array_key_exists('parId', $row) && $row['parId'] == $resource) {
                $arr[] = $row;
            }
        }
        // sort array to display folders first, then alphabetically
        // Obtain a list of columns for multisort
        if (count($arr) > 0) {
            $dirs = [];
            $names = [];
            foreach ($arr as $key => $row) {
                $dirs[$key] = array_key_exists('dir', $row) ? 'a' : 'b';
                $names[$key] = $row['name'];
            }
            array_multisort($dirs, SORT_ASC, $names, SORT_ASC, $arr);
            $json = json_encode($arr, JSON_NUMERIC_CHECK);
        } else {
            $json = '[]';
        }
        return $json;
    }

    /**
     * Update item.
     * @param object $data item data
     * @return string|bool json or false item data
     */
    public function update(object $data): bool|string
    {
        $json = false;    // no need to raise error if not found. will be reported as resource not found if false
        $fs = unserialize($_SESSION['rfe'][$this->getRoot()], ['allowed_classes' => false]);
        if (array_key_exists($data->id, $fs)) {
            foreach ($data as $prop => $val) {
                $fs[$data->id][$prop] = $val;
            }
            $fs[$data->id]['mod'] = time() * 1000;
            $_SESSION['rfe'][$this->getRoot()] = serialize($fs);
            $json = json_encode($fs[$data->id], JSON_NUMERIC_CHECK);
        }
        return $json;
    }

    /**
     * Copy given resource.
     * parentId property of data is assumed to already be set to new target location.
     * @param string $resource
     * @param string $target
     * @return string|bool json or false item data
     */
    public function copy(string $resource, string $target): bool|string
    {
        $json = false;
        $fs = unserialize($_SESSION['rfe'][$this->getRoot()], ['allowed_classes' => false]);

        if (array_key_exists($resource, $fs)) {

            // number of items in filesystem is limited in demo
            if (count($fs) <= $this->numItemLimit) {
                foreach ($fs[$resource] as $key => $value) {
                    $item[$key] = $value;
                }
                $id = $this->getId();
                $item['id'] = $id;
                $item['parId'] = $target;
                $item['cre'] = time() * 1000;
                $item['mod'] = time() * 1000;
                $fs[$id] = $item;

                if (array_key_exists('dir', $fs[$resource])) {
                    // todo: how do we know we succeeded in copying all children?
                    $fs = $this->copyChildren($resource, $id, $fs);
                }

                $json = json_encode($item, JSON_NUMERIC_CHECK);
            } else {
                trigger_error('limit of number of files in demo reached');
            }
        }
        $_SESSION['rfe'][$this->getRoot()] = serialize($fs);

        return $json;
    }

    /**
     * Create a new item.
     * @param object $data request data
     * @return string|bool json or false item data
     */
    public function create(object $data): bool|string
    {
        $json = false;
        if (count($this->fsDefault) <= $this->numItemLimit) {
            // number of items in filesystem is limited in demo
            // TODO: raise error instead of $json = false
            $fs = unserialize($_SESSION['rfe'][$this->getRoot()], ['allowed_classes' => false]);

            foreach ($data as $property => $value) {
                $item[$property] = $value;
            }
            if (property_exists($data, 'dir')) {
                $item['dir'] = true;
            }
            $id = $this->getId();
            $date = time() * 1000;
            $item['id'] = $id;
            $item['cre'] = $date;
            $item['mod'] = $date;
            $fs[$id] = $item;
            $_SESSION['rfe'][$this->getRoot()] = serialize($fs);
            $json = json_encode($item, JSON_NUMERIC_CHECK);
        }
        return $json;
    }

    /**
     * Delete resource from filesystem.
     * @param string $resource REST resource
     * @return string|bool json or false message
     */
    public function del(string $resource): bool|string
    {
        $json = false;
        $fs = unserialize($_SESSION['rfe'][$this->getRoot()], ['allowed_classes' => false]);
        if (array_key_exists($resource, $fs)) {
            // if $item has children, delete all children too
            if (array_key_exists('dir', $fs[$resource])) {
                foreach ($fs as $key => $file) {
                    if (isset($file['parId']) && $file['parId'] == $resource) {
                        unset($fs[$key]);
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
     * @return int|string
     */
    private function getId(): int|string
    {
        return '/'.($_SESSION['rfe']['lastUsedItemId']++);
    }

    /**
     * Search files system array for keyword(s) in name.
     * @param string $keyword
     * @param int $start
     * @param int $end
     * @return string json search data
     */
    public function search(string $keyword, int $start, int $end): string
    {
        // this would be slow on large arrays, but since the demo arrays are short it doesn't matter
        $fs = unserialize($_SESSION['rfe'][$this->getRoot()], ['allowed_classes' => false]);
        $arr = [];
        $count = 0;
        if ($keyword === '') {
            foreach ($fs as $file) {
                if ($count >= $start && $count <= $end) {
                    $file['path'] = $this->createPath($fs, $file);
                    $arr[] = $file;
                }
                $count++;
            }
        } else {
            foreach ($fs as $file) {
                if (stripos($file['name'], $keyword) !== false) {
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

    /**
     * Return the number of items found for provided keyword.
     * @param string $keyword
     * @return int
     */
    public function getNumSearchRecords($keyword): int
    {
        // this would be slow on large arrays, but since the array of the demo is short it doesn't matter

        $fs = unserialize($_SESSION['rfe'][$this->getRoot()], ['allowed_classes' => false]);
        $keyword = str_replace('*', '', $keyword);
        if ($keyword === '') {
            return count($fs);
        }
        $count = 0;
        foreach ($fs as $file) {
            if (stripos($file['name'], $keyword) !== false) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * Create a path containing all parents of an item.
     * @param $fs
     * @param $file
     * @return string path
     */
    public function createPath($fs, $file): string
    {
        $path = '';

        if (!isset($file['parId'])) {
            return $file['id'];
        }

        $parId = $file['parId'];
        while (isset($fs[$parId])) {
            $path = $fs[$parId]['id'].'/'.$path;
            $parId = isset($fs[$parId]['parId']) ? $fs[$parId]['parId'] : null;
        }
        return $path.$file['id'];
    }

    /**
     * Recursively copy all children of a resource.
     * @param string $resource
     * @param string $target
     * @param array $fs file system
     * @return array file system
     */
    protected function copyChildren($resource, $target, $fs): array
    {
        foreach ($fs as $row) {
            if (count($fs) <= $this->numItemLimit) {
                if (array_key_exists('parId', $row) && $row['parId'] == $resource) {
                    $item = [];
                    foreach ($row as $key => $value) {
                        $item[$key] = $value;
                    }
                    $id = $this->getId();
                    $item['id'] = $id;
                    $item['parId'] = $target;
                    $item['mod'] = time() * 1000;
                    $fs[$id] = $item;

                    if (array_key_exists('dir', $row)) {
                        $fs = $this->copyChildren($row['id'], $id, $fs);
                    }
                }
            } else {
                trigger_error('limit of number of files in demo reached');
            }
        }

        return $fs;
    }
}