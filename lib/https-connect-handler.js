'use strict';

const net = require('net');
const regex_hostport = /^([^:]+)(:([0-9]+))?$/;

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


module.exports.create = function(opts){

    const handler = function(req, socket, head){
        var hostPort = getHostPortFromString(req.url, 443);
        var hostDomain = hostPort[0];
        var port = parseInt(hostPort[1]);
        console.log("Proxying HTTPS request for:", hostDomain, port);

        var proxySocket = new net.Socket();
        proxySocket.connect(port, hostDomain, function () {
            proxySocket.write(head);
            socket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
        });

        proxySocket.on('data', function (chunk) {
            socket.write(chunk);
        });

        proxySocket.on('end', function () {
            socket.end();
        });

        proxySocket.on('error', function () {
            socket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
            socket.end();
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
        sslConnectHandler: handler,
    }
}