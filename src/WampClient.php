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

    private $mimeTypes = array(
        'bmp' => 'image/bmp',
        'gif' => 'image/gif',
        'ico' => 'image/vnd.microsoft.icon',
        'jpeg' => 'image/jpeg',
        'jpg' => 'image/jpeg',
        'png' => 'image/png',
        'svg' => 'image/svg+xml',
        'tif' => 'image/tiff',
        'tiff' => 'image/tiff',
    );

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
            'bootstrapCss' => '//cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/css/bootstrap.min.css',
            'bootstrapJs' => '//cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/js/bootstrap.bundle.min.js',
            'filepathScript' => __DIR__ . '/js/main.min.js',
        ), $cfg);
        $this->debug->addPlugin(new Highlight());
        $this->debug->i18n->setCfg('domainFilepath', array(
            'wampClient' => __DIR__ . '/lang/{locale}.php',
        ));
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
                : $this->debug->i18n->trans($token, 'wampClient');
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
        \header('Content-Type: ' . $this->mimeTypes[$extension]);
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
        echo '
            phpDebugConsole.setCfg({
                strings: ' . \json_encode($this->javaScriptStrings()) . ',
            });';
        \readfile($this->cfg['filepathScript']);
    }

    private function javaScriptStrings()
    {
        $i18n = $this->debug->i18n;
        return array(
            'object.methods.magic.1' => $i18n->trans('object.methods.magic.1'),
            'object.methods.magic.2' => $i18n->trans('object.methods.magic.2'),
            'object.methods.return-value' => $i18n->trans('object.methods.return-value'),
            'object.methods.static-variables' => $i18n->trans('object.methods.static-variables'),
        );
    }
}
