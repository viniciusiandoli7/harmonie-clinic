import Sidebar from "@/components/layout/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#FAF8F4]">
      <Sidebar />
      <main className="flex-1 bg-[#FAF8F4]" />
    </div>
  );
}
