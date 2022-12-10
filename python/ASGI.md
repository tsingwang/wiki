# ASGI (Asynchronous Server Gateway Interface)

相比 WSGI，除了支持 HTTP/1.0, HTTP/1.1, 还支持 HTTP/2, WebSocket

- asynchronous callable
- `scope`: 字典，一定包含一个名为 `type` 的key，表示协议
- `receive`: awaitable callable，接受客户端新消息
- `send`: awaitable callable，发送响应

```python
async def application(scope, receive, send):
    print(scope)
    event = await receive()
    print(event)
    await send({
        'type': 'http.response.start',
        'status': 200,
        'headers': [
            [b'content-type', b'text/plain'],
        ]
    })
    await send({
        'type': 'http.response.body',
        'body': b'Hello, world!',
    })

# pip install uvicorn
# uvicorn module:application
```

## HTTP

### HTTP Connection Scope
- `type`: `http`
- `http_version`: "1.0", "1.1" or "2"
- `method`: The HTTP method name, uppercased.
- `scheme`: "http" or "https"
- `path`:
- `query_string`:
- `headers`:
- ...

### Request - `receive` event
- `type`: `http.request`
- `body`: byte string
- `more_body`: bool, True表示body没发完，应用需要等到False为止

### Response Start - `send` event
- `type`: `http.response.start`
- `status`: int, HTTP status code
- `headers`: Iterable[[byte string, byte string]]

### Response Body - `send` event
- `type`: `http.response.body`
- `body`: byte string
- `more_body`: bool, True表示body没发完，服务器需要等到False为止

### Disconnect - `receive` event
- `type`: `http.disconnect`

## WebSocket

### Websocket Connection Scope
- `type`: `websocket`
- `http_version`: "1.1" or "2"
- `scheme`: "ws" or "wss"
- `path`:
- `query_string`:
- `headers`:
- ...

### Connect - `receive` event
握手，应用在接受 `websocket.receive` 消息之前必须响应 Accept 或 Close 消息，否则403
- `type`: `websocket.connect`

### Accept - `send` event
- `type`: `websocket.accept`
- `headers`

### Receive - `receive` event
`bytes` 和 `text` 至少有一个不为空
- `type`: `websocket.receive`
- `bytes`: byte string
- `text`: Unicode string

### Send - `send` event
`bytes` 和 `text` 至少有一个不为空
- `type`: `websocket.send`
- `bytes`: byte string
- `text`: Unicode string

### Disconnect - `receive` event
- `type`: `websocket.disconnect`
- `code`: int, The WebSocket close code, 默认1005

### Close - `send` event
如果是在握手阶段，发送，则为403
- `type`: `websocket.close`
- `code`: int, The WebSocket close code, 默认1000
- `reason`: string, 可以是任何内容
