# Forward proxy

Simple forward proxy which logs request time to statsd

## For http

```bash
export http_proxy=http://localhost:80
curl https://httpbin.org/headers -i
```

## For ssl


```bash
export https_proxy=https://localhost:443
curl https://httpbin.org/headers -i --proxy-insecure
```
