<?php

/**
 * This is a WAMP (http://wamp-proto.org/) based PHPDebugConsole client
 *
 * Server-side PHP code publishes debug messages...
 * This client subscribes to those messages and displays them here
 *
 * This is useful for debugging
 *     console applications
 *     AJAX calls
 *     any web request where outputting debug information will affect the layout of the page
 */

namespace bdk\Debug;

use bdk\Debug;
use bdk\Debug\Plugin\Highlight;

/**
 * PHPDebugConsole WAMP plugin client
 */
class WampClient
{
    protected $cfg = array();
    protected $debug;
    protected $request;

    /**
     * Constructor
     *
     * @param Debug $debug debug instance
     * @param array $cfg   config opts
     */
    public function __construct(Debug $debug, $cfg = array())
    {
        $this->debug = $debug;
        $this->request = $debug->serverRequest;
        $this->cfg = \array_merge(array(
            'jquery' => '//ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js',
            'bootstrapCss' => '//cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
            'bootstrapJs' => '//cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
            'filepathScript' => __DIR__ . '/js/main.min.js',
        ), $cfg);
        $this->debug->addPlugin(new Highlight());
    }

    /**
     * Output html or script
     *
     * @return void
     */
    public function handleRequest()
    {
        $query = $this->request->getQueryParams();
        $action = isset($query['action'])
            ? $query['action']
            : 'index';
        $method = 'action' . \ucfirst($action);
        if (\method_exists($this, $method) === false) {
            \header('HTTP/1.0 404 Not Found');
            echo '<h1>404</h1>';
            echo '<p><code>action=' . \htmlspecialchars($action) . '</code> isn\'t a thing.</p>';
            return;
        }
        $this->{$method}();
    }

    /**
     * Output HTML
     *
     * @return void
     */
    public function actionIndex()
    {
        \header('Content-Type: text/html');
        echo \preg_replace_callback('/{{\s*([^}]+)\s*}}/', function ($matches) {
            $token = $matches[1];
            return isset($this->cfg[$token])
                ? $this->cfg[$token]
                : '';
        }, \file_get_contents(__DIR__ . '/views/index.html'));
    }

    /**
     * Output charData json
     *
     * @return void
     */
    public function actionCharData()
    {
        \header('Content-Type: application/json');
        echo \json_encode($this->debug->getDump('base')->valDumper->charData);
    }

    /**
     * Output CSS
     *
     * @return void
     */
    public function actionCss()
    {
        \header('Content-Type: text/css');
        echo $this->debug->getRoute('html')->getCss();
        \readfile(__DIR__ . '/css/WampClient.css');
    }

    /**
     * Output Img
     *
     * @return void
     */
    public function actionImg()
    {
        $query = $this->request->getQueryParams();
        $src = isset($query['src']) ?
            $query['src']
            : null;
        $srcSanitized = __DIR__ . '/img/' . \str_replace('..', '', $src);
        if (!$src || \is_file($srcSanitized) === false) {
            \header('HTTP/1.0 404 Not Found');
            return;
        }
        $extension = \strtolower(
            \pathinfo($srcSanitized, PATHINFO_EXTENSION)
        );
        $mimes = array(
            'bmp' => 'image/bmp',
            'gif' => 'image/gif',
            'ico' => 'image/vnd.microsoft.icon',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'svg' => 'image/svg+xml',
            'tif' => 'image/tiff',
            'tiff' => 'image/tiff',
        );
        \header('Content-Type: ' . $mimes[$extension]);
        \header('Content-Disposition: inline; filename="' . \rawurlencode(\basename($srcSanitized)) . '"');
        \header('Content-Length: ' . \filesize($srcSanitized));
        \readfile($srcSanitized);
    }

    /**
     * Output Javascript
     *
     * @return void
     */
    public function actionScript()
    {
        \header('Content-Type: application/javascript');
        echo $this->debug->getRoute('html')->getScript();
        \readfile($this->cfg['filepathScript']);
    }
}
