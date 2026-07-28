import express, { Router } from "express";
import upload from "../config/multer.js";

import {
  createMovie,
  deleteMovie,
  getMovieById,
  getMovies,
} from "../controllers/movieController.js";

const movieRouter = express.Router();

movieRouter.post("/", upload, createMovie);
movieRouter.get("/", getMovies);
movieRouter.get("/:id", getMovieById);
movieRouter.delete("/:id", deleteMovie);

export default movieRouter;
