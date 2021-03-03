const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Pokemons = require("./models/pokemons");

const api = express();

//CONF CORS

api.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    // authorized headers for preflight requests
    // https://developer.mozilla.org/en-US/docs/Glossary/preflight_request
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
    api.options("*", (req, res) => {
        // allowed XHR methods
        res.header(
            "Access-Control-Allow-Methods",
            "GET, PATCH, PUT, POST, DELETE, OPTIONS"
        );
        res.send();
    });
});

//CONF DECODE BODYPARSER

api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: true })); //Decodificamos la informacion del body

// Realizo la conexión con la BBDD
mongoose.connect(
    "mongodb://localhost/pokemonsDB", { useNewUrlParser: true, useUnifiedTopology: true },
    (err, res) => {
        if (err) console.err(err, "Error al conectar con la BBDD");
        else console.log("pokemonsDB conectada");
    }
);

// GET
api.get("/api/pokemons", (request, response) => {
    Pokemons.find((err, data) => {
        if (err) {
            console.error(err);
        } else {
            response.send(data);
        }
    });
});

// POST por parametros "api/pokemons?name=pikachu&type=electrico"
api.post("/api/pokemons", (request, response) => {
    const newPokemon = new Pokemons({
        name: request.body.name,
        type: request.body.type,
    });

    newPokemon.save((err) => {
        if (err) console.error(err);
        else
            response.send({
                success: true,
                message: "pokemon añadido correctamente",
                newPokemon,
            });
    });
});

// GET ONE por nombre
api.get("/api/pokemon/name/:name", (request, response) => {
    Pokemons.findOne({ name: request.params.name }, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            response.send(data);
        }
    });
});

// GET ONE por ID

api.get("/api/pokemons/:id", (request, response) => {
    Pokemons.findById(request.params.id, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            response.send(data);
        }
    });
});

// DELETE

api.delete("/api/pokemons/:name", (request, response) => {
    Pokemons.remove({ name: request.params.name }, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            response.send({
                success: true,
                message: "pokemon eliminado correctamente",
            });
        }
    });
});

// PUT

api.put("/api/pokemons/:id", (request, response) => {
    Pokemons.findByIdAndUpdate(
        request.params.id, { $set: request.body },
        (err, data) => {
            if (err) return response.status(500).send(err.message);
            response.status(201).send({
                success: "true",
                message: "Pokemon actualizado",
                fruta: data,
            });
        }
    );
});

// PAGINADO POR PARAMS

api.get("/api/pokemons/page/:page", (request, response) => {
    fs.readFile("db/dbPokemon.json", (err, data) => {
        if (err) throw err; //Elevar o notificar una excepcion
        const allPokemon = JSON.parse(data); // Parseamos el contenido del fichero a formato JSON
        const PAGE_SIZE = 5;
        const page = request.params.page;
        const initPage = Math.abs(page) * PAGE_SIZE - PAGE_SIZE;
        const endPage = Math.abs(page) * PAGE_SIZE;

        const pagePokemon = allPokemon.slice(initPage, endPage);

        const totalPages = Math.ceil(allPokemon.length / PAGE_SIZE);

        response.status(200).send({
            success: true,
            message: "/api/pokemons",
            method: "GET",
            totalPages: totalPages,
            page: page,
            pagePokemon: pagePokemon,
        });
    });
});

// PAGINADO CON LIMIT Y OFFSET

api.get("/api/pokemon/pageoffset", (request, response) => {
    fs.readFile("db/dbPokemon.json", (err, data) => {
        if (err) throw err; //Elevar o notificar una excepcion
        const allPokemon = JSON.parse(data); // Parseamos el contenido del fichero a formato JSON
        const limit = Number.parseInt(request.query.limit);
        const offset = Number.parseInt(request.query.offset);

        const pagePokemon = allPokemon.slice(offset, offset + limit);

        response.status(200).send({
            success: true,
            message: "/api/pokemons",
            method: "GET",
            pagePokemon: pagePokemon,
        });
    });
});

// LOCATION

api.get("/api/pokemons/:id/locations/:locationId", (request, response) => {
    fs.readFile("db/dbPokemon.json", (err, data) => {
        if (err) throw err;
        const allPokemon = JSON.parse(data);

        if (request.params.id > allPokemon.length) {
            response.status(400).send({
                success: false,
                method: "GET",
                message: "Pokemon not found",
            });
        } else {
            const onePokemon = {
                id: Number.parseInt(request.params.id),
            };

            const searchPokemon = allPokemon.find(
                (pokemon) => pokemon.id === onePokemon.id
            );
            // puedo hacer aqui el if en el caso de que searchPokemon sea undefined.
            const locationPokemon = searchPokemon.locations;

            if (request.params.locationId > locationPokemon.length) {
                response.status(400).send({
                    success: false,
                    method: "GET",
                    message: "Location not found",
                });
            } else {
                const oneLocation = {
                    id: Number.parseInt(request.params.locationId),
                };

                const searchLocation = locationPokemon.find(
                    (location) => location.id === oneLocation.id
                );

                response.status(200).send({
                    success: true,
                    message: "/api/pokemons",
                    method: "GET",
                    location: searchLocation,
                });
            }
        }
    });
});

api.listen(1010, () => {
    console.log("POKEAPI corriendo en puerto 1010");
});