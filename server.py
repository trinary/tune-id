import http.server
import functools

server_class = http.server.HTTPServer
handler_class = http.server.SimpleHTTPRequestHandler
address = ('', 3000)
handler_class.extensions_map['.js'] = 'text/javascript'
handler = functools.partial(handler_class, directory='dist')
httpd = server_class(address, handler)

httpd.serve_forever()
