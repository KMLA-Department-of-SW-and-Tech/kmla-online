import React, { useEffect, useState } from "react";
import { useFetcher } from "react-router";

export default function KaraokeBookingModal({
  open,
  onClose,
  onBooked,
  bookings,
  weekdays,
  weekends,
  fixedTimes,
}) {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customTime, setCustomTime] = useState("");
  const fetcher = useFetcher();

  useEffect(() => {
    if (open) {
      setSelectedDay("");
      setSelectedTime("");
      setCustomTime("");
    }
  }, [open]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      onBooked?.();
      onClose();
    }
  }, [fetcher.data, onBooked, onClose]);

  if (!open) return null;

  const safeWeekdays = Array.isArray(weekdays) ? weekdays : [];
  const safeWeekends = Array.isArray(weekends) ? weekends : [];
  const safeTimes = Array.isArray(fixedTimes) ? fixedTimes : [];
  const isWeekend = safeWeekends.includes(selectedDay);
  const isWeekday = safeWeekdays.includes(selectedDay);
  const time = isWeekend ? customTime.trim() : selectedTime;
  const isSubmitting = fetcher.state === "submitting";

  const hasConflict = bookings.some(
    (b) => b.day_of_week === selectedDay && b.time_slot === time,
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedDay || !time) {
      alert("Select day and time.");
      return;
    }

    if (hasConflict) {
      alert("That slot is already booked.");
      return;
    }

    const payload = new FormData();
    payload.set("intent", "karaoke");
    payload.set("dayOfWeek", selectedDay);
    payload.set("timeSlot", time);

    fetcher.submit(payload, { method: "post" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-80 shadow-lg">
        <h2 className="text-lg font-bold mb-4 text-center">Karaoke Booking</h2>

        <div className="mb-4">
          <div className="font-semibold mb-2">Day</div>
          <div className="flex gap-2 flex-wrap">
            {[...safeWeekdays, ...safeWeekends].map((d) => (
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

        {isWeekday && (
          <div className="mb-4">
            <div className="font-semibold mb-2">Time</div>
            <div className="flex gap-2 flex-wrap">
              {safeTimes.map((t) => (
                <button
                  key={t}
                  className={`px-3 py-2 rounded border ${
                    selectedTime === t
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {isWeekend && (
          <div className="mb-4">
            <div className="font-semibold mb-2">Time (custom)</div>
            <input
              type="text"
              placeholder="Custom time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        )}

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
