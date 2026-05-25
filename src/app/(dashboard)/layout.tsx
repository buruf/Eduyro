// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Toaster } from "react-hot-toast";
import { NotificationListener } from "@/components/realtime/NotificationListener";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  return (
    <div className="min-h-screen bg-cream-dark">
      <NotificationListener />
      <Toaster
        toastOptions={{
          style: {
            background: "#fff",
            border: "1px solid #E8E0D0",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#1A1612",
            fontFamily: "DM Sans, system-ui, sans-serif",
            fontSize: "14px",
            maxWidth: "400px",
          },
        }}
      />
      {children}
    </div>
  );
}
