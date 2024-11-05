import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // 추가된 import

import KioskScreen from "./pages/KioskScreen";
import DashboardPage from "./pages/Dashboard";
import BankLayout from "./pages/BankLayout";
import PreviewModal from "./pages/PreviewModal";
import SweetAlert2 from "./SweetAlert2";

const queryClient = new QueryClient(); // QueryClient 인스턴스 생성

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {" "}
          {/* QueryClientProvider 추가 */}
          <SweetAlert2 />
          <Routes>
            <Route path="/" element={<KioskScreen />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/layout" element={<BankLayout />} />
            <Route path="/preview" element={<PreviewModal />} />
          </Routes>
        </QueryClientProvider>{" "}
        {/* QueryClientProvider 닫기 */}
      </BrowserRouter>
    </div>
  );
}

export default App;
