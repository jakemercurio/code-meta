<?php

namespace StockBlocks\Common\Modules\Api\Controllers;

class ApiResponse {

    protected $response
        , $httpStatusCode
    ;

    public function __construct($response, $httpStatusCode) {
        $this->response = $response;
        $this->httpStatusCode = $httpStatusCode;
    }

    public function getResponse() {
        return $this->response;
    }

    public function getHttpStatusCode() {
        return $this->httpStatusCode;
    }
}
