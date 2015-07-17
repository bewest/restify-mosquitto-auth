
var restify = require('restify');

function createServer (opts) {

  var server = restify.createServer(opts);

  var ACC = {
    '2': 'pub'
  , '1': 'sub'
  };

  function setup (req, res, next) {
    console.log('BODY', req.body);
    console.log('PARAMS', req.params);
    req.grant = {
      username: req.params.username
    , password: req.params.password
    , topic: req.params.topic
    , acc: req.params.acc
    , type: ACC[req.params.acc]
    };
    res.payload = { allowed: null };
    next( );
  }

  function authenticate (req, res, next) {
    // look up username and password in db
    // if (found) { res.payload.allowed = true; }
    // allow all for now
    res.payload.allowed = true;
    next( );
  }

  function superuser (req, res, next) {
    // TODO: later
    next( );
  }

  function authorize (req, res, next) {
    // can the username type to topic?
    var patterns = [null, '/downloads/','downloads/' ];
    var prefix = "/downloads/";
    var pieces = req.grant.topic.split(req.grant.username);
    console.log('considering authorizing topic', req.grant, pieces);
    if (patterns.indexOf(pieces[0]) > 0) {
      res.payload.allowed = true;
      res.payload.grant = req.grant;
    }
    next( );
  }

  function answer (req, res, next) {
    if (res.payload && res.payload.allowed) {
      res.send(200, res.payload);
      return next( );
    }
    res.send(418, res.payload);
    next( );
  }

  // server.use(restify.acceptParser(server.acceptable));
  server.use(restify.dateParser());
  server.use(restify.queryParser());
  server.use(restify.jsonp());
  server.use(restify.gzipResponse());
  server.use(restify.bodyParser());

  server.post('/auth',
    setup, authenticate, answer);
  server.post('/superuser',
    setup, superuser, answer);
  server.post('/acl',
    setup, authorize, answer);

  return server;

}

exports = module.exports = createServer;

if (!module.parent) {

  var envs = {
    port: process.env.PORT || 4040
  , mongo: process.env.MONGO || 'mongodb://localhost/drywall'
  , mqtt_collection: process.env.MQTT_COLLECTION || 'sites'
  };

  var opts = {
  };

  var server = createServer(opts);
  server.listen(envs.port, function ( ) {
    console.log('listening on', server.address( ), envs);
  });

}

