import React, { useEffect, useState } from "react";
import { useFetcher } from "react-router";

export default function FreeBookingModal({
  open,
  onClose,
  onBooked,
  bookings,
  days,
  defaultTimes,
  defaultPlaces,
}) {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [customPlace, setCustomPlace] = useState("");
  const [purpose, setPurpose] = useState("");
  const fetcher = useFetcher();

  useEffect(() => {
    if (open) {
      setSelectedDay("");
      setSelectedTime("");
      setCustomTime("");
      setSelectedPlace("");
      setCustomPlace("");
      setPurpose("");
    }
  }, [open]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      onBooked?.();
      onClose();
    }
  }, [fetcher.data, onBooked, onClose]);

  if (!open) return null;

  const safeDays = Array.isArray(days) ? days : [];
  const safeTimes = Array.isArray(defaultTimes) ? defaultTimes : [];
  const safePlaces = Array.isArray(defaultPlaces) ? defaultPlaces : [];
  const time = selectedTime === "Custom" ? customTime.trim() : selectedTime;
  const place = selectedPlace === "Custom" ? customPlace.trim() : selectedPlace;
  const isSubmitting = fetcher.state === "submitting";

  const hasConflict = bookings.some(
    (b) =>
      b.day_of_week === selectedDay &&
      b.time_slot === time &&
      b.place === place,
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedDay || !time || !place || !purpose.trim()) {
      alert("Select day, time, place, and purpose.");
      return;
    }

    if (hasConflict) {
      alert("That slot is already booked.");
      return;
    }

    const payload = new FormData();
    payload.set("intent", "free");
    payload.set("dayOfWeek", selectedDay);
    payload.set("timeSlot", time);
    payload.set("place", place);
    payload.set("purpose", purpose.trim());

    fetcher.submit(payload, { method: "post" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-80 shadow-lg">
        <h2 className="text-lg font-bold mb-4 text-center">Free Booking</h2>

        <div className="mb-4">
          <div className="font-semibold mb-2">Day</div>
          <div className="flex gap-2 flex-wrap">
            {safeDays.map((d) => (
              <button
                key={d}
                className={`px-3 py-2 rounded border ${
                  selectedDay === d ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedDay(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="font-semibold mb-2">Time</div>
          <div className="flex gap-2 flex-wrap">
            {safeTimes.map((t) => (
              <button
                key={t}
                className={`px-3 py-2 rounded border ${
                  selectedTime === t ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedTime(t)}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              className={`px-3 py-2 rounded border ${
                selectedTime === "Custom"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setSelectedTime("Custom")}
            >
              Custom
            </button>
          </div>
          {selectedTime === "Custom" && (
            <input
              type="text"
              placeholder="Custom time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="mt-2 w-full border p-2 rounded"
            />
          )}
        </div>

        <div className="mb-4">
          <div className="font-semibold mb-2">Place</div>
          <div className="flex gap-2 flex-wrap">
            {safePlaces.map((p) => (
              <button
                key={p}
                className={`px-3 py-2 rounded border ${
                  selectedPlace === p
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setSelectedPlace(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={`px-3 py-2 rounded border ${
                selectedPlace === "Custom"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setSelectedPlace("Custom")}
            >
              Custom
            </button>
          </div>
          {selectedPlace === "Custom" && (
            <input
              type="text"
              placeholder="Custom place"
              value={customPlace}
              onChange={(e) => setCustomPlace(e.target.value)}
              className="mt-2 w-full border p-2 rounded"
            />
          )}
        </div>

        <input
          type="text"
          placeholder="Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Book"}
          </button>
        </div>
      </div>
    </div>
  );
}
