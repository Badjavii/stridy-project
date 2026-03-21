// ─── APP LAYOUT ───────────────────────────────────────────────────────────────
// Contenedor padre de todas las páginas autenticadas.
// Orquesta sidebar (desktop) + drawer (móvil) + topbar + contenido.

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useApp }  from '../../store/AppContext';
import Sidebar     from './Sidebar';
import Topbar      from './Topbar';
import Drawer      from './Drawer';
import BottomNav   from './BottomNav';
import styles      from './AppLayout.module.css';

export default function AppLayout() {
  const { loadAll, loaded } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Cargar todos los datos del usuario al montar el layout
  useEffect(() => {
    if (!loaded) loadAll();
  }, []);

  return (
    <div className={styles.layout}>

      {/* ── Desktop: sidebar fijo ── */}
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>

      {/* ── Móvil: drawer deslizable ── */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ── Área principal ── */}
      <div className={styles.main}>
        <Topbar onMenuClick={() => setDrawerOpen(true)} />

        <main className={styles.content}>
          {/* Outlet renderiza la página activa según la ruta */}
          <Outlet />
        </main>

        {/* ── Móvil: bottom nav ── */}
        <nav className={styles.bottomNav}>
          <BottomNav />
        </nav>
      </div>

    </div>
  );
}
