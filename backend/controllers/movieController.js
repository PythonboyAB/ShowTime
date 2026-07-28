// import mongoose from "mongoose";
// import Movie from '../models/movieModel.js';
// import path from 'path';
// import fs from 'fs';

// const API_BASE ='http://localhost:5000';

// /* ---------------------- small helpers ---------------------- */
// // Builds a full upload URL from a filename or returns null if invalid
// const getUploadUrl = (val) => {
//    if (!val) return null;
//    if (typeof val === "string" && /^(https?:\/\/)/.test(val)) return val;
//    const cleaned = String(val).replace(/^uploads\//, "");
//    if (!cleaned) return null;
//    return `${API_BASE}/uploads/${cleaned}`;
//  };

//  // Extracts the filename from a URL or upload path
//  const extractFilenameFromUrl = (u) => {
//    if (!u || typeof u !== "string") return null;
//    const parts = u.split("/uploads/");
//    if (parts[1]) return parts[1];
//    if (u.startsWith("uploads/")) return u.replace(/^uploads\//, "");
//    return /^[^\/]+\.[a-zA-Z0-9]+$/.test(u) ? u : null;
//  };

//  // Deletes a file from the uploads folder if it exists
//  const tryUnlinkUploadUrl = (urlOrFilename) => {
//    const fn = extractFilenameFromUrl(urlOrFilename);
//    if (!fn) return;
//    const filepath = path.join(process.cwd(), "uploads", fn);
//    fs.unlink(filepath, (err) => {
//      if (err) console.warn("Failed to unlink file", filepath, err?.message || err);
//    });
//  };

//  // Safely parses JSON and returns null on failure
//  const safeParseJSON = (v) => {
//    if (!v) return null;
//    if (typeof v === "object") return v;
//    try { return JSON.parse(v); } catch { return null; }
//  };

//  // Normalizes a person file value to a simple filename
//  const normalizeLatestPersonFilename = (value) => {
//    if (!value) return null;
//    if (typeof value === "string") {
//      const fn = extractFilenameFromUrl(value);
//      return fn || value;
//    }
//    if (typeof value === "object") {
//      const candidate = value.filename || value.path || value.url || value.file || value.image || value.preview || null;
//      return candidate ? normalizeLatestPersonFilename(candidate) : null;
//    }
//    return null;
//  };

//  // Converts a person object into a {name, role, preview} format
//  const personToPreview = (p) => {
//    if (!p) return { name: "", role: "", preview: null };
//    const candidate = p.preview || p.file || p.image || p.url || null;
//    return { name: p.name || "", role: p.role || "", preview: candidate ? getUploadUrl(candidate) : null };
//  };
//  /* ---------------------- shared transformers ---------------------- */
// const buildLatestTrailerPeople = (arr = []) =>
// (arr || []).map((p) => ({
//   name: (p && p.name) || "",
//   role: (p && p.role) || "",
//   file: normalizeLatestPersonFilename(p && (p.file || p.preview || p.url || p.image))
// }));

// const enrichLatestTrailerForOutput = (lt = {}) => {
// const copy = { ...lt };
// copy.thumbnail = copy.thumbnail ? getUploadUrl(copy.thumbnail) : copy.thumbnail || null;
// const mapPerson = (p) => {
//   const c = { ...(p || {}) };
//   c.preview = c.file ? getUploadUrl(c.file) : (c.preview ? getUploadUrl(c.preview) : null);
//   c.name = c.name || "";
//   c.role = c.role || "";
//   return c;
// };
// copy.directors = (copy.directors || []).map(mapPerson);
// copy.producers = (copy.producers || []).map(mapPerson);
// copy.singers = (copy.singers || []).map(mapPerson);
// return copy;
// };

// const normalizeItemForOutput = (it = {}) => {
// const obj = { ...it };
// obj.thumbnail = it.latestTrailer?.thumbnail ? getUploadUrl(it.latestTrailer.thumbnail) : (it.poster ? getUploadUrl(it.poster) : null);
// obj.trailerUrl = it.trailerUrl || (it.latestTrailer?.url || it.latestTrailer?.videoId) || null;

// if (it.type === "latestTrailers" && it.latestTrailer) {
//   const lt = it.latestTrailer;
//   obj.genres = obj.genres || lt.genres || [];
//   obj.year = obj.year || lt.year || null;
//   obj.rating = obj.rating || lt.rating || null;
//   obj.duration = obj.duration || lt.duration || null;
//   obj.description = obj.description || lt.description || lt.excerpt || "";
// }

// obj.cast = (it.cast || []).map(personToPreview);
// obj.directors = (it.directors || []).map(personToPreview);
// obj.producers = (it.producers || []).map(personToPreview);

// if (it.latestTrailer) obj.latestTrailer = enrichLatestTrailerForOutput(it.latestTrailer);

// // NEW: include auditorium in normalized output (keep null if not present)
// obj.auditorium = it.auditorium || null;

// return obj;
// };

// // create a movie

// export async function createMovie(req, res) {
//    try {
//       const body = req.body || {};

//       const posterUrl = req.files?.poster?.[0]?.filename ? getUploadUrl(req.files.poster[0].filename) : (body.poster || null);
//       const trailerUrl = req.files?.trailerUrl?.[0]?.filename ? getUploadUrl(req.files.trailerUrl[0].filename) : (body.trailerUrl || null);
//       const videoUrl = req.files?.videoUrl?.[0]?.filename ? getUploadUrl(req.files.videoUrl[0].filename) : (body.videoUrl || null);

//       const categories = safeParseJSON(body.categories) || (body.categories ? String(body.categories).split(",").map(s => s.trim()).filter(Boolean) : []);
//       const slots = safeParseJSON(body.slots) || [];
//       const seatPrices = safeParseJSON(body.seatPrices) || { standard: Number(body.standard || 0), recliner: Number(body.recliner || 0) };

//       const cast = safeParseJSON(body.cast) || [];
//       const directors = safeParseJSON(body.directors) || [];
//       const producers = safeParseJSON(body.producers) || [];

//       const attachFiles = (filesArrName, targetArr, toFilename = (f) => getUploadUrl(f)) => {
//         if (!req.files?.[filesArrName]) return;
//         req.files[filesArrName].forEach((file, idx) => {
//           if (targetArr[idx]) targetArr[idx].file = toFilename(file.filename);
//           else targetArr[idx] = { name: "", file: toFilename(file.filename) };
//         });
//       };
//       attachFiles("castFiles", cast);
//       attachFiles("directorFiles", directors);
//       attachFiles("producerFiles", producers);

//       // latest trailer
//       const latestTrailerBody = safeParseJSON(body.latestTrailer) || {};
//       if (req.files?.ltThumbnail?.[0]?.filename) latestTrailerBody.thumbnail = req.files.ltThumbnail[0].filename;
//       else if (body.ltThumbnail) {
//         const fn = extractFilenameFromUrl(body.ltThumbnail);
//         latestTrailerBody.thumbnail = fn ? fn : body.ltThumbnail;
//       }
//       if (body.ltVideoUrl) latestTrailerBody.videoId = body.ltVideoUrl;
//       if (body.ltUrl) latestTrailerBody.url = body.ltUrl;
//       if (body.ltTitle) latestTrailerBody.title = body.ltTitle;

//       latestTrailerBody.directors = latestTrailerBody.directors || [];
//       latestTrailerBody.producers = latestTrailerBody.producers || [];
//       latestTrailerBody.singers = latestTrailerBody.singers || [];

//       const attachLtFiles = (fieldName, arrName) => {
//         if (!req.files?.[fieldName]) return;
//         req.files[fieldName].forEach((file, idx) => {
//           const filename = file.filename;
//           if (latestTrailerBody[arrName][idx]) latestTrailerBody[arrName][idx].file = filename;
//           else latestTrailerBody[arrName][idx] = { name: "", file: filename };
//         });
//       };
//       attachLtFiles("ltDirectorFiles", "directors");
//       attachLtFiles("ltProducerFiles", "producers");
//       attachLtFiles("ltSingerFiles", "singers");

//       latestTrailerBody.directors = buildLatestTrailerPeople(latestTrailerBody.directors);
//       latestTrailerBody.producers = buildLatestTrailerPeople(latestTrailerBody.producers);
//       latestTrailerBody.singers = buildLatestTrailerPeople(latestTrailerBody.singers);

//       const auditoriumValue = (typeof body.auditorium === "string" && body.auditorium.trim()) ? String(body.auditorium).trim() : "Audi 1";

//       const doc = new Movie({
//         _id: new mongoose.Types.ObjectId(),
//         type: body.type || "normal",
//         movieName: body.movieName || body.title || "",
//         categories,
//         poster: posterUrl,
//         trailerUrl,
//         videoUrl,
//         rating: Number(body.rating) || 0,
//         duration: Number(body.duration) || 0,
//         slots,
//         seatPrices,
//         cast,
//         directors,
//         producers,
//         story: body.story || "",
//         latestTrailer: latestTrailerBody,
//         auditorium: auditoriumValue,
//       });

//       const saved = await doc.save();
//       return res.status(201).json({
//          success: true,
//          message:'Movie created',
//          data: saved
//       });

//    } catch (err) {
//       console.error('CreateMovie:', err);
//       return res.status(500).json({
//          success: false,
//          message: 'Server Error'
//       })
//    }
// }

// // GetMOVIES (ALL)
// export async function getMovies (req,res){
//    try {
//       const { category, type, sort = '-createdAt' , page = 1, limit = 12, search, latestTrailers } = req.query;
//       let filter = {};
//       if (typeof category === "string" && category.trim()) filter.categories = { $in: [category.trim()] };
//       if (typeof type === "string" && type.trim()) filter.type = type.trim();
//       if (typeof search === "string" && search.trim()) {
//         const q = search.trim();
//         filter.$or = [
//           { movieName: { $regex: q, $options: "i" } },
//           { "latestTrailer.title": { $regex: q, $options: "i" } },
//           { story: { $regex: q, $options: "i" } },
//         ];
//       }
//       if (latestTrailers && String(latestTrailers).toLowerCase() !== 'false'){
//          filter = Object.keys(filter).length === 0 ? {
//             type: 'latestTrailers'
//          } : {
//             $and: [filter, {type: 'latestTrailers'}]
//          }
//       }

//     const pg = Math.max(1, parseInt(page, 10) || 1);
//     const lim = Math.min(200, parseInt(limit, 10) || 12);
//     const skip = (pg - 1) * lim;

//     const total = await Movie.countDocuments(filter);
//     const items = await Movie.find(filter).sort(sort).skip(skip).limit(lim).lean();

//     const normalized = (items || []).map(normalizeItemForOutput);
//     return res.json({
//       success: true,
//       total,
//       page: pg,
//       limit: lim,
//       items: normalized
//     });
//    } catch (err) {
//       console.error('Getmovies Error:',err)
//       return res.status(500).json({
//          success: false,
//          message: 'Server Error'
//       })

//    }
// }

// // get a movie using id

// export async function getMovieById(req, res){
//    try {
//       const {id} = req.params;
//       if(!id) return res.status(400).json({
//          success: false,
//          message:'ID is required'
//       })

//       const item = await Movie.findById(id).lean();
//       if(!item) return res.status(404).json({
//          success: false,
//          message: 'Movie not found'
//       });

//       const obj = normalizeItemForOutput(item);

//       if (item.type === "latestTrailers" && item.latestTrailer) {
//          const lt = item.latestTrailer;
//          obj.genres = obj.genres || lt.genres || [];
//          obj.year = obj.year || lt.year || null;
//          obj.rating = obj.rating || lt.rating || null;
//          obj.duration = obj.duration || lt.duration || null;
//          obj.description = obj.description || lt.description || lt.excerpt || obj.description || "";
//        }
//        return res.json({success: true, item: obj });
//    } catch (err) {
//       console.error('GetmovieById Error:' , err);
//       return res.status(500).json({
//          success: false,
//          message: 'Server Error'
//       })
//    }
// }

// //Delete a movie and unlink the img
// export async function deleteMovie(req,res) {
//    try {
//       const {id} = req.params;
//       if(!id) return res.status(400).json({
//          success: false,
//          message:'ID is required'
//       })

//       const m = await Movie.findById(id)
//       if(!m) return res.status(404).json({
//          success: false,
//          message: 'Movie not found'
//       });

//       //unlink main asset
//       if (m.poster) tryUnlinkUploadUrl(m.poster);
//       if(m.latestTrailer && m.latestTrailer.thumbnail) tryUnlinkUploadUrl(m.latestTrailer.thumbnail);

//       [(m.cast || []), (m.directors || []), (m.producers || [])].forEach(arr =>
//          arr.forEach(p => { if (p && p.file) tryUnlinkUploadUrl(p.file); })
//        );

//        if (m.latestTrailer) {
//          ([...(m.latestTrailer.directors || []), ...(m.latestTrailer.producers || []), ...(m.latestTrailer.singers || [])])
//            .forEach(p => { if (p && p.file) tryUnlinkUploadUrl(p.file); });
//        }

//        await Movie.findByIdAndDelete(id);
//        return res.json({
//          success: true,
//          message: 'Movie Deleted'
//        });
//    } catch (err) {
//       console.error('DeleteMovie Error:' , err);
//       return res.status(500).json({
//          success: false,
//          message: 'Server Error'
//       })
//    }
// }

// export default { createMovie, getMovies, getMovieById, deleteMovie};

import mongoose from "mongoose";
import Movie from "../models/movieModel.js";
import { uploadToS3, deleteFromS3 } from "../config/s3.js"; // adjust path to wherever s3.js lives

const API_BASE = "http://localhost:5000";

/* ---------------------- small helpers ---------------------- */
const getUploadUrl = (val) => {
  if (!val) return null;
  if (typeof val === "string" && /^(https?:\/\/)/.test(val)) return val;
  const cleaned = String(val).replace(/^uploads\//, "");
  if (!cleaned) return null;
  return `${API_BASE}/uploads/${cleaned}`;
};

// Extracts the S3 object key from a full S3 URL, for deletion
const extractS3KeyFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url);
    const key = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch {
    return null;
  }
};

const tryDeleteS3ByUrl = async (url) => {
  const key = extractS3KeyFromUrl(url);
  if (key) await deleteFromS3(key);
};

const safeParseJSON = (v) => {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const normalizeLatestPersonFilename = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value; // already a full S3 URL
  if (typeof value === "object") {
    const candidate =
      value.filename ||
      value.path ||
      value.url ||
      value.file ||
      value.image ||
      value.preview ||
      null;
    return candidate ? normalizeLatestPersonFilename(candidate) : null;
  }
  return null;
};

const personToPreview = (p) => {
  if (!p) return { name: "", role: "", preview: null };
  const candidate = p.preview || p.file || p.image || p.url || null;
  return {
    name: p.name || "",
    role: p.role || "",
    preview: candidate ? getUploadUrl(candidate) : null,
  };
};

/* ---------------------- shared transformers ---------------------- */
const buildLatestTrailerPeople = (arr = []) =>
  (arr || []).map((p) => ({
    name: (p && p.name) || "",
    role: (p && p.role) || "",
    file: normalizeLatestPersonFilename(
      p && (p.file || p.preview || p.url || p.image),
    ),
  }));

const enrichLatestTrailerForOutput = (lt = {}) => {
  const copy = { ...lt };
  copy.thumbnail = copy.thumbnail
    ? getUploadUrl(copy.thumbnail)
    : copy.thumbnail || null;
  const mapPerson = (p) => {
    const c = { ...(p || {}) };
    c.preview = c.file
      ? getUploadUrl(c.file)
      : c.preview
        ? getUploadUrl(c.preview)
        : null;
    c.name = c.name || "";
    c.role = c.role || "";
    return c;
  };
  copy.directors = (copy.directors || []).map(mapPerson);
  copy.producers = (copy.producers || []).map(mapPerson);
  copy.singers = (copy.singers || []).map(mapPerson);
  return copy;
};

const normalizeItemForOutput = (it = {}) => {
  const obj = { ...it };
  obj.thumbnail = it.latestTrailer?.thumbnail
    ? getUploadUrl(it.latestTrailer.thumbnail)
    : it.poster
      ? getUploadUrl(it.poster)
      : null;
  obj.trailerUrl =
    it.trailerUrl || it.latestTrailer?.url || it.latestTrailer?.videoId || null;

  if (it.type === "latestTrailers" && it.latestTrailer) {
    const lt = it.latestTrailer;
    obj.genres = obj.genres || lt.genres || [];
    obj.year = obj.year || lt.year || null;
    obj.rating = obj.rating || lt.rating || null;
    obj.duration = obj.duration || lt.duration || null;
    obj.description = obj.description || lt.description || lt.excerpt || "";
  }

  obj.cast = (it.cast || []).map(personToPreview);
  obj.directors = (it.directors || []).map(personToPreview);
  obj.producers = (it.producers || []).map(personToPreview);

  if (it.latestTrailer)
    obj.latestTrailer = enrichLatestTrailerForOutput(it.latestTrailer);
  obj.auditorium = it.auditorium || null;

  return obj;
};

// create a movie
export async function createMovie(req, res) {
  try {
    const body = req.body || {};

    // ---- single-file uploads ----
    const posterFile = req.files?.poster?.[0];
    const trailerFile = req.files?.trailerUrl?.[0];
    const videoFile = req.files?.videoUrl?.[0];

    const posterUpload = posterFile
      ? await uploadToS3(posterFile, "posters")
      : null;
    const trailerUpload = trailerFile
      ? await uploadToS3(trailerFile, "trailers")
      : null;
    const videoUpload = videoFile
      ? await uploadToS3(videoFile, "videos")
      : null;

    const posterUrl = posterUpload ? posterUpload.url : body.poster || null;
    const trailerUrl = trailerUpload
      ? trailerUpload.url
      : body.trailerUrl || null;
    const videoUrl = videoUpload ? videoUpload.url : body.videoUrl || null;

    const categories =
      safeParseJSON(body.categories) ||
      (body.categories
        ? String(body.categories)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : []);
    const slots = safeParseJSON(body.slots) || [];
    const seatPrices = safeParseJSON(body.seatPrices) || {
      standard: Number(body.standard || 0),
      recliner: Number(body.recliner || 0),
    };

    const cast = safeParseJSON(body.cast) || [];
    const directors = safeParseJSON(body.directors) || [];
    const producers = safeParseJSON(body.producers) || [];

    // ---- person-array file uploads (cast/director/producer photos) ----
    const attachFiles = async (filesArrName, targetArr, folder) => {
      const files = req.files?.[filesArrName];
      if (!files) return;
      for (let idx = 0; idx < files.length; idx++) {
        const uploaded = await uploadToS3(files[idx], folder);
        if (targetArr[idx]) targetArr[idx].file = uploaded.url;
        else targetArr[idx] = { name: "", file: uploaded.url };
      }
    };
    await attachFiles("castFiles", cast, "cast");
    await attachFiles("directorFiles", directors, "directors");
    await attachFiles("producerFiles", producers, "producers");

    // ---- latest trailer ----
    const latestTrailerBody = safeParseJSON(body.latestTrailer) || {};

    const ltThumbFile = req.files?.ltThumbnail?.[0];
    if (ltThumbFile) {
      const uploaded = await uploadToS3(
        ltThumbFile,
        "latest-trailer-thumbnails",
      );
      latestTrailerBody.thumbnail = uploaded.url;
    } else if (body.ltThumbnail) {
      latestTrailerBody.thumbnail = body.ltThumbnail;
    }
    if (body.ltVideoUrl) latestTrailerBody.videoId = body.ltVideoUrl;
    if (body.ltUrl) latestTrailerBody.url = body.ltUrl;
    if (body.ltTitle) latestTrailerBody.title = body.ltTitle;

    latestTrailerBody.directors = latestTrailerBody.directors || [];
    latestTrailerBody.producers = latestTrailerBody.producers || [];
    latestTrailerBody.singers = latestTrailerBody.singers || [];

    const attachLtFiles = async (fieldName, arrName, folder) => {
      const files = req.files?.[fieldName];
      if (!files) return;
      for (let idx = 0; idx < files.length; idx++) {
        const uploaded = await uploadToS3(files[idx], folder);
        if (latestTrailerBody[arrName][idx])
          latestTrailerBody[arrName][idx].file = uploaded.url;
        else latestTrailerBody[arrName][idx] = { name: "", file: uploaded.url };
      }
    };
    await attachLtFiles(
      "ltDirectorFiles",
      "directors",
      "latest-trailer/directors",
    );
    await attachLtFiles(
      "ltProducerFiles",
      "producers",
      "latest-trailer/producers",
    );
    await attachLtFiles("ltSingerFiles", "singers", "latest-trailer/singers");

    latestTrailerBody.directors = buildLatestTrailerPeople(
      latestTrailerBody.directors,
    );
    latestTrailerBody.producers = buildLatestTrailerPeople(
      latestTrailerBody.producers,
    );
    latestTrailerBody.singers = buildLatestTrailerPeople(
      latestTrailerBody.singers,
    );

    const auditoriumValue =
      typeof body.auditorium === "string" && body.auditorium.trim()
        ? String(body.auditorium).trim()
        : "Audi 1";

    const doc = new Movie({
      _id: new mongoose.Types.ObjectId(),
      type: body.type || "normal",
      movieName: body.movieName || body.title || "",
      categories,
      poster: posterUrl,
      trailerUrl,
      videoUrl,
      rating: Number(body.rating) || 0,
      duration: Number(body.duration) || 0,
      slots,
      seatPrices,
      cast,
      directors,
      producers,
      story: body.story || "",
      latestTrailer: latestTrailerBody,
      auditorium: auditoriumValue,
    });

    const saved = await doc.save();
    return res.status(201).json({
      success: true,
      message: "Movie created",
      data: saved,
    });
  } catch (err) {
    console.error("CreateMovie:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// GET MOVIES (ALL)
export async function getMovies(req, res) {
  try {
    const {
      category,
      type,
      sort = "-createdAt",
      page = 1,
      limit = 12,
      search,
      latestTrailers,
    } = req.query;
    let filter = {};
    if (typeof category === "string" && category.trim())
      filter.categories = { $in: [category.trim()] };
    if (typeof type === "string" && type.trim()) filter.type = type.trim();
    if (typeof search === "string" && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { movieName: { $regex: q, $options: "i" } },
        { "latestTrailer.title": { $regex: q, $options: "i" } },
        { story: { $regex: q, $options: "i" } },
      ];
    }
    if (latestTrailers && String(latestTrailers).toLowerCase() !== "false") {
      filter =
        Object.keys(filter).length === 0
          ? { type: "latestTrailers" }
          : { $and: [filter, { type: "latestTrailers" }] };
    }

    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(200, parseInt(limit, 10) || 12);
    const skip = (pg - 1) * lim;

    const total = await Movie.countDocuments(filter);
    const items = await Movie.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .lean();

    const normalized = (items || []).map(normalizeItemForOutput);
    return res.json({
      success: true,
      total,
      page: pg,
      limit: lim,
      items: normalized,
    });
  } catch (err) {
    console.error("Getmovies Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}

// get a movie using id
export async function getMovieById(req, res) {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });

    const item = await Movie.findById(id).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });

    const obj = normalizeItemForOutput(item);

    if (item.type === "latestTrailers" && item.latestTrailer) {
      const lt = item.latestTrailer;
      obj.genres = obj.genres || lt.genres || [];
      obj.year = obj.year || lt.year || null;
      obj.rating = obj.rating || lt.rating || null;
      obj.duration = obj.duration || lt.duration || null;
      obj.description =
        obj.description ||
        lt.description ||
        lt.excerpt ||
        obj.description ||
        "";
    }
    return res.json({ success: true, item: obj });
  } catch (err) {
    console.error("GetmovieById Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}

// Delete a movie and its S3 assets
export async function deleteMovie(req, res) {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });

    const m = await Movie.findById(id);
    if (!m)
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });

    // delete main assets from S3
    if (m.poster) await tryDeleteS3ByUrl(m.poster);
    if (m.trailerUrl) await tryDeleteS3ByUrl(m.trailerUrl);
    if (m.videoUrl) await tryDeleteS3ByUrl(m.videoUrl);
    if (m.latestTrailer?.thumbnail)
      await tryDeleteS3ByUrl(m.latestTrailer.thumbnail);

    for (const arr of [m.cast || [], m.directors || [], m.producers || []]) {
      for (const p of arr) {
        if (p?.file) await tryDeleteS3ByUrl(p.file);
      }
    }

    if (m.latestTrailer) {
      const people = [
        ...(m.latestTrailer.directors || []),
        ...(m.latestTrailer.producers || []),
        ...(m.latestTrailer.singers || []),
      ];
      for (const p of people) {
        if (p?.file) await tryDeleteS3ByUrl(p.file);
      }
    }

    await Movie.findByIdAndDelete(id);
    return res.json({ success: true, message: "Movie Deleted" });
  } catch (err) {
    console.error("DeleteMovie Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}

export default { createMovie, getMovies, getMovieById, deleteMovie };
