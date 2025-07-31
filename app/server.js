const express = require("express");
const pg = require("pg");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

app.use(express.static("public"));
app.use(express.json());

pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
  });

app.post("/add-new-review", (req, res) => {
    let body = req.body;
    console.log("here is ur info:", body);

    let userID = body["userID"];
    let wineID = body["wineID"]
    let postDescription = body["postDescription"];
    let score = body["score"];

    let arr = [userID, wineID, postDescription, score];

    if (!postDescription || !score) {
        console.log("u didnt fill soemthing out properly try agn")
        res.status(400).send('some info was not completed... try again');
    } else {
        try {
            pool
            .query(`INSERT INTO reviews(user_id, wine_id, post_description, score)
                VALUES($1, $2, $3, $4)
                RETURNING *`, arr)
            .then(() => {
                res.status(200).send('ok u got it');
            })
        } catch (error) {
            res.status(500).send('something else went wrong');
        }
    } 
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
  });
  