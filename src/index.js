import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import App from './App';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import ProductsTabs from './components/ProductsTabs';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/price-confirm/:id" replace />, 
  },
  {
    path: "/price-confirm/:id",
    element: <ProductsTabs />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);