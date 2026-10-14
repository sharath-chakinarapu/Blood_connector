import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FindDonors from "./pages/FindDonors";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedRoute roles={["HOSPITAL"]} />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<ProtectedRoute roles={["DONOR"]} />}>
              <Route path="/find-donors" element={<FindDonors />} />
            </Route>
            <Route path="/profile" element={<Profile />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/chats/:chatId" element={<Chats />} />
          </Route>
          <Route path="*" element={<main style={{ padding: 32 }}>Page not found.</main>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
