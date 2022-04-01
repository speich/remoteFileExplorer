<?php

namespace remoteFileExplorer;

// TODO: if cache folder is missing created it!

use PDO;
use PDOException;


class CacheStore
{

    /** @var string|null */
    private ?string $dbName = 'cache.sqlite';

    /** @var string|null */
    private ?string $dbPath = '/fs/cache/';

    /** @var null|PDO */
    private ?PDO $db = null;    // holds the PDO database resource

    /**
     * Instantiates the database
     * @param string|null $dbName name of database
     * @param string|null $dbPath path to database
     */
    public function __construct($dbName = null, $dbPath = null)
    {
        if ($dbName !== null && $dbPath !== null) {
            $this->dbName = $dbName;
            $this->dbPath = rtrim($dbPath, '/').'/';
        } else {
            $this->dbPath = __DIR__.'/..'.$this->dbPath;
        }
    }

    /**
     * Connect to the cache database.
     * @return PDO|bool
     */
    public function connect(): PDO|bool|null
    {
        $db = $this->dbPath.$this->dbName;   // depending on the env, docroot has trailing slash or not
        $isCreated = file_exists($db);
        if ($this->db === null) {    // check if not already connected to db
            try {
                $this->db = new PDO('sqlite:'.$db);    // this would create the db if it didn't exist. So we have to check if file exists above
                if (!$isCreated) {
                    $this->createStructure();
                }
            } catch (PDOException $error) {
                return false;
            }
        }

        return $this->db;
    }

    /**
     * Create the database structure with all necessary tables.
     */
    private function createStructure(): void
    {
        $sql = 'CREATE TABLE "cache" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE , "resource" VARCHAR NOT NULL UNIQUE);
				 COMMIT;';
        $this->db->exec($sql);
    }
}