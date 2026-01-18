export async function listDayOfWeek(supabase) {
  return supabase
    .from("day_of_week")
    .select("id, name_kr, is_weekday")
    .order("id", { ascending: true });
}

export async function listClassPeriods(supabase) {
  return supabase
    .from("class_period")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
}

export async function listPlaces(supabase) {
  return supabase
    .from("place")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("id", { ascending: true });
}

export async function listTimeSlots(supabase) {
  return supabase
    .from("time_slot")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
}
