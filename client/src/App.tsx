import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import ProgramPage from "./pages/ProgramPage";
import LessonPage from "./pages/LessonPage";
import BookPage from "./pages/BookPage";
import { PageState } from "./components/PageState";
import { LiveUpdateToast } from "./realtime/RealtimeProvider";
import { useThemeSync } from "./hooks/useThemeSync";

export default function App() {
  // Keeps :root in step with the palette the CMS is publishing.
  useThemeSync();

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/programs/:slug" element={<ProgramPage />} />
        <Route path="/watch/:programSlug/:lessonSlug" element={<LessonPage />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="*" element={<PageState kind="empty" message="That page does not exist." />} />
      </Routes>
      <LiveUpdateToast />
    </>
  );
}
