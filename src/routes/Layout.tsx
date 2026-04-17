import { Outlet, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';

export function Layout() {
  const nav = useNavigate();
  return (
    <div className="app-shell">
      <TopBar onMenu={() => nav('/menu')} />
      <Outlet />
    </div>
  );
}
