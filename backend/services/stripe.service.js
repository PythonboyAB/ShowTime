import stripe from "../config/stripe.js";

export async function createCheckoutSession({
  amount,
  currency,
  booking,
  seatIdList,
  auditorium,
  showtime,
  clientUrl,
}) {
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",

    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: booking.movie.title,
            description: `Seats: ${seatIdList.join(", ")}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],

    success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,

    metadata: {
      bookingId: String(booking._id),
      seats: JSON.stringify(seatIdList),
      auditorium,
      showtime: showtime.toISOString(),
    },
  });
}
