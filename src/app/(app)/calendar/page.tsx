import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ActivityCalendar } from "@/app/(app)/reservations/ReservationsCalendar";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <ActivityCalendar />
    </div>
  );
}
