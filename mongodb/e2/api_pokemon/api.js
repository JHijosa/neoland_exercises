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

// DELETE

api.delete("/api/pokemons", (request, response) => {
    if (!request.body.id) {
        response.status(400).send({
            success: false,
            url: "/api/pokemons",
            method: "DELETE",
            message: "id is requied",
        });
    } else {
        fs.readFile("db/dbPokemon.json", (err, data) => {
            if (err) throw err;
            const allPokemon = JSON.parse(data);
            const deletePokemon = {
                id: Number.parseInt(request.body.id),
            };
            const newAllPokemon = allPokemon.filter(
                (pokemon) => pokemon.id !== deletePokemon.id
            );

            fs.writeFile(
                "db/dbPokemon.json",
                JSON.stringify(newAllPokemon),
                (err) => {
                    if (err) {
                        response.status(400).send({
                            success: false,
                            url: "/api/pokemons",
                            method: "DELETE",
                            message: "fallo al eliminar el pokemon",
                            err: err,
                        });
                    } else {
                        response.status(201).send({
                            success: true,
                            url: "/api/pokemons",
                            method: "DELETE",
                            message: "Pokemon eliminado correctamente",
                            deletePokemon: deletePokemon,
                        });
                    }
                }
            );
        });
    }
});

// GET ONE
api.get("/api/onepokemon", (request, response) => {
    if (!request.query.id) {
        response.status(400).send({
            success: false,
            url: "/api/onepokemons",
            method: "GET",
            message: "id is requied",
        });
    } else {
        fs.readFile("db/dbPokemon.json", (err, data) => {
            if (err) throw err; //Elevar o notificar una excepcion
            const allPokemon = JSON.parse(data); // Parseamos el contenido del fichero a formato JSON
            const onePokemon = {
                id: Number.parseInt(request.query.id),
            };

            const searchPokemon = allPokemon.find(
                (pokemon) => pokemon.id === onePokemon.id
            );

            response.status(200).send({
                success: true,
                message: "/api/pokemons",
                method: "GET",
                pokemon: searchPokemon,
            });
        });
    }
});

// GET ONE POR PARAMS

api.get("/api/pokemons/:id", (request, response) => {
    if (!request.params) {
        response.status(400).send({
            success: false,
            url: "/api/onepokemons",
            method: "GET",
            message: "id is requied",
        });
    } else {
        fs.readFile("db/dbPokemon.json", (err, data) => {
            if (err) throw err; //Elevar o notificar una excepcion
            const allPokemon = JSON.parse(data); // Parseamos el contenido del fichero a formato JSON
            const onePokemon = {
                id: Number.parseInt(request.params.id),
            };

            const searchPokemon = allPokemon.filter(
                (pokemon) => pokemon.id === onePokemon.id
            );

            response.status(200).send({
                success: true,
                message: "/api/pokemons",
                method: "GET",
                searchPokemon: searchPokemon,
            });
        });
    }
});

// PUT

api.put("/api/pokemons/:id", (request, response) => {
    fs.readFile("db/dbPokemon.json", (err, data) => {
        if (err) throw err;
        const allPokemonUpdate = JSON.parse(data);
        allPokemonUpdate.forEach((pokemon) => {
            if (pokemon.id === Number.parseInt(request.params.id)) {
                // if (request.body.type) {
                //     pokemon.type = request.body.type;
                // }
                pokemon.type = request.body.type ? request.body.type : pokemon.type;
                pokemon.name = request.body.name ? request.body.name : pokemon.name;
            }
        });

        fs.writeFile(
            "db/dbPokemon.json",
            JSON.stringify(allPokemonUpdate),
            (err) => {
                if (err) {
                    response.status(400).send({
                        success: false,
                        url: "/api/pokemons",
                        method: "PUT",
                        message: "fallo al modificar el pokemon",
                        err: err,
                    });
                } else {
                    response.status(201).send({
                        success: true,
                        url: "/api/pokemons",
                        method: "PUT",
                        message: "Pokemon modificado correctamente",
                        allPokemonUpdate: allPokemonUpdate,
                    });
                }
            }
        );
    });
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