import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardWithLogs from "./pages/DashboardWithLogs";
import Displays from "./pages/Displays";
import Layouts from "./pages/Layouts";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DisplayPreview from "./components/DisplayPreview";
import AuthGuard from "./components/AuthGuard";
import UserProfile from "./pages/UserProfile";
import CreateDisplay from "./pages/CreateDisplay";
import EditDisplay from "./pages/EditDisplay";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Support from "./pages/Support";
import Documentation from "./pages/Documentation";
import FAQ from "./pages/FAQ";
import Schedules from "./pages/Schedules";
import MediaLibrary from "./pages/MediaLibrary";
import ErrorBoundary from "./components/ErrorBoundary";
import BrinkyAssistant from "./components/BrinkyAssistant";
import ApiConfigWarning from "./components/ApiConfigWarning";
import Terms from "./pages/Terms";
import TourGuide from "./components/TourGuide";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected routes - Wrap in AuthGuard */}
            <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
              <Route path="dashboard" element={<>
                <ApiConfigWarning />
                <DashboardWithLogs />
              </>} />
              <Route path="displays" element={<>
                <ApiConfigWarning />
                <Displays />
              </>} />
              <Route path="displays/create" element={<>
                <ApiConfigWarning />
                <CreateDisplay />
              </>} />
              <Route path="displays/edit/:id" element={<>
                <ApiConfigWarning />
                <EditDisplay />
              </>} />
              <Route path="layouts" element={<>
                <ApiConfigWarning />
                <Layouts />
              </>} />
              <Route path="schedules" element={<>
                <ApiConfigWarning />
                <Schedules />
              </>} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="about" element={<About />} />
              <Route path="support" element={<Support />} />
              <Route path="docs" element={<Documentation />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="media-library" element={<>
                <ApiConfigWarning />
                <MediaLibrary />
              </>} />
            </Route>

            {/* Display preview page */}
            <Route path="/display/:id" element={<AuthGuard><DisplayPreview /></AuthGuard>} />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <TourGuide />
          <BrinkyAssistant />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
