import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./contexts/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PiDashboard from "./pages/PiDashboard";
import PiControllerLayout from "./pages/PiControllerLayout";
import Clusters from "./pages/Clusters";
import ClusterDetails from "./pages/ClusterDetails";
import Nodes from "./pages/Nodes";
import Settings from "./pages/Settings";
import Hardware from "./pages/Hardware";
import GettingStarted from "./pages/GettingStarted";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Redirect root to Pi Controller */}
            <Route path="/" element={<Navigate to="/pi-controller" replace />} />
            
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />

            {/* Pi Controller with Sidebar Layout */}
            <Route path="/pi-controller" element={<PiControllerLayout />}>
              <Route index element={<PiDashboard />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="clusters" element={<Clusters />} />
              <Route path="clusters/:clusterId" element={<ClusterDetails />} />
              <Route path="nodes" element={<Nodes />} />
              <Route path="clusters/:clusterId/nodes/:nodeId" element={<PiDashboard />} />
              <Route path="clusters/:clusterId/nodes/:nodeId/hardware" element={<Hardware />} />
              <Route path="settings" element={<Settings />} />
              <Route path="documentation" element={<Documentation />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
