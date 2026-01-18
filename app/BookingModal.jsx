import React, { useEffect, useState } from "react";
import { useFetcher } from "react-router";

export default function BookingModal({
  openModal,
  onClose,
  onBooked,
  bookedPlaces,
  places,
}) {
  const [selectedPlace, setSelectedPlace] = useState("");
  const [purpose, setPurpose] = useState("");
  const fetcher = useFetcher();
  const safePlaces = Array.isArray(places) ? places : [];

  useEffect(() => {
    if (openModal) {
      setSelectedPlace("");
      setPurpose("");
    }
  }, [openModal]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      onBooked?.();
      onClose();
    }
  }, [fetcher.data, onBooked, onClose]);

  if (!openModal) return null;

  const isSubmitting = fetcher.state === "submitting";
  const hasConflict = bookedPlaces.some(
    (b) =>
      b.place === selectedPlace &&
      b.class_period === openModal.classPeriod &&
      b.day_of_week === openModal.dayOfWeek,
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedPlace) {
      alert("Select a place.");
      return;
    }
    if (!purpose) {
      alert("Enter a purpose.");
      return;
    }

    if (hasConflict) {
      alert("That slot is already booked.");
      return;
    }

    const payload = new FormData();
    payload.set("intent", "gongang");
    payload.set("classPeriod", openModal.classPeriod);
    payload.set("dayOfWeek", openModal.dayOfWeek);
    payload.set("place", selectedPlace);
    payload.set("purpose", purpose);

    fetcher.submit(payload, { method: "post" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-80 shadow-lg">
        <h2 className="text-lg font-bold mb-4 text-center">
          Booking: {openModal.classPeriod} - {openModal.dayOfWeek}
        </h2>

        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          {safePlaces.map((place) => {
            const key = `${openModal.classPeriod}-${openModal.dayOfWeek}-${place}`;

            const isBooked = bookedPlaces.some(
              (b) =>
                b.place === place &&
                b.class_period === openModal.classPeriod &&
                b.day_of_week === openModal.dayOfWeek,
            );
            const isSelected = selectedPlace === place;

            return (
              <button
                key={key}
                className={`px-3 py-2 rounded-md border transition-colors ${
                  isBooked
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isSelected
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 hover:bg-green-200"
                }`}
                onClick={() => !isBooked && setSelectedPlace(place)}
                disabled={isBooked}
              >
                {place} {isBooked ? "(Booked)" : ""}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full border p-2 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
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
