'use strict';

const net = require('net');
const regex_hostport = /^([^:]+)(:([0-9]+))?$/;
const urlParse = require('url');

function getHostPortFromString(hostString, defaultPort) {
    var host = hostString;
    var port = defaultPort;

    var result = regex_hostport.exec(hostString);
    if (result != null) {
      host = result[1];
      if (result[2] != null) {
        port = result[3];
      }
    }

    return ( [host, port] );
};


module.exports.create = function(logger, opts, sdc){

    const handler = function(req, socket, head){

        var hostPort = getHostPortFromString(req.url, 443);
        var hostDomain = hostPort[0];
        var port = parseInt(hostPort[1]);
        logger.debug(`Proxying HTTPS request for: ${hostDomain}:${port}`);

        const proxySocket = new net.Socket();
        const timer = new Date();
        proxySocket.connect(port, hostDomain, function () {
            proxySocket.write(head);
            socket.write(`HTTP/${req.httpVersion} 200 Connection established\r\n\r\n`);
        });

        proxySocket.on('data', function (chunk) {
            socket.write(chunk);
        });

        proxySocket.on('end', function () {
            socket.end();
            sdc.timing(`${opts.metricsPrefix}.${hostDomain}`, timer)
        });

        proxySocket.on('error', function (err) {
            logger.error("ssl connections error, ", err);
            socket.write(`HTTP/${req.httpVersion} 500 Connection error\r\n\r\n`);
            socket.end();
            sdc.timing(`${opts.metricsPrefix}.${hostDomain}`, timer)
        });

        socket.on('data', function (chunk) {
            proxySocket.write(chunk);
        });

        socket.on('end', function () {
            proxySocket.end();
        });

        socket.on('error', function () {
            proxySocket.end();
        });
    }

    return {
        handler,
    }
}