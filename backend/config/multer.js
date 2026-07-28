import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(process.cwd(), "uploads"));
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + "-" + Math.random(Math.round() * 1e5);
//     const ext = path.extname(file.originalname);
//     cb(null, `movie-${unique}${ext}`);
//   },
// });

const upload = multer({ storage }).fields([
  { name: "poster", maxCount: 1 },
  { name: "trailerUrl", maxCount: 1 },
  { name: "videoUrl", maxCount: 1 },
  { name: "ltThumbnail", maxCount: 1 },
  { name: "castFiles", maxCount: 20 },
  { name: "directorFiles", maxCount: 20 },
  { name: "producerFiles", maxCount: 20 },
  { name: "ltDirectorFiles", maxCount: 20 },
  { name: "ltProducerFiles", maxCount: 20 },
  { name: "ltSingerFiles", maxCount: 20 },
]);

export default upload;
