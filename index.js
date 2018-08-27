'use strict';

const fs = require('fs');
const { sslConnectHandler } = require('./lib/https-connect-handler').create();
const { httpHandler } = require('./lib/http-handler').create();

const CircuitBreakerFactory = require( "@bennadel/circuit-breaker" ).CircuitBreakerFactory;
const circuitBreaker = CircuitBreakerFactory.create();

const optsSsl = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem')
};


function startServer(proto, port, opts) {
    let srv;
    if (opts) {
        srv = proto.createServer(opts, httpHandler);
    } else {
        srv = proto.createServer(httpHandler);
    }

    srv.listen(port);
    return srv;
}

// Start http and https
startServer(require('http'), 80);
const httpsSrv = startServer(require('https'), 443, optsSsl);
httpsSrv.on('connect', sslConnectHandler);

console.log('server started');