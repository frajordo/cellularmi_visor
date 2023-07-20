import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./login/Login"
import Visor from "./visor/Visor"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<Login />} />
          <Route path="visor" element={<Visor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}