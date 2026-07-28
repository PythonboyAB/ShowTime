import React, { useEffect, useState } from "react";
import {
  bookingsPageStyles,
  formatTime,
  formatDuration,
} from "../assets/dummyStyles";
import QRCode from "qrcode";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Film, Clock, MapPin, QrCode, ChevronDown, X } from "lucide-react";

const API_BASE = "http://localhost:5000";

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    null
  );
}

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [qrs, setQrs] = useState({});
  const [expanded, setExpanded] = useState({});
  const [scannedDetails, setScannedDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function computeTotals(booking) {
    if (booking.amountPaise != null) {
      const amt = Number(booking.amountPaise) / 100;
      return { subtotal: amt, total: amt, seatCount: booking.seats?.length || 0 };
    }

    if (typeof booking.amount === "number") {
      return { subtotal: booking.amount, total: booking.amount, seatCount: booking.seats?.length || 0 };
    }

    const seats = booking.seats || [];
    const subtotal = seats.reduce((s, seat) => {
      if (seat?.price) return s + seat.price;
      return s;
    }, 0);

    return { subtotal, total: subtotal, seatCount: seats.length };
  }

  useEffect(() => {
    let mounted = true;

    async function fetchBookings() {
      try {
        const token = getStoredToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axios.get(`${API_BASE}/api/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const items = res.data?.items || [];

        const normalized = items.map((b) => ({
          id: b._id,
          title: b.movie?.title || "Untitled",
          poster: b.movie?.poster || "",
          category: b.movie?.category || "",
          durationMins: b.movie?.duration || 0,
          slotTime: b.showtime,
          auditorium: b.auditorium || "Audi 1",
          seats: b.seats || [],
          amount: b.amount || 0,
          amountPaise: b.amountPaise,
        }));

        if (mounted) setBookings(normalized);
      } catch (err) {
        setError("Failed to load bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchBookings();
    return () => (mounted = false);
  }, [navigate]);

  useEffect(() => {
    const makeQRs = async () => {
      const map = {};
      for (const b of bookings) {
        const payload = JSON.stringify({
          bookingId: b.id,
          title: b.title,
          time: formatTime(b.slotTime),
          auditorium: b.auditorium,
        });

        const url = await QRCode.toDataURL(payload);
        map[b.id] = { url, payload };
      }
      setQrs(map);
    };

    if (bookings.length) makeQRs();
  }, [bookings]);

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const closeModal = () => setScannedDetails(null);

  return (
    <div className={bookingsPageStyles.pageContainer}>
      <div className={bookingsPageStyles.mainContainer}>
        <h1 className={bookingsPageStyles.title}>Your Tickets</h1>

        {loading && <div>Loading Bookings...</div>}
        {!loading && error && <div>{error}</div>}

        <div className={bookingsPageStyles.grid}>
          {bookings.length === 0 && !loading ? (
            <div>No Bookings found.</div>
          ) : (
            bookings.map((b) => {
              const totals = computeTotals(b);
              const isOpen = expanded[b.id];

              return (
                <article key={b.id}>
                  <img
                    src={b.poster || "https://via.placeholder.com/150"}
                    alt={b.title}
                  />

                  <h2>
                    <Film size={16} /> {b.title}
                  </h2>

                  <div>
                    <Clock size={14} /> {formatTime(b.slotTime)}
                  </div>

                  <div>
                    <MapPin size={14} /> {b.auditorium}
                  </div>

                  <div>₹{totals.total}</div>

                  <button onClick={() => toggle(b.id)}>
                    {isOpen ? "Hide" : "View"} Details
                  </button>

                  {isOpen && (
                    <div>
                      <div>Seats: {totals.seatCount}</div>
                      {qrs[b.id]?.url && (
                        <img
                          src={qrs[b.id].url}
                          alt="QR"
                          onClick={() =>
                            setScannedDetails({
                              bookingId: b.id,
                              title: b.title,
                              time: formatTime(b.slotTime),
                              auditorium: b.auditorium,
                            })
                          }
                        />
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Modal */}
        {scannedDetails && (
          <div>
            <div>
              <h3>{scannedDetails.title}</h3>
              <div>Booking ID: {scannedDetails.bookingId}</div>
              <div>Time: {scannedDetails.time}</div>
              <div>Auditorium: {scannedDetails.auditorium}</div>

              <button onClick={closeModal}>
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
