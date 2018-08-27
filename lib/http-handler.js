'use strict';

const METHODS_WITH_BODY = ['PUT', 'PATCH', 'POST'];
const urlParse = require('url');
const axios = require('axios');

module.exports.create = function(opts) {

    const handler = (proxyReq, proxyRes) => {

        const url = urlParse.parse(proxyReq.url, true);

        const opts = {
            url: `${url.href}`,
            method: proxyReq.method,
            headers: { ...proxyReq.headers },
            timeout: 10000
        }

        if ( METHODS_WITH_BODY.includes(opts.data) ) {
            opts.data = proxyReq.data;
        }

        axios(opts)
            .then( resp => {
                proxyRes.end(JSON.stringify(resp.data));
                console.log('ok');
            }).catch( err => {
                console.log('got error', err);
                proxyRes.writeHead(503)
                proxyRes.end(JSON.stringify(err.message));
            });
    }

    return {
        httpHandler: handler,
    }
}