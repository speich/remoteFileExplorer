<?php

namespace remoteFileExplorer;

class FileDisk implements FileSystem
{

    public function get($dir)
    {
        $rootDir = $this->getRoot();
        //  summary:
        //      A function to obtain all the files in a particular directory (file or dir)
        $files = [];
        if ($dir !== '/') {
            $path = $rootDir.'/'.$dir;
        } else {
            $path = $rootDir;
        }
        $dirHandle = opendir($path);
        if ($dirHandle) {
            while ($file = readdir($dirHandle)) {
                if ($file) {
                    if ($file !== '..' && $file !== '.') {
                        $arrFileInfo = $this->createFileInfo($file, $dir, $rootDir);
                        $files[] = $arrFileInfo;
                    }
                }
            }
        }
        closedir($dirHandle);
        // TODO: sort $files so folders appear first
        if ($dir !== '/') {
            return ['id' => $dir, 'name' => $dir, 'dir' => $files];
        }

        return $files;
    }

    public function update($data)
    {
        $rootDir = $this->getRoot();
        if (file_exists($rootDir.$resource)) {
            $oldName = $rootDir.$resource;
            $newName = $rootDir.$data->parent.'/'.$data->name;
            $succ = rename($oldName, $newName);
            if ($succ) {
                $status = 'HTTP/1.1 200 OK';
            } else {
                $status = 'HTTP/1.1 500 Internal Server Error';
            }
        } else {
            $status = 'HTTP/1.1 404 Not Found';
        }

        return $status;
    }

    public function create()
    {
    }

    public function delete($resource)
    {
        $rootDir = $this->getRoot();
        $dir = $rootDir.$resource;
        $iterator = new RecursiveDirectoryIterator($dir);
        foreach (new RecursiveIteratorIterator($iterator, RecursiveIteratorIterator::CHILD_FIRST) as $file) {
            if (!$file->isDot()) {
                if ($file->isDir()) {
                    rmdir($file->getPathname());
                } else {
                    unlink($file->getPathname());
                }
            }
        }
        rmdir($dir);
    }

    public function createFileInfo($file, $dir, $rootDir)
    {
        if ($dir === '/') {
            $id = $file;
            $fullPath = $rootDir.'/'.$id;
        } else {
            $id = $dir.'/'.$file;
            $fullPath = $rootDir.'/'.$id;
        }
        $id = ltrim($id, '/');
        $arr = [];
        $arr['name'] = $file;
        $arr['parent'] = $dir;
        if (!is_dir($fullPath)) {
            $arr['id'] = $id;
        } else {
            $arr['$ref'] = $id;
            $arr['dir'] = true;
        }
        $arr['size'] = filesize($fullPath);

        return $arr;
    }

    public function del($resource)
    {
        // TODO: Implement del() method.
    }

    public function copy($resource, $target)
    {
        // TODO: Implement copy() method.
    }

    public function setRoot($rootDir)
    {
        // TODO: Implement setRoot() method.
    }

    public function getRoot()
    {
        // TODO: Implement getRoot() method.
    }

    function search($keyword, $start, $end)
    {
        // TODO: Implement search() method.
    }

    function getNumSearchRecords($keyword)
    {
        // TODO: Implement getNumSearchRecords() method.
    }
}