import stripe from "../config/stripe.js";
import { createCheckoutSession } from "../services/stripe.service.js";

import mongoose from "mongoose";
import Booking from "../models/bookingModel.js";
import Movie from "../models/movieModel.js";

const CLIENT_URL = "http://localhost:5173";
const RECLINER_ROWS = new Set(["D", "E"]);
const BLOCKING_STATUSES = [
  "pending",
  "paid",
  "confirmed",
  "active",
  "upcoming",
];

function normalizeShowtimeToMinute(input) {
  let d = new Date(input);
  if (isNaN(d.getTime())) {
    try {
      d = new Date(decodeURIComponent(String(input)));
    } catch {
      d = new Date(String(input));
    }
  }
  if (isNaN(d.getTime())) throw new Error("Invalid showtime");
  d.setSeconds(0, 0);
  return d;
}

function buildMovieMatchClause(movieId, movieName) {
  const push = (arr, obj) => {
    if (obj && Object.keys(obj).length) arr.push(obj);
  };
  const clauses = [];

  if (movieId) {
    const mid = String(movieId).trim();
    if (mid) {
      if (mongoose.Types.ObjectId.isValid(mid)) {
        push(clauses, { "movie.id": new mongoose.Types.ObjectId(mid) });
        push(clauses, { movieId: new mongoose.Types.ObjectId(mid) });
      }
      push(clauses, { "movie.id": mid });
      push(clauses, { movieId: mid });
    }
  }
  if (movieName) {
    const mname = String(movieName).trim();
    if (mname) {
      push(clauses, { "movie.title": mname });
      push(clauses, { movieName: mname });
      push(clauses, { "movie.movieName": mname });
    }
  }

  const seen = new Set();
  const unique = [];
  for (const c of clauses) {
    const k = JSON.stringify(c);
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(c);
    }
  }
  return unique;
}

//this function gives you total amt and it also calculate amt for standard and recliner
function computeTotalPaiseFromSeats(movie = {}, seats = [], options = {}) {
  const allowClientPrice = options.allowClientPrice === true;
  const standardRupee =
    Number(movie?.seatPrices?.standard ?? movie?.price ?? 0) || 0;
  const standardPaise = Math.round(standardRupee * 100);
  const reclinerDefined =
    typeof movie?.seatPrices?.recliner !== "undefined" &&
    movie?.seatPrices?.recliner !== null;
  const reclinerPaise = reclinerDefined
    ? Math.round(Number(movie.seatPrices.recliner) * 100)
    : Math.round(standardPaise * 1.5);

  let total = 0;
  for (const s of seats) {
    if (!s) continue;
    if (
      allowClientPrice &&
      typeof s === "object" &&
      s.price !== undefined &&
      s.price !== null
    ) {
      const p = Number(s.price);
      if (!Number.isNaN(p) && p >= 0) {
        total += Math.round(p * 100);
        continue;
      }
    }
    let seatId =
      typeof s === "string" ? s : String(s.seatId || s.id || s.name || "");
    seatId = String(seatId).trim();
    if (!seatId) continue;
    const row = seatId.charAt(0).toUpperCase();
    total += RECLINER_ROWS.has(row) ? reclinerPaise : standardPaise;
  }
  return Math.max(0, Math.round(total));
}

function normalizeSeatsFromInput(
  rawSeats = [],
  seatIdsFromBody = [],
  movie = {},
) {
  const normalized = [];
  const deriveServerPrice = (row) => {
    const isRecliner = RECLINER_ROWS.has(row);
    const base = Number(movie?.seatPrices?.standard ?? movie?.price ?? 0);
    if (isRecliner)
      return Number(movie?.seatPrices?.recliner ?? Math.round(base * 1.5));
    return base;
  };

  if (Array.isArray(rawSeats) && rawSeats.length > 0) {
    if (typeof rawSeats[0] === "object") {
      for (const s of rawSeats) {
        const seatIdVal = String(s.seatId || s.id || s)
          .trim()
          .toUpperCase();
        if (!seatIdVal) continue;
        const row = seatIdVal.charAt(0).toUpperCase();
        const type =
          s.type || (RECLINER_ROWS.has(row) ? "recliner" : "standard");
        let price = 0;
        if (s.price !== undefined && s.price !== null) {
          const p = Number(s.price);
          if (!Number.isNaN(p) && p >= 0) price = p;
        } else price = deriveServerPrice(row);
        normalized.push({ seatId: seatIdVal, type, price });
      }
    } else {
      for (const sid of rawSeats) {
        const seatIdVal = String(sid).trim().toUpperCase();
        if (!seatIdVal) continue;
        const row = seatIdVal.charAt(0).toUpperCase();
        const type = RECLINER_ROWS.has(row) ? "recliner" : "standard";
        normalized.push({
          seatId: seatIdVal,
          type,
          price: deriveServerPrice(row),
        });
      }
    }
  } else if (Array.isArray(seatIdsFromBody) && seatIdsFromBody.length > 0) {
    for (const sid of seatIdsFromBody) {
      const seatIdVal = String(sid).trim().toUpperCase();
      if (!seatIdVal) continue;
      const row = seatIdVal.charAt(0).toUpperCase();
      const type = RECLINER_ROWS.has(row) ? "recliner" : "standard";
      normalized.push({
        seatId: seatIdVal,
        type,
        price: deriveServerPrice(row),
      });
    }
  }
  return normalized;
}

// to create a booking
export async function createBooking(req, res) {
  try {
    const session = await createCheckoutSession({
      amount: doc.amountPaise,
      currency,
      booking,
      seatIdList,
      auditorium,
      showtime,
      clientUrl: CLIENT_URL,
    });

    booking.paymentSessionId = session.id;
    booking.stripeSession = {
      id: session.id,
      url: session.url || null,
    };

    await Booking.findByIdAndUpdate(booking._id, {
      paymentSessionId: session.id,
      stripeSession: booking.stripeSession,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created (pending payment)",
      booking: {
        id: booking._id,
        status: booking.status,
        amount: doc.amount,
        amountPaise: doc.amountPaise,
        currency: doc.currency,
      },
      checkout: {
        id: session.id,
        url: session.url,
      },
    });
  } catch (err) {
    await Booking.findByIdAndDelete(booking._id).catch(() => {});

    return res.status(500).json({
      success: false,
      message: "Failed to create Stripe session",
      error: err.message,
    });
  }
}

// Get Booking (all)

export async function getBooking(req, res) {
  try {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    const userId = req.user._id || req.user.id;
    const { paymentStatus, status } = req.query;

    const q = { userId: new mongoose.Types.ObjectId(userId) };

    // getBooking
    // if the caller explicitly requests "all" skip default filter
    if (paymentStatus && String(paymentStatus).toLowerCase() !== "all") {
      q.paymentStatus = String(paymentStatus).toLowerCase();
    } else if (status && String(status).toLowerCase() !== "all") {
      q.status = String(status).toLowerCase();
    } else {
      // default: show only paid bookings for users
      q.paymentStatus = "paid";
    }

    const items = await Booking.find(q).sort({ createdAt: -1 }).lean().exec();
    return res.json({ success: true, items });
  } catch (err) {
    console.error("getBooking error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

//listof bookings
export async function listBookings(req, res) {
  try {
    const { movieId, page = 1, limit = 100, paymentStatus, status } = req.query;
    const q = {};

    if (movieId) {
      if (mongoose.Types.ObjectId.isValid(String(movieId)))
        q.movieId = new mongoose.Types.ObjectId(String(movieId));
      else q.movieName = String(movieId);
    }
    // if the caller explicitly requests "all" skip default filter
    if (paymentStatus && String(paymentStatus).toLowerCase() !== "all") {
      q.paymentStatus = String(paymentStatus).toLowerCase();
    } else if (status && String(status).toLowerCase() !== "all") {
      q.status = String(status).toLowerCase();
    } else {
      // default: show only paid bookings for users
      q.paymentStatus = "paid";
    }

    const pg = Math.max(1, Number(page) || 1);
    const lim = Math.min(1000, Number(limit) || 100);
    const total = await Booking.countDocuments(q).exec();
    const items = await Booking.find(q)
      .sort({ createdAt: -1 })
      .skip((pg - 1) * lim)
      .limit(lim)
      .lean()
      .exec();
    return res.json({ success: true, total, page: pg, limit: lim, items });
  } catch (err) {
    console.error("listBooking error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

//DELETE BOOKING

export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        success: false,
        message: "Invailid id",
      });
    const b = await Booking.findByIdAndDelete(id).lean().exec();
    if (!b)
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    return res.json({ success: true, message: "Booking Deleted" });
  } catch (err) {
    console.error("deleteBooking error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// seat occupied function
export async function getOccupiedSeats(req, res) {
  try {
    const {
      movieId,
      movieName,
      showtime: showtimeRaw,
      audi: audiRaw,
    } = req.query;
    if (!showtimeRaw)
      return res
        .status(400)
        .json({ success: false, message: "showtime query param required" });

    const auditorium = String(audiRaw || req.query.auditorium || "Audi 1");
    let parsed;
    try {
      parsed = normalizeShowtimeToMinute(showtimeRaw);
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid showtime" });
    }

    const start = new Date(parsed);
    const end = new Date(start.getTime() + 60 * 1000);
    const q = {
      showtime: { $gte: start, $lt: end },
      auditorium,
      status: { $in: BLOCKING_STATUSES },
    };
    const movieClauses = buildMovieMatchClause(movieId, movieName);
    if (movieClauses.length > 0) q.$or = movieClauses;

    if (!Booking) {
      console.error("Booking model undefined");
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration (Booking model)",
      });
    }

    const docs = await Booking.find(q, { seats: 1 }).lean().exec();
    const occupiedSet = new Set();
    for (const d of docs || []) {
      const sarr = Array.isArray(d.seats) ? d.seats : [];
      for (const s of sarr) {
        if (!s) continue;
        let seatId = "";
        if (typeof s === "string") seatId = s.trim().toUpperCase();
        else if (s.seatId) seatId = String(s.seatId).trim().toUpperCase();
        else if (s.id) seatId = String(s.id).trim().toUpperCase();
        else if (s.number) seatId = String(s.number).trim().toUpperCase();
        if (seatId) occupiedSet.add(seatId);
      }
    }
    return res.json({ success: true, occupied: [...occupiedSet] });
  } catch (err) {
    console.error(
      "getOccupiedSeats error:",
      err && err.stack ? err.stack : err,
    );
    return res.status(500).json({
      success: false,
      message: "Server error while fetching occupied seats",
      error: String(err.message || err),
    });
  }
}

// confirm payment
export async function confirmPayment(req, res) {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res.status(400).json({
        success: false,
        message: "Session_id required",
      });

    const sessionObj = await stripe.checkout.sessions.retrieve(session_id);
    if (!sessionObj)
      return res
        .status(404)
        .json({ success: false, message: "failed to find session" });
    if (sessionObj.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "payment not completed",
      });
    }

    const bookingId = sessionObj.metadata?.bookingId;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingId in session metadata",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: "paid",
        status: "confirmed",
        paymentIntentId: sessionObj.payment_intent || "",
      },
      { new: true },
    ).exec();

    if (!booking)
      return res.status(404).json({
        success: false,
        message: "Booking not found for this session",
      });
    return res.json({ success: true, booking });
  } catch (err) {
    console.error("confirmpayment error:", err && err.stack ? err.stack : err);
    return res.status(500).json({
      success: false,
      message: "Server error ",
      error: String(err.message || err),
    });
  }
}

export default {
  createBooking,
  getBooking,
  listBookings,
  deleteBooking,
  getOccupiedSeats,
  confirmPayment,
};
