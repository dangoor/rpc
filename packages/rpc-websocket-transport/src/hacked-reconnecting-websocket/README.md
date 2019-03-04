# Broken

The dist build of "reconnecting-websocket" is broken, v4.1.10  installed Mar 3, 2019. It fails to import via
```
import ReconnectingWebSocket from 'reconnecting-websocket';
```

See [95](https://github.com/pladaria/reconnecting-websocket/issues/95) (and other filed issues)  
 

The suggested fix, setting tsconfig compile option `esModuleInterop` breaks current setup for typing declarations.

Using nodejs require works, and tests pass, but rollup ignores it, even with commonjs and resolve plugins.

Importing the source directly works. Doing that for now. 

todo: improve or replace the bundler or build system; or wait for their fix (or help them)  
   
