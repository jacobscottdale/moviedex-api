require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const moviesData = require('./movies-data.json');
const { NODE_ENV } = require('./config');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(function validateBearerToken(req, res, next) {
  const authToken = req.get('Authorization');
  const apiToken = process.env.API_TOKEN;

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
});

app.get('/movie', (req, res) => {
  const { genre, country, avg_vote } = req.query;
  let filteredMovies = moviesData;

  if (avg_vote > 10) {
    res.status(400).send('Voting may not be more than 10');
  }

  if (genre) {
    const byGenre = filteredMovies.filter(movie => movie.genre.toLowerCase().includes(genre.toLowerCase()));

    if (byGenre) {
      filteredMovies = byGenre;
    } else {
      res
        .status(400)
        .send(`No results`);
    }
  }

  if (country) {
    const byCountry = filteredMovies.filter(movie => movie.country.toLowerCase().includes(country.toLowerCase()));
    if (byCountry) {
      filteredMovies = byCountry;
    } else {
      res
        .status(400)
        .send(`No results`);
    }
  }

  if (avg_vote) {
    const byVote = filteredMovies.filter(movie => movie.avg_vote >= avg_vote);
    if (byVote) {
      filteredMovies = byVote;
    } else {
      res
        .status(400)
        .send('No results');
    }
  }

  res.json(filteredMovies);
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.log(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;