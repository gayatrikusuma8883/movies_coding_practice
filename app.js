const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()
//API 1
const convertMovieName = dbObj => {
  return {
    movieName: dbObj.movie_name,
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    leadActor: dbObj.lead_actor,
  }
}

const dbObjecttoResponseobj = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

app.get('/movies/', async (request, response) => {
  const getmoviesQuery = `
    SELECT
      movie_name
    FROM
      movie`
  const moviesArray = await db.all(getmoviesQuery)
  response.send(moviesArray.map(movieName => convertMovieName(movieName)))
})

//API 2
app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const getMovieNameQuery = `
  INSERT INTO
  movie(director_id,movie_name,lead_actor)
  VALUES(
    ${directorId},
    '${movieName}',
    '${leadActor}')`
  await db.run(getMovieNameQuery)
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `SELECT * FROM movie
  WHERE movie_id=${movieId};`
  const movie = await db.get(getMovieQuery)
  console.log(movie)
  response.send(dbObjecttoResponseobj(movie))
})
//
app.put('/movies/:movieId/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const {movieId} = request.params
  const updateMovieQuery = `
  UPDATE movie
  SET 
  director_id=${directorId},
  movie_name='${movieName}',
  lead_actor='${leadActor}',
  WHERE movie_id=${movieId};`
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

//
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE movie
  WHERE movie_id=${movieId}`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

//
const convertDirectorsDetails = dbObj => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director`
  const directorsArray = await db.all(getDirectorsQuery)
  response.send(
    directorsArray.map(eachDirector => convertDirectorsDetails(eachDirector)),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMovieNameQuery = `
  SELECT movie_name FROM movie
  WHERE director_id='${directorId}';
  `
  const moviesArray = await db.all(getDirectorMovieNameQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})
module.exports = app
