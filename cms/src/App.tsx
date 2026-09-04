import { Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { useThemeSync } from "./hooks/useThemeSync";
import { Shell } from "./components/Shell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SectionsPage from "./pages/SectionsPage";
import SectionEditor from "./pages/SectionEditor";
import ProgramsPage from "./pages/ProgramsPage";
import ProgramEditor from "./pages/ProgramEditor";
import LessonsPage from "./pages/LessonsPage";
import MediaPage from "./pages/MediaPage";
import FaqsPage from "./pages/FaqsPage";
import TechnologiesPage from "./pages/TechnologiesPage";
import ThemePage from "./pages/ThemePage";
import SettingsPage from "./pages/SettingsPage";
import LeadsPage from "./pages/LeadsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import BookingsPage from "./pages/BookingsPage";

export default function App() {
  const { user, ready } = useAuth();

  // The CMS wears the palette it edits.
  useThemeSync();

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;
  }

  if (!user) return <Login />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sections" element={<SectionsPage />} />
        <Route path="/sections/:id" element={<SectionEditor />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramEditor />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/technologies" element={<TechnologiesPage />} />
        <Route path="/theme" element={<ThemePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="*" element={<p className="text-muted">That page does not exist.</p>} />
      </Routes>
    </Shell>
  );
}
