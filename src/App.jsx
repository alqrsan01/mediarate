import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";
import Navbar from "./components/Navbar";
import MyList from "./pages/MyList";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PersonDetail from "./pages/PersonDetail";
import BrowseMovies from "./pages/BrowseMovies";
import Settings from "./pages/Settings";
import CollectionDetail from "./pages/CollectionDetail";
import MoviePhotos from "./pages/MoviePhotos";
import FullCast from "./pages/FullCast";
import TVDetail from "./pages/TVDetail";
import TVSeason from "./pages/TVSeason";
import BrowseTV from "./pages/BrowseTV";
import TVPhotos from "./pages/TVPhotos";
import TVFullCast from "./pages/TVFullCast";
import CompanyDetail from "./pages/CompanyDetail";
import KeywordDetail from "./pages/KeywordDetail";
import YearInReview from "./pages/YearInReview";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-950" />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-gray-950" />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />

      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        }
      />

      <Route
        path="/movie/:id"
        element={
          <ProtectedRoute>
            <MovieDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-list"
        element={
          <ProtectedRoute>
            <MyList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/person/:id"
        element={
          <ProtectedRoute>
            <PersonDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="movies"
        element={
          <ProtectedRoute>
            <BrowseMovies />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/collection/:id"
        element={
          <ProtectedRoute>
            <CollectionDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/movie/:id/photos"
        element={
          <ProtectedRoute>
            <MoviePhotos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/movie/:id/cast"
        element={
          <ProtectedRoute>
            <FullCast />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tv/:id"
        element={
          <ProtectedRoute>
            <TVDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tv/:id/season/:season"
        element={
          <ProtectedRoute>
            <TVSeason />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tv/:id/photos"
        element={
          <ProtectedRoute>
            <TVPhotos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tv/:id/cast"
        element={
          <ProtectedRoute>
            <TVFullCast />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tv"
        element={
          <ProtectedRoute>
            <BrowseTV />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/:id"
        element={
          <ProtectedRoute>
            <CompanyDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/keyword/:id"
        element={
          <ProtectedRoute>
            <KeywordDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/year-in-review"
        element={
          <ProtectedRoute>
            <YearInReview />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
