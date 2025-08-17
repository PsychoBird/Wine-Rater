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
  console.log(username, password);

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
  // username exists in database 
  if (result.rows.length !== 0) {
    console.log("username already exists in the database");
    return res.status(400).send("username already exists in the database, pick a different one"); 
  }

  // TODO validate username/password meet requirements
  let hash;
  try {
    hash = await argon2.hash(password);
  } catch (error) {
    console.log("HASH FAILED", error);
    return res.status(500).send(error);
  }
  console.log(hash); // TODO just for debugging
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
    return res.status(500).send(error);
  }
  // TODO automatically log people in when they create account, because why not?
  return res.status(200).send("congrats! ur account is made and you're logged in!"); 
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
  console.log(verifyResult);
  if (!verifyResult) {
    console.log("seems like you have the wrong password.. try again");
    return res.status(400).send("seems like you have the wrong password.. "); 
  }
  // generate login token, save in cookie
  let token = makeToken();
  console.log("Generated token", token);
  tokenStorage[token] = username;
  console.log(token, username);
  return res.cookie("token", token, cookieOptions).send("logged in, token made"); 
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
    try {
      let result = await pool.query(
          "SELECT * FROM reviews"
      );

      console.log(result);
      return res.json(result.rows);
    } catch (error) {
        console.error("SELECT Failed: ", error);
        return res.status(500).send("Server error: ", error);
    }
});

// Post a New Review
app.post("/add-new-review", async (req, res) => {
    let body = req.body;
    console.log("Request Body:", body);

    let userID = body["userID"];
    let wineID = body["wineID"]
    let postDescription = body["postDescription"];
    let score = body["score"];

    let arr = [userID, wineID, postDescription, score];

    if (!postDescription || !score) {
        console.log("u didnt fill soemthing out properly try agn")
        return res.status(400).send('some info was not completed... try again');
    } else {
        try {
            await pool
            .query(`INSERT INTO reviews(user_id, wine_id, post_description, score)
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

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});