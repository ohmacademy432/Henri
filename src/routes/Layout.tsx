import { Outlet } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useMenu } from '../lib/menu';

export function Layout() {
  const { open } = useMenu();
  return (
    <div className="app-shell">
      <TopBar onMenu={open} />
      <Outlet />
    </div>
  );
}
