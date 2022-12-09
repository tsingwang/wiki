# WSGI (Web Server Gateway Interface)

WSGI 只是接口定义，一边连着web服务器(nginx)，另一边连着用户的应用。

```
客户端 <-> web服务器(Nginx) <-> WSGI <-> App(Django)
```
WSGI 一层可以换成任意遵循 WSGI 的程序，比如常见的 Gunicorn、uWSGI。  
WSGI 从 webserver 获得 request，封装好，传给WSGI应用执行，返回response。

## WSGI 接口定义

1. 接收两个参数:
  - `environ`: 字典用来表示HTTP请求的信息
  - `start_response`: WSGI提供的回调函数，app用它来发送HTTP状态码和HTTP响应头
2. return HTTP响应体，需要封装为 iterable

```python
# The application interface is a callable object
def application (
    # environ points to a dictionary containing CGI like environment
    # variables which is populated by the server for each
    # received request from the client
    environ,
    # start_response is a callback function supplied by the server
    # to send HTTP status code/message and HTTP headers to the server
    # which takes the HTTP status and headers as arguments
    start_response
):
    response_body = 'Request method: %s' % environ['REQUEST_METHOD']
    status = '200 OK'
    response_headers = [
        ('Content-Type', 'text/plain'),
        ('Content-Length', str(len(response_body)))
    ]

    # Send them to the server using the supplied function
    start_response(status, response_headers)

    # Return the response body. Notice it is wrapped
    # in a list although it could be any iterable.
    #return [response_body]
    # python3 need convert to bytes
    return [response_body.encode()]

if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    httpd = make_server('localhost', 8000, application)
    httpd.serve_forever()
```
