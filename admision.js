var fs = require("fs");
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var mysql = require('mysql');

// Inicio de la aplicacion
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

// Convierte a SHA1
var getSHA1ofJSON = function(input) {
    return crypto.createHash('sha1')
            .update(JSON.stringify(input))
            .digest('hex');
};

// --------------------------------------------------------------------
// http://localhost:port/admision
// Retorna archivo JSON del archivo dado agregandole el sha del 
// campo titulo 
// --------------------------------------------------------------------
app.get('/admision', function(req, res) {
    console.log("get...");
    var contents = fs.readFileSync("albums.json");
    var albums = JSON.parse(contents);
    var len = albums.length;
    while (len--) {
        var album = albums[len];
        album['hash'] = getSHA1ofJSON(album['title']);
    }

    res.end(JSON.stringify(albums));
});

// --------------------------------------------------------------------
// http://localhost:port/admision
// POST
// Payload { "nombre":"", "apellido" : "", "correo":"" }
// Agrega registro a la tabla persona
// --------------------------------------------------------------------
app.post('/admision', function(req, res) {
    console.log("Posting...");
    var data = req.body;

    if (typeof data !== 'undefined' && data) {
        data = JSON.stringify(req.body);
        var persona = JSON.parse(data);

        // Lee propiedad para la conexion a la BD
        var contents = fs.readFileSync("database.properties.json");
        var dbProperties = JSON.parse(contents);

        var connection = mysql.createConnection({
            host: dbProperties.host,
            user: dbProperties.user,
            password: dbProperties.password,
            database: dbProperties.database
        });

        connection.connect();

        // Inserta datos
        var sql = 'INSERT INTO persona(nombre, apellido, correo) VALUES(?, ?, ?)';
        var datos = [persona.nombre, persona.apellido, persona.correo];
        connection.query(sql, datos, function(err, results) {
            if (!err) {
                console.log('The solution is: ', JSON.stringify(results));
                res.end("OK");
            } else {
                res.end('Error insertando datos' + JSON.stringify(err));
                console.log(err);
            }
        });
        connection.end();
    }
});

// Arranca a escuchar por el puerto dado
app.listen(port);
console.log('Server en ' + port);
