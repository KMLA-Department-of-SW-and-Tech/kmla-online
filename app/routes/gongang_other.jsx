import { useState } from "react";
import { redirect, useLoaderData, useRevalidator } from "react-router";
import BookingModal from "../BookingModal";
import FreeBookingModal from "../FreeBookingModal";
import KaraokeBookingModal from "../KaraokeBookingModal";
import { createClient } from "../lib/server";
import {
  createFreeBooking,
  createGongangBooking,
  createKaraokeBooking,
  listFreeBookings,
  listGongangBookings,
  listKaraokeBookings,
} from "../models/bookings.server";
import {
  listClassPeriods,
  listDayOfWeek,
  listPlaces,
  listTimeSlots,
} from "../models/reference.server";

export async function loader({ request }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?redirectTo=${redirectTo}`);
  }

  const [gongang, free, karaoke, dayRows, classRows, placeRows, timeRows] =
    await Promise.all([
      listGongangBookings(supabase),
      listFreeBookings(supabase),
      listKaraokeBookings(supabase),
      listDayOfWeek(supabase),
      listClassPeriods(supabase),
      listPlaces(supabase),
      listTimeSlots(supabase),
    ]);

  if (gongang.error)
    console.error("Failed to load gongang bookings", gongang.error);
  if (free.error) console.error("Failed to load free bookings", free.error);
  if (karaoke.error)
    console.error("Failed to load karaoke bookings", karaoke.error);
  if (dayRows.error) console.error("Failed to load days", dayRows.error);
  if (classRows.error)
    console.error("Failed to load class periods", classRows.error);
  if (placeRows.error) console.error("Failed to load places", placeRows.error);
  if (timeRows.error)
    console.error("Failed to load time slots", timeRows.error);

  return Response.json(
    {
      gongangBookings: gongang.data ?? [],
      freeBookings: free.data ?? [],
      karaokeBookings: karaoke.data ?? [],
      days: (dayRows.data ?? []).map((row) => row.name_kr),
      weekdayDays: (dayRows.data ?? [])
        .filter((row) => row.is_weekday)
        .map((row) => row.name_kr),
      weekendDays: (dayRows.data ?? [])
        .filter((row) => !row.is_weekday)
        .map((row) => row.name_kr),
      classPeriods: (classRows.data ?? []).map((row) => row.name),
      places: (placeRows.data ?? []).map((row) => row.name),
      timeSlots: (timeRows.data ?? []).map((row) => row.name),
    },
    { headers },
  );
}

export async function action({ request }) {
  const { supabase, headers } = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?redirectTo=${redirectTo}`);
  }

  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  if (intent === "gongang") {
    const classPeriod = String(form.get("classPeriod") || "");
    const dayOfWeek = String(form.get("dayOfWeek") || "");
    const place = String(form.get("place") || "");
    const purpose = String(form.get("purpose") || "").trim();

    if (!classPeriod || !dayOfWeek || !place || !purpose) {
      return Response.json({ ok: false }, { status: 400, headers });
    }

    const { error } = await createGongangBooking(supabase, {
      user_id: session.user.id,
      class_period: classPeriod,
      day_of_week: dayOfWeek,
      place,
      purpose,
    });

    if (error) {
      console.error("Failed to create booking", error);
      return Response.json({ ok: false }, { status: 400, headers });
    }

    return Response.json({ ok: true }, { headers });
  }

  if (intent === "free") {
    const dayOfWeek = String(form.get("dayOfWeek") || "");
    const timeSlot = String(form.get("timeSlot") || "");
    const place = String(form.get("place") || "");
    const purpose = String(form.get("purpose") || "").trim();

    if (!dayOfWeek || !timeSlot || !place || !purpose) {
      return Response.json({ ok: false }, { status: 400, headers });
    }

    const { error } = await createFreeBooking(supabase, {
      user_id: session.user.id,
      day_of_week: dayOfWeek,
      time_slot: timeSlot,
      place,
      purpose,
    });

    if (error) {
      console.error("Failed to create free booking", error);
      return Response.json({ ok: false }, { status: 400, headers });
    }

    return Response.json({ ok: true }, { headers });
  }

  if (intent === "karaoke") {
    const dayOfWeek = String(form.get("dayOfWeek") || "");
    const timeSlot = String(form.get("timeSlot") || "");

    if (!dayOfWeek || !timeSlot) {
      return Response.json({ ok: false }, { status: 400, headers });
    }

    const { error } = await createKaraokeBooking(supabase, {
      user_id: session.user.id,
      day_of_week: dayOfWeek,
      time_slot: timeSlot,
    });

    if (error) {
      console.error("Failed to create karaoke booking", error);
      return Response.json({ ok: false }, { status: 400, headers });
    }

    return Response.json({ ok: true }, { headers });
  }

  return Response.json({ ok: false }, { status: 400, headers });
}

export default function GongangBookingPage() {
  const {
    gongangBookings,
    freeBookings,
    karaokeBookings,
    days,
    weekdayDays,
    weekendDays,
    classPeriods,
    places,
    timeSlots,
  } = useLoaderData();
  const [selectedDay, setSelectedDay] = useState({});
  const [openModal, setOpenModal] = useState(null);
  const [openFreeModal, setOpenFreeModal] = useState(false);
  const [openKaraokeModal, setOpenKaraokeModal] = useState(false);
  const revalidator = useRevalidator();

  const toggleSelect = (cls, day) => {
    const key = `${cls}-${day}`;
    setSelectedDay((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBooked = () => {
    if (openModal) toggleSelect(openModal.classPeriod, openModal.dayOfWeek);
    revalidator.revalidate();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <img
          src="/clipboard-outline.svg"
          alt="Clipboard"
          className="w-30px h-30px ml-24px"
        />
        Booking
      </h1>

      <BookingModal
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        onBooked={handleBooked}
        bookedPlaces={gongangBookings}
        places={places}
      />

      <div className="flex justify-between items-center gap-2">
        <div className="text-base font-bold mb-4">Gongang Booking</div>
        <div className="text-xs text-gray-500 mb-2">Weekly reset notice.</div>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        {classPeriods.map((cls, rowIdx) => (
          <div key={cls} className="flex items-center gap-2">
            <div className="text-xs w-16 pl-4 font-semibold flex items-center justify-center">
              {cls}
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1 pr-4">
              {days.map((day) => {
                const key = `${cls}-${day}`;
                const bookedCount = gongangBookings.filter(
                  (b) => b.class_period === cls && b.day_of_week === day,
                ).length;
                const isFullyBooked = bookedCount >= places.length;

                return (
                  <div
                    key={key}
                    className="flex flex-col items-center relative"
                  >
                    {rowIdx === 0 && (
                      <span className="absolute -top-6 text-sm font-medium">
                        {day}
                      </span>
                    )}
                    <button
                      className={`w-10 h-10 rounded transition-colors ${
                        selectedDay[key]
                          ? "bg-green-500 text-white"
                          : isFullyBooked
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gray-200 hover:bg-green-200"
                      }`}
                      onClick={() =>
                        !isFullyBooked &&
                        setOpenModal({ classPeriod: cls, dayOfWeek: day })
                      }
                      disabled={isFullyBooked}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <FreeBookingModal
        open={openFreeModal}
        onClose={() => setOpenFreeModal(false)}
        onBooked={handleBooked}
        bookings={freeBookings}
        days={days}
        defaultTimes={timeSlots}
        defaultPlaces={places}
      />

      <button
        onClick={() => setOpenFreeModal(true)}
        className="mt-6 w-full p-2 border rounded text-left"
      >
        Free booking &gt;
      </button>

      <KaraokeBookingModal
        open={openKaraokeModal}
        onClose={() => setOpenKaraokeModal(false)}
        onBooked={handleBooked}
        bookings={karaokeBookings}
        weekdays={weekdayDays}
        weekends={weekendDays}
        fixedTimes={timeSlots}
      />

      <div className="mt-3">
        <button
          onClick={() => setOpenKaraokeModal(true)}
          className="mt-2 p-2 border rounded w-full text-left"
        >
          Karaoke booking &gt;
        </button>
      </div>
    </div>
  );
}
