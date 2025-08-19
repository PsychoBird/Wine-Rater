const express = require("express");
const pg = require("pg");
let argon2 = require("argon2");
let cookieParser = require("cookie-parser");
let crypto = require("crypto");
const path = require("path");
const env = require("../env.json");
const fs = require("fs");

const app = express();
const port = 3000;
const hostname = "localhost";

const Pool = pg.Pool;
const config = JSON.parse(fs.readFileSync('../env.json'));
const pool = new Pool({
  user: config.user,
  host: config.host,
  database: config.database,
  password: config.password,
  port: config.port,
  ssl: { rejectUnauthorized: false }
});

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});

// MIDDLEWARE; check if login token in token storage, if not, 403 response
let authorize = (req, res, next) => {
  let { token } = req.cookies;
  if (token === undefined || !tokenStorage.hasOwnProperty(token)) {
    return res.status(403).send("Not Authorized. Access Denied.");
  }
  next();
};


// PAGE ROUTING

// Public Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"))
});

app.get("/create-account", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "create-account.html"))
});

// Protected Routes;
app.get("/header", authorize, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "header.html"))
});

app.get("/reviews", authorize, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "reviews.html"))
});

app.get("/profile-view", authorize, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "profile.html"))
});

app.get("/wine-list", authorize, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "wineList.html"))
});

app.get("/rate-a-wine", authorize, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "rateWines.html"))
});


// AUTHENTICATION LOGIC

let tokenStorage = {};

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}
// must use same cookie options when setting/deleting a given cookie with res.cookie and res.clearCookie
// or else the cookie won't actually delete
// remember that the token is essentially a password that must be kept secret
let cookieOptions = {
  httpOnly: true, // client-side JS can't access this cookie; important to mitigate cross-site scripting attack damage
  secure: false, //FIX THIS ONCE WE GO PUBLIC!!! // cookie will only be sent over HTTPS connections (and localhost); important so that traffic sniffers can't see it even if our user tried to use an HTTP version of our site, if we supported that
  sameSite: "strict", // browser will only include this cookie on requests to this domain, not other domains; important to prevent cross-site request forgery attacks
};

// Validate Credentials
function validateCredentials(body) {
  if ((body.username.length >= 4) && (body.password.length >= 6)) {
    return true;
  } else {
    return false;
  }
}

// Account Creation
app.post("/create-account", async (req, res) => {
  let { body } = req;
  if (!validateCredentials(body)) {
    return res.status(400).send("your username or password doesn't meet the requirements."); 
  }
  let { firstName, lastName, email, username, password } = body;
  console.log(`Username: ${username}, Password: ${password}`);

  // checking if username exists in database
  try {
    result = await pool.query(
      "SELECT password FROM users WHERE username = $1",
      [username],
    );
  } catch (error) {
    console.log("SELECT FAILED", error);
    return res.status(500).send(error); 
  }

  let hash;
  try {
    hash = await argon2.hash(password);
  } catch (error) {
    console.log("HASH FAILED", error);
    return res.status(500).send("Internal server error");
  }

  // TODO just for debugging
  console.log("Hash: ", hash);

  try {
    await pool.query("INSERT INTO users (first_name, last_name, email, username, password) VALUES ($1, $2, $3, $4, $5)", [
      firstName,
      lastName,
      email,
      username,
      hash,
    ]);
  } catch (error) {
    console.log("INSERT FAILED", error);
    if (error.code === "23505" || error.code === "1062") {
      return res.status(400).send("Username or email already exists. Pick a different one.");
    }
    return res.status(500).send("internval server error");
  }

  // Auto Login
  let token = makeToken();
  console.log(`Generated Token: ${token}\nFor User: ${username}`);
  tokenStorage[token] = username;

  return res.cookie("token", token, cookieOptions).status(201).send("Account created and user logged in successfully")
});


// Login
app.post("/login", async (req, res) => {
  let { body } = req;
  // TODO validate body is correct shape and type
  if (!validateCredentials(body)) {
    return res.status(400).send("your username or password doesn't meet the requirements..");
  }
  let { username, password } = body;
  let result;
  try {
    result = await pool.query(
      "SELECT password FROM users WHERE username = $1",
      [username],
    );
  } catch (error) {
    console.log("SELECT FAILED", error);
    return res.status(500).send(error);
  }
  // username doesn't exist
  if (result.rows.length === 0) {
    console.log("username doesn't exist.. try again")
    return res.status(400).send("username doesn't exist.."); 
  }
  let hash = result.rows[0].password;
  console.log(username, password, hash);
  let verifyResult;
  try {
    verifyResult = await argon2.verify(hash, password);
  } catch (error) {
    console.log("VERIFY FAILED", error);
    return res.status(500).send(error); 
  }
  // password didn't match
  if (!verifyResult) {
    console.log("seems like you have the wrong password.. try again");
    return res.status(400).send("seems like you have the wrong password.. "); 
  }
  // generate login token, save in cookie
  let token = makeToken();
  console.log(`Generated Token: ${token}\nFor User: ${username}\n`);
  tokenStorage[token] = username;

  return res.cookie("token", token, cookieOptions).status(201).send("User logged in successfully"); 
});

app.post("/logout", (req, res) => {
  let { token } = req.cookies;
  if (token === undefined) {
    console.log("Already logged out");
    return res.status(400).send("already logged out");
  }
  if (!tokenStorage.hasOwnProperty(token)) {
    console.log("Token doesn't exist");
    return res.status(400).send("Token doesn't exist");
  }
  console.log("Before", tokenStorage);
  delete tokenStorage[token];
  console.log("Deleted", tokenStorage);
  return res.clearCookie("token", cookieOptions).send("token has been deleted");
});


// APPLICATION LOGIC

// Get user profile information
app.get("/profile", authorize, async (req, res) => {
    let { token } = req.cookies;
    let username = tokenStorage[token];
    console.log("Logged username:", username);
    try {
        let result = await pool.query(
            "SELECT first_name, last_name, email, username FROM users WHERE username = $1",
            [username]  
        );
        console.log(result);
        if (result.rows.length === 0) {
            return res.status(404).send("User not found");
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("SELECT FAILED", error);
        res.status(500).send("Server error: ", error);
    }
});

// Get all reviews from the database
app.get("/get-all-reviews", async (req, res) => {
  console.log("Received request to get all reviews");
  try {
    let result = await pool.query(
        `SELECT reviews.id, reviews.wine_name, reviews.description, reviews.score, users.username
        FROM reviews
        JOIN users ON reviews.user_id = users.id
        ORDER BY reviews.id DESC`
    );

    console.log("Result: ", result.rows);
    return res.json(result.rows);
  } catch (error) {
      console.error("SELECT Failed: ", error);
      return res.status(500).send("Server error: ", error);
  }
});

// Post a New Review
app.post("/add-new-review", async (req, res) => {
    let { token } = req.cookies;
    let username = tokenStorage[token];
    console.log("Logged username:", username);

    let result = await pool.query(
      "SELECT id, username FROM users WHERE username = $1",
      [username]  
    );

    if (result.rows.length === 0) {
      return res.status(404).send("user not found");
    }

    let userID = result.rows[0].id;

    let body = req.body;
    console.log("Request Body:", body);

    let wineName = body["wineName"]
    let postDescription = body["postDescription"];
    let score = body["score"];

    let arr = [userID, wineName, postDescription, score];

    if (!postDescription || !score) {
        console.log("u didnt fill soemthing out properly try agn")
        return res.status(400).send('some info was not completed... try again');
    } else {
        try {
            await pool
            .query(`INSERT INTO reviews(user_id, wine_name, description, score)
                VALUES($1, $2, $3, $4)
                RETURNING *`, arr)
            .then(() => {
                return res.status(200).send('ok u got it');
            })
        } catch (error) {
            return res.status(500).send('something else went wrong');
        }
    } 
});

// Get all Wines in Personal List
app.get("/get-wine-list", async (req, res) => {
    let { token } = req.cookies;
    let username = tokenStorage[token];

    if (!username) {
      return res.status(401).send("Unauthorized: Invalid or missing token");
    }

    try {
      let result = await pool.query(
        `SELECT wine_name, country_origin, year, description FROM saved_wines 
         WHERE username = $1 ORDER BY year DESC`,
        [username]
      );

      return res.json({
        count: result.rows.length,
        wines: result.rows
      });
    } catch (error) {
      console.error("SELECT Failed: ", error);
      res.status(500).send(error);
    }
});

// Post a New Wine to User's Personal List
app.post("/add-to-wine-list", async (req, res) => {
    let { token } = req.cookies;
    let username = tokenStorage[token];

    let body = req.body;
    console.log("Request sent to Get Wine List with body: ", body);
    let country = body["country_origin"];
    let year = body["year"];
    let wine = body["wine_name"];
    let description = body["description"] ?? null;

    if (!country || year === undefined || year === null || !wine) {
      res.status(400).send("Request body missing required information. Needs wine_name, country_origin, and year.");
    }

    try {
      let queryText = "INSERT INTO saved_wines(username, wine_name, country_origin, year";
      let valuesText = "VALUES($1, $2, $3, $4"
      let arr = [username, wine, country, year];
      if (description) {
        queryText += ", description) ";
        valuesText += ", $5)";
        arr.push(description);
      } else {
        queryText += ") ";
        valuesText += ") "
      }
      let finalQuery = queryText + valuesText + "RETURNING *";

      let result = await pool.query(`${finalQuery}`, arr);
      res.status(200).json({
        message: "Successfully added new wine.",
        wine: result.rows[0]
      });
    } catch (error) {
      if (error.code === "1062") { // Duplicate entry error code for MariaDB
        return res.status(409).send("This wine is already in your list.");
      }
      console.error("INSERT Failed: ", error);
      res.status(500).send(error);
    }
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});