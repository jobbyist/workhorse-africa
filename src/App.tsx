import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Luxury from "./pages/Luxury";
import Marketplace from "./pages/Marketplace";
import RentalDetail from "./pages/RentalDetail";
import P2PDetail from "./pages/P2PDetail";
import ListRental from "./pages/ListRental";
import MyRentals from "./pages/MyRentals";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="/luxury" element={<Luxury />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/rental/:id" element={<RentalDetail />} />
      <Route path="/p2p/:id" element={<P2PDetail />} />
      <Route path="/list-rental" element={<ListRental />} />
      <Route path="/my-rentals" element={<MyRentals />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;
