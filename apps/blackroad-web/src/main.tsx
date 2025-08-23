import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./routes/Home";
import Lucidia from "./routes/Lucidia";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lucidia" element={<Lucidia />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
