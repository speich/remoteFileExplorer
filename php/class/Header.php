<?php

namespace WebsiteTemplate;

/**
 * Helper class to work with HTTP headers.
 */
class Header
{
    /** @var string $contentType header default MIME type set to text/html */
    private $contentType = 'text/html';

    /** @var string $charset default character set set to utf-8 */
    private $charset = 'utf-8';

    /** @var array contains additional response headers */
    private $headers = [];

    /** @var array $contentTypes MIME types lookup */
    private $contentTypes = [
        'text' => 'text/plain',
        'csv' => 'text/csv',
        'json' => 'application/json',
        'pdf' => 'application/pdf',
        'html' => 'text/html',
        'svg' => 'image/svg+xml',
    ];

    /**
     * Set the MIME type of the header.
     * Abbreviations can be used instead of full MIME type for some content types.
     * @param string $contentType
     */
    public function setContentType($contentType): void
    {
        $contentType = \array_key_exists($contentType, $this->contentTypes) ? $this->contentTypes[$contentType] : $contentType;
        $this->contentType = $contentType;
    }

    /**
     * Returns the content type (MIME type).
     * @return string
     */
    public function getContentType(): string
    {
        return $this->contentType;
    }

    /**
     * Extracts the range start and end from the header.
     * Returns an array with start and end key or null if range header is not sent.
     * @return array|null
     */
    public function getRange(): ?array
    {
        if (isset($_SERVER['HTTP_RANGE'])) {
            $arr = explode('-', substr($_SERVER['HTTP_RANGE'], 6)); // e.g. items=0-24

            return ['start' => $arr[0], 'end' => $arr[1]];
        }

        return null;
    }

    /**
     * Creates the range header.
     * Returns an array where the first item ist the name of the range header and second the value.
     * Note: Uses items instead of bytes as the ranges-specifier to work with dstore
     * @param array $arrRange array containing start and end
     * @param int $numRec total number of items
     * @return array
     */
    public function createRange($arrRange, $numRec): array
    {
        $end = $arrRange['end'] > $numRec ? $numRec : $arrRange['end'];

        return ['Content-Range', 'items='.$arrRange['start'].'-'.$end.'/'.$numRec];
    }

    /**
     * Returns the character set
     * @return string
     */
    public function getCharset(): string
    {
        return $this->charset;
    }

    /**
     * @param string $charset
     */
    public function setCharset($charset): void
    {
        $this->charset = $charset;
    }

    /**
     * Add a header to the headers array.
     * Note: Header with same name will be overwritten no matter its case
     * @param $name
     * @param $value
     */
    public function add($name, $value): void
    {
        // ARRAY_FILTER_USE_KEY is only available in php5.6+
        /*
        $this->headers = array_filter($this->headers, function ($key, $name) {
            return strtolower($key) !== strtolower($name);
        }, ARRAY_FILTER_USE_KEY);
        */
        $keys = array_keys($this->headers);
        for ($i = 0, $iMax = \count($this->headers); $i < $iMax; $i++) {
            if (strtolower($keys[$i]) === strtolower($name)) {
                unset($this->headers[$keys[$i]]);
            }
        }
        $this->headers[$name] = $value;
    }

    /**
     * Set header disposition to attachment forcing browser to offer download dialog.
     * Note: Content type has to be set separately.
     * @param string $fileName file path
     * @param string $fileExtension
     */
    public function addDownload($fileName, $fileExtension): void
    {
        $this->add('Expires', 0);
        $this->add('Cache-Control', 'must-revalidate, post-check=0, pre-check=0');
        $this->add('Content-Disposition', 'attachment; filename="'.$fileName.'.'.$fileExtension.'"');
    }

    /**
     * Returns the array containing the headers.
     * @return array
     */
    public function get(): array
    {
        return $this->headers;
    }

    /**
     * Enable CORS for the passed origins.
     * Adds the Access-Control-Allow-Origin header to the response with the origin that matched the one in the request.
     * @param array $origins
     * @return string|null returns the matched origin or null
     */
    public function allowOrigins($origins): ?string
    {
        $val = $_SERVER['HTTP_ORIGIN'] ?? null;
        if (\in_array($val, $origins, true)) {
            $this->add('Access-Control-Allow-Origin', $val);
            $this->add('Vary', 'Origin');

            return $val;
        }

        return null;
    }
}