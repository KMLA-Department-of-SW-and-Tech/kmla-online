export async function listGongangBookings(supabase) {
  return supabase
    .from("gongang_bookings")
    .select("id, user_id, class_period, day_of_week, place, purpose")
    .is("deleted_at", null);
}

export async function createGongangBooking(supabase, payload) {
  return supabase.from("gongang_bookings").insert(payload).select().single();
}

export async function listFreeBookings(supabase) {
  return supabase
    .from("free_bookings")
    .select("id, user_id, day_of_week, time_slot, place, purpose")
    .is("deleted_at", null);
}

export async function createFreeBooking(supabase, payload) {
  return supabase.from("free_bookings").insert(payload).select().single();
}

export async function listKaraokeBookings(supabase) {
  return supabase
    .from("karaoke_bookings")
    .select("id, user_id, day_of_week, time_slot")
    .is("deleted_at", null);
}

export async function createKaraokeBooking(supabase, payload) {
  return supabase.from("karaoke_bookings").insert(payload).select().single();
}
