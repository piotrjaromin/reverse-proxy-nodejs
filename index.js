'use strict';

const fs = require('fs');
const sslConnectHandlerFactory = require('./lib/https-connect-handler');
const httpHandlerFactory = require('./lib/http-handler');

const logger = require('simple-node-logger').createSimpleLogger();
logger.setLevel('debug');

const CircuitBreakerFactory = require('@bennadel/circuit-breaker').CircuitBreakerFactory;
const circuitBreaker = CircuitBreakerFactory.create();

const SDC = require('statsd-client');
const sdc = new SDC({
    host: process.env.STATSD_HOST || 'localhost',
    port: process.env.STATSD_PORT || 8125
});

const optsSsl = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem')
};

const opts = {
    timeout: 5000,
    metricsPrefix: 'test' || process.env.METRICS_PREFIX
}

const httpHandler = httpHandlerFactory.create(logger, opts, sdc, circuitBreaker);
const sslConnectHandler = sslConnectHandlerFactory.create(logger, opts, sdc, circuitBreaker);

function startServer(proto, port, opts) {
    let srv;
    if (opts) {
        srv = proto.createServer(opts, httpHandler.handler);
    } else {
        srv = proto.createServer(httpHandler.handler);
    }

    srv.listen(port);
    return srv;
}

// Start http and https
startServer(require('http'), 80);
const httpsSrv = startServer(require('https'), 443, optsSsl);
httpsSrv.on('connect', sslConnectHandler.handler);

logger.info('server started');