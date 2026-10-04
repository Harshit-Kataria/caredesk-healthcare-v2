import React from 'react';
import { Route, Routes } from 'react-router-dom';

export const routePaths = Object.freeze({
  overview: '/',
  appointments: '/appointments',
  doctors: '/doctors',
  patients: '/patients',
  assistant: '/assistant'
});

export default function AppRoutes({ Dashboard, Appointments, Directory, Assistant }) {
  return (
    <Routes>
      <Route path={routePaths.overview} element={<Dashboard />} />
      <Route path={routePaths.appointments} element={<Appointments />} />
      <Route path={routePaths.doctors} element={<Directory type="doctors" />} />
      <Route path={routePaths.patients} element={<Directory type="patients" />} />
      <Route path={routePaths.assistant} element={<Assistant />} />
    </Routes>
  );
}
