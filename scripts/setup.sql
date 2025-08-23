CREATE DATABASE corked;
\c corked

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(20) NOT NULL,
    last_name VARCHAR(20) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_wines (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    wine_name TEXT NOT NULL,
    country_origin TEXT NOT NULL,
    year INT NOT NULL,
    description TEXT,
);

CREATE TABLE IF NOT EXISTS global_wine_db (
    wine_name TEXT NOT NULL,
    country_origin TEXT NOT NULL,
    year INT NOT NULL,
    average_score INT CHECK (average_score >= 0 AND average_score <= 10),
    PRIMARY KEY (wine_name, country_origin, year)
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    wine_name VARCHAR(255) NOT NULL,
    post_description TEXT,
    score INT NOT NULL CHECK (score >= 0 AND score <= 10),
    created_on DATE NOT NULL DEFAULT CURRENT_DATE
);