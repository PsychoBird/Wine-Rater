CREATE DATABASE corked;
\c corked
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    wine_name VARCHAR(30) NOT NULL,
    wine_description VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    CHECK (score >= 0 AND score <= 10)
);