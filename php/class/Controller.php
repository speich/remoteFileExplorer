<?php
/**
 * This file contains the class Controller.
 */

namespace WebsiteTemplate;

use stdClass;
use function count;
use function is_array;


/**
 * This class is used as a REST controller.
 * REST resources are transformed into a controller (first path segment) and an array of resources, e.g.:
 * controller.php/administration/user/1 would be stored as
 * $this->controller = 'administration' and $this->resources = array('user', 1);
 */
class Controller
{
    public Error $err;

    /** @var string http protocol */
    private $protocol;

    /** @var string http method */
    private $method;

    /** @var string|array array of path segments */
    private $resources;

    /** @var Header */
    private Header $header;

    /** @var bool respond with 404 resource not found */
    public bool $notFound = false;

    /** @var bool flush buffer every bytes */
    public bool $outputChunked = false;

    /** @var int chunk size for flushing */
    public int $chunkSize = 4096;    // = 1 KB

    /**
     * Constructs the controller instance.
     * @param Header $header
     * @param Error $error
     */
    public function __construct(Header $header, Error $error)
    {
        $this->header = $header;
        $this->protocol = $_SERVER['SERVER_PROTOCOL'];
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->resources = $_SERVER['PATH_INFO'] ?? $this->resources;
        $this->err = $error;
    }

    /**
     * Converts PHP input parameters to an object
     * Object properties correspond with request data
     * @param bool $json handle post data as json
     * @return stdClass |null
     */
    public function getDataAsObject($json = false)
    {
        // Note on types when using json_decode():
        // Values true, false and null are returned as TRUE, FALSE and NULL respectively.
        // NULL is returned if the json cannot be decoded or if the encoded data is deeper than the recursion limit
        $data = null;
        switch ($this->method) {
            case 'POST':
                if ($json) {
                    $data = json_decode(file_get_contents('php://input'), false);
                } else {
                    // note: Make sure you set the correct Content-Type when doing a xhr POST
                    $data = $_POST;
                }
                break;
            case 'PUT':
                $data = $this->getInput($json);
                break;
            case 'GET':
                $data = $_GET;
                break;
            case 'DELETE':
                if ($_SERVER['QUERY_STRING'] !== '') {
                    parse_str($_SERVER['QUERY_STRING'], $data);
                }
                else {
                    $data = $this->getInput($json);
                }
                break;
        }

        if (is_array($data)) {
            $data = count($data) > 0 ? (object)$data : null;
        }

        return $data;
    }

    /**
     * Read php input stream
     * @param bool $json
     * @return object|string mixed
     */
    private function getInput(bool $json)
    {
        $input = file_get_contents('php://input');
        if ($json) {
            $data = json_decode($input, false);
        } else {
            parse_str($input, $data);
        }

        return $data;
    }

    /**
     * Returns the http method, e.g. GET, POST, PUT or DELETE
     * @return null|string
     */
    public function getMethod(): ?string
    {
        return $this->method;
    }

    /**
     * Returns the currently used http protocol./
     * @return null|string
     */
    public function getProtocol(): ?string
    {
        return $this->protocol;
    }

    /**
     * Returns the path split into segments.
     * Contains any client-provided pathname information trailing the actual script filename but preceding the query string.
     * Returns null, if no path information is available. If path is only a slash and $asString is false, an array with and empty string is returned.
     * @param ?bool $asString return a string instead of an array
     * @return array|string|null
     */
    public function getResource(?bool $asString = null)
    {
        $resources = $this->resources;
        if ($resources !== null && $asString !== true) {
            $resources = trim($resources, '/');
            $resources = explode('/', $resources);
        }

        return $resources;
    }

    /**
     * Prints the header section of the HTTP response.
     * Sets the Status Code, Content-Type and additional headers set optionally.
     */
    public function printHeader(): void
    {
        $this->printStatus();
        $headers = $this->header->get();
        $contentType = $this->notFound ? 'text/html' : $this->header->getContentType();
        header('Content-Type: '.$contentType.'; '.$this->header->getCharset());
        foreach ($headers as $key => $value) {
            header($key.': '.$value);
        }
    }

    /**
     * Sets HTTP header status code
     */
    public function printStatus(): void
    {
        $headers = $this->header->get();
        $headers = array_change_key_case($headers);

        // server error
        if (count($this->err->get()) > 0) {
            header($this->getProtocol().' 500 Internal Server Error');
        } // resource not found
        elseif ($this->notFound) {
            header($this->getProtocol().' 404 Not Found');
        } // resource found and processed
        elseif (!\array_key_exists('content-disposition', $headers) && $this->getMethod() === 'POST') {
            // IE/Edge fail to download with status 201
            header($this->getProtocol().' 201 Created');
        } // range response
        elseif (\array_key_exists('content-range', $headers)) {
            header($this->getProtocol().' 206 Partial Content');
        } else {
            header($this->getProtocol().' 200 OK');
        }
    }

    /**
     * Prints the body section of the HTTP response.
     * Prints the body in chunks if outputChunked is set to true.
     * @param string|null $data response body
     */
    public function printBody($data = null): void
    {
        // an error occurred
        if (count($this->err->get()) > 0) {
            if ($this->header->getContentType() === 'application/json') {
                echo $this->err->getAsJson();
            } else {
                echo $this->err->getAsString();
            }
        } // response contains data
        elseif ($data) {
            if ($this->outputChunked) {
                $chunks = str_split($data, $this->chunkSize);
                foreach ($chunks as $chunk) {
                    echo $chunk;
                    ob_flush();
                    flush();
                }
            } else {
                echo $data;
            }
        } // no response, 200 ok only // TODO: should be 204 No Content
        elseif ($this->header->getContentType() === 'application/json') {
            echo '{}';
        }
    }
}