'use strict';

const METHODS_WITH_BODY = ['PUT', 'PATCH', 'POST'];
const urlParse = require('url');
const axios = require('axios');

module.exports.create = function(logger, opts, sdc) {

    const handler = (proxyReq, proxyRes) => {

        const url = urlParse.parse(proxyReq.url, true);
        const reqOpts = {
            url: `${url.href}`,
            method: proxyReq.method,
            headers: { ...proxyReq.headers },
            timeout: opts.timeout
        }

        logger.debug('http options are ', reqOpts)
        if ( METHODS_WITH_BODY.includes(reqOpts.data) ) {
            reqOpts.data = proxyReq.data;
        }

        console.log(`${opts.metricsPrefix}.${url.hostname}`);

        const timer = new Date();
        axios(reqOpts)
            .then( resp => {
                proxyRes.end(JSON.stringify(resp.data));
                sdc.timing(`${opts.metricsPrefix}.${url.hostname}`, timer)
            }).catch( err => {
                logger.error('http error', err);
                proxyRes.writeHead(503)
                proxyRes.end(JSON.stringify(err.message));
                sdc.timing(`${opts.metricsPrefix}.${url.hostname}`, timer)
            });
    }

    return {
        handler,
    }
}