// ─── APP CONTEXT ──────────────────────────────────────────────────────────────
// Estado global de datos académicos: instituciones, materias, eventos, horario y amigos.
// Se carga una vez al iniciar sesión y se actualiza con cada acción CRUD.

import { createContext, useContext, useState, useCallback } from 'react';
import { getInstitutions } from '../api/institutions';
import { getSubjects }     from '../api/subjects';
import { getEvents }       from '../api/events';
import { getSchedule }     from '../api/schedule';
import { getFriends }      from '../api/friends';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [institutions, setInstitutions] = useState([]);
  const [subjects,     setSubjects]     = useState([]);
  const [events,       setEvents]       = useState([]);
  const [schedule,     setSchedule]     = useState([]);
  const [friends,      setFriends]      = useState([]);
  const [loaded,       setLoaded]       = useState(false);

  // Carga inicial — llamar una vez tras login
  const loadAll = useCallback(async () => {
    try {
      const [inst, subs, evs, sch, frs] = await Promise.all([
        getInstitutions(),
        getSubjects(),
        getEvents(),
        getSchedule(),
        getFriends(),
      ]);
      setInstitutions(inst);
      setSubjects(subs);
      setEvents(evs);
      setSchedule(sch);
      setFriends(frs);
      setLoaded(true);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }, []);

  // Reset al hacer logout
  const clearAll = () => {
    setInstitutions([]);
    setSubjects([]);
    setEvents([]);
    setSchedule([]);
    setFriends([]);
    setLoaded(false);
  };

  // ─── Helpers de actualización local (evitan re-fetch tras cada acción) ───────

  const addInstitution    = (inst) => setInstitutions(p => [...p, inst]);
  const editInstitution   = (id, data) => setInstitutions(p => p.map(i => i.id === id ? { ...i, ...data } : i));
  const removeInstitution = (id) => setInstitutions(p => p.filter(i => i.id !== id));

  const addSubject    = (sub) => setSubjects(p => [...p, sub]);
  const editSubject   = (id, data) => setSubjects(p => p.map(s => s.id === id ? { ...s, ...data } : s));
  const removeSubject = (id) => setSubjects(p => p.filter(s => s.id !== id));

  const addEvent    = (ev) => setEvents(p => [...p, ev]);
  const editEvent   = (id, data) => setEvents(p => p.map(e => e.id === id ? { ...e, ...data } : e));
  const removeEvent = (id) => setEvents(p => p.filter(e => e.id !== id));

  const addSlot    = (slot) => setSchedule(p => [...p, slot]);
  const editSlot   = (id, data) => setSchedule(p => p.map(s => s.id === id ? { ...s, ...data } : s));
  const removeSlot = (id) => setSchedule(p => p.filter(s => s.id !== id));

  const addFriend    = (fr) => setFriends(p => [...p, fr]);
  const removeFriend = (id) => setFriends(p => p.filter(f => f.id !== id));

  // Actualizar notas de una materia localmente
  const updateSubjectGrades = (subjectId, grades) =>
    setSubjects(p => p.map(s => s.id === subjectId ? { ...s, grades } : s));

  return (
    <AppContext.Provider value={{
      institutions, subjects, events, schedule, friends, loaded,
      loadAll, clearAll,
      addInstitution, editInstitution, removeInstitution,
      addSubject, editSubject, removeSubject,
      addEvent, editEvent, removeEvent,
      addSlot, editSlot, removeSlot,
      addFriend, removeFriend,
      updateSubjectGrades,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
