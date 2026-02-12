import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, Clock, Plus, Trash2, Play, Download, Eye, Filter, Link } from 'lucide-react';
import './App.css';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function App() {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [viewMode, setViewMode] = useState('general');
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [activeTab, setActiveTab] = useState('teachers');

  const [timeSlots] = useState([
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ]);

  const [newTeacher, setNewTeacher] = useState({ name: '', maxHours: 20 });
  const [newCourse, setNewCourse] = useState({ name: '', duration: 1 });
  const [newGroup, setNewGroup] = useState({ name: '', capacity: 30 });
  const [newRestriction, setNewRestriction] = useState({ teacherId: '', day: '', timeSlot: '' });
  const [newAssignment, setNewAssignment] = useState({ teacherId: '', courseId: '', groupId: '', hoursPerWeek: 2 });

  useEffect(() => {
    const saved = localStorage.getItem('scheduleData');
    if (saved) {
      const data = JSON.parse(saved);
      setTeachers(data.teachers || []);
      setCourses(data.courses || []);
      setGroups(data.groups || []);
      setRestrictions(data.restrictions || []);
      setAssignments(data.assignments || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scheduleData', JSON.stringify({ teachers, courses, groups, restrictions, assignments }));
  }, [teachers, courses, groups, restrictions, assignments]);

  const addTeacher = () => {
    if (newTeacher.name.trim()) {
      setTeachers([...teachers, { ...newTeacher, id: Date.now() }]);
      setNewTeacher({ name: '', maxHours: 20 });
    }
  };

  const addCourse = () => {
    if (newCourse.name.trim()) {
      setCourses([...courses, { ...newCourse, id: Date.now() }]);
      setNewCourse({ name: '', duration: 1 });
    }
  };

  const addGroup = () => {
    if (newGroup.name.trim()) {
      setGroups([...groups, { ...newGroup, id: Date.now() }]);
      setNewGroup({ name: '', capacity: 30 });
    }
  };

  const addRestriction = () => {
    if (newRestriction.teacherId && newRestriction.day && newRestriction.timeSlot) {
      setRestrictions([...restrictions, { ...newRestriction, id: Date.now() }]);
      setNewRestriction({ teacherId: '', day: '', timeSlot: '' });
    }
  };

  const addAssignment = () => {
    const { teacherId, courseId, groupId, hoursPerWeek } = newAssignment;
    if (!teacherId || !courseId || !groupId || !hoursPerWeek) return;
    const exists = assignments.some(a => a.teacherId === teacherId && a.courseId === courseId && a.groupId === groupId);
    if (exists) { alert('Ya existe esa asignación'); return; }
    setAssignments([...assignments, { ...newAssignment, id: Date.now() }]);
    setNewAssignment({ teacherId, courseId: '', groupId: '', hoursPerWeek: 2 });
  };

  const deleteTeacher = (id) => {
    setTeachers(teachers.filter(t => t.id !== id));
    setAssignments(assignments.filter(a => a.teacherId !== id.toString()));
    setRestrictions(restrictions.filter(r => r.teacherId !== id.toString()));
  };
  const deleteCourse = (id) => { setCourses(courses.filter(c => c.id !== id)); setAssignments(assignments.filter(a => a.courseId !== id.toString())); };
  const deleteGroup = (id) => { setGroups(groups.filter(g => g.id !== id)); setAssignments(assignments.filter(a => a.groupId !== id.toString())); };
  const deleteRestriction = (id) => setRestrictions(restrictions.filter(r => r.id !== id));
  const deleteAssignment = (id) => setAssignments(assignments.filter(a => a.id !== id));

  const getTeacher = (id) => teachers.find(t => t.id.toString() === id.toString());
  const getCourse  = (id) => courses.find(c => c.id.toString() === id.toString());
  const getGroup   = (id) => groups.find(g => g.id.toString() === id.toString());

  const teacherAssignedHours = (teacherId) =>
    assignments.filter(a => a.teacherId === teacherId.toString()).reduce((sum, a) => sum + Number(a.hoursPerWeek), 0);

  const generateSchedule = () => {
    if (assignments.length === 0) {
      alert('Debes agregar al menos una asignación (Profesor → Curso → Grupo)');
      return;
    }
    const scheduled = [];
    for (const assignment of assignments) {
      const teacher = getTeacher(assignment.teacherId);
      const course  = getCourse(assignment.courseId);
      const group   = getGroup(assignment.groupId);
      if (!teacher || !course || !group) continue;
      const sessionsNeeded = Math.ceil(Number(assignment.hoursPerWeek) / Number(course.duration));
      let sessionsScheduled = 0;
      for (const day of DAYS) {
        if (sessionsScheduled >= sessionsNeeded) break;
        for (let i = 0; i < timeSlots.length; i++) {
          if (sessionsScheduled >= sessionsNeeded) break;
          const isRestricted = restrictions.some(r => r.teacherId === teacher.id.toString() && r.day === day && r.timeSlot === timeSlots[i]);
          if (isRestricted) continue;
          let slotsAvailable = true;
          for (let j = 0; j < course.duration; j++) {
            if (!timeSlots[i + j]) { slotsAvailable = false; break; }
            const conflict = scheduled.some(s => s.day === day && s.timeSlot === timeSlots[i + j] && (s.teacher.id === teacher.id || s.group.id === group.id));
            if (conflict) { slotsAvailable = false; break; }
          }
          if (!slotsAvailable) continue;
          for (let j = 0; j < course.duration; j++) {
            scheduled.push({
              id: Date.now() + Math.random(),
              teacher, course, group,
              day, timeSlot: timeSlots[i + j],
              slotPart: j === 0 ? 'start' : (j === course.duration - 1 ? 'end' : 'middle')
            });
          }
          sessionsScheduled++;
        }
      }
    }
    setSchedule(scheduled);
    setViewMode('general');
  };

  const exportSchedule = () => {
    const data = { teachers, courses, groups, restrictions, assignments, schedule, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horario-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const renderScheduleGrid = () => {
    if (!schedule) return null;
    let filtered = schedule;
    if (viewMode === 'teacher' && selectedFilter) filtered = schedule.filter(s => s.teacher.id === selectedFilter);
    else if (viewMode === 'group' && selectedFilter) filtered = schedule.filter(s => s.group.id === selectedFilter);
    return (
      <div className="schedule-grid">
        <div className="grid-header">
          <div className="time-column">Hora</div>
          {DAYS.map(day => <div key={day} className="day-column">{day}</div>)}
        </div>
        {timeSlots.map(timeSlot => (
          <div key={timeSlot} className="grid-row">
            <div className="time-cell">{timeSlot}</div>
            {DAYS.map(day => {
              const items = filtered.filter(s => s.day === day && s.timeSlot === timeSlot && s.slotPart === 'start');
              return (
                <div key={`${day}-${timeSlot}`} className="schedule-cell">
                  {items.map(item => (
                    <div key={item.id} className="assignment-card"
                      style={{ background: `hsl(${item.course.id % 360}, 65%, 88%)`, borderLeftColor: `hsl(${item.course.id % 360}, 65%, 45%)` }}>
                      <div className="assignment-course">{item.course.name}</div>
                      <div className="assignment-info">
                        {viewMode !== 'group'   && <span>👥 {item.group.name}</span>}
                        {viewMode !== 'teacher' && <span>👤 {item.teacher.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo"><Calendar size={32} /><h1>Generador de Horarios Académicos</h1></div>
          <p className="subtitle">Organiza profesores, cursos y grupos de manera eficiente</p>
        </div>
      </header>

      <div className="main-content">
        {!schedule ? (
          <div className="setup-container">
            <div className="tabs">
              {[
                { key: 'teachers',     icon: <Users size={16} />,    label: 'Profesores',    count: teachers.length },
                { key: 'courses',      icon: <BookOpen size={16} />, label: 'Cursos',         count: courses.length },
                { key: 'groups',       icon: <Users size={16} />,    label: 'Grupos',         count: groups.length },
                { key: 'assignments',  icon: <Link size={16} />,     label: 'Asignaciones',  count: assignments.length },
                { key: 'restrictions', icon: <Clock size={16} />,    label: 'Restricciones', count: restrictions.length },
              ].map(tab => (
                <button key={tab.key} className={activeTab === tab.key ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab.key)}>
                  {tab.icon} {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === 'teachers' && (
                <div className="section">
                  <h2>Profesores</h2>
                  <div className="form-row">
                    <input type="text" placeholder="Nombre del profesor" value={newTeacher.name}
                      onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                      onKeyPress={e => e.key === 'Enter' && addTeacher()} />
                    <input type="number" placeholder="Horas máx/semana" style={{ width: 170 }} value={newTeacher.maxHours}
                      onChange={e => setNewTeacher({ ...newTeacher, maxHours: parseInt(e.target.value) })} />
                    <button onClick={addTeacher} className="btn-add"><Plus size={16} /> Agregar</button>
                  </div>
                  <div className="item-list">
                    {teachers.map(t => {
                      const assigned = teacherAssignedHours(t.id);
                      return (
                        <div key={t.id} className="item-card">
                          <div className="item-info">
                            <strong>{t.name}</strong>
                            <span className="item-meta">
                              Máx: {t.maxHours}h/sem
                              {assigned > 0 && <> · Asignadas: <b style={{ color: assigned > t.maxHours ? '#e53e3e' : '#38a169' }}>{assigned}h</b></>}
                            </span>
                          </div>
                          <button onClick={() => deleteTeacher(t.id)} className="btn-delete"><Trash2 size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="section">
                  <h2>Cursos</h2>
                  <div className="form-row">
                    <input type="text" placeholder="Nombre del curso" value={newCourse.name}
                      onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                      onKeyPress={e => e.key === 'Enter' && addCourse()} />
                    <input type="number" placeholder="Duración sesión (h)" style={{ width: 180 }} value={newCourse.duration}
                      onChange={e => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) })} />
                    <button onClick={addCourse} className="btn-add"><Plus size={16} /> Agregar</button>
                  </div>
                  <div className="item-list">
                    {courses.map(c => (
                      <div key={c.id} className="item-card">
                        <div className="item-info">
                          <strong>{c.name}</strong>
                          <span className="item-meta">{c.duration}h por sesión</span>
                        </div>
                        <button onClick={() => deleteCourse(c.id)} className="btn-delete"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="section">
                  <h2>Grupos</h2>
                  <div className="form-row">
                    <input type="text" placeholder="Nombre del grupo" value={newGroup.name}
                      onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                      onKeyPress={e => e.key === 'Enter' && addGroup()} />
                    <input type="number" placeholder="Capacidad" style={{ width: 120 }} value={newGroup.capacity}
                      onChange={e => setNewGroup({ ...newGroup, capacity: parseInt(e.target.value) })} />
                    <button onClick={addGroup} className="btn-add"><Plus size={16} /> Agregar</button>
                  </div>
                  <div className="item-list">
                    {groups.map(g => (
                      <div key={g.id} className="item-card">
                        <div className="item-info">
                          <strong>{g.name}</strong>
                          <span className="item-meta">Capacidad: {g.capacity} estudiantes</span>
                        </div>
                        <button onClick={() => deleteGroup(g.id)} className="btn-delete"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="section">
                  <h2>Asignaciones</h2>
                  <p className="section-desc">Define qué profesor imparte qué curso en qué grupo y cuántas horas semanales.</p>
                  <div className="form-row">
                    <select value={newAssignment.teacherId} onChange={e => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}>
                      <option value="">Seleccionar profesor</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={newAssignment.courseId} onChange={e => setNewAssignment({ ...newAssignment, courseId: e.target.value })}>
                      <option value="">Seleccionar curso</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={newAssignment.groupId} onChange={e => setNewAssignment({ ...newAssignment, groupId: e.target.value })}>
                      <option value="">Seleccionar grupo</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <input type="number" placeholder="Horas/semana" style={{ width: 140 }} value={newAssignment.hoursPerWeek}
                      onChange={e => setNewAssignment({ ...newAssignment, hoursPerWeek: parseInt(e.target.value) })} />
                    <button onClick={addAssignment} className="btn-add"><Plus size={16} /> Agregar</button>
                  </div>

                  {teachers.map(teacher => {
                    const tas = assignments.filter(a => a.teacherId === teacher.id.toString());
                    if (tas.length === 0) return null;
                    const totalH = teacherAssignedHours(teacher.id);
                    return (
                      <div key={teacher.id} className="teacher-assignments-group">
                        <div className="teacher-group-header">
                          <span>👤 {teacher.name}</span>
                          <span className={`hours-badge ${totalH > teacher.maxHours ? 'over' : ''}`}>{totalH} / {teacher.maxHours}h</span>
                        </div>
                        {tas.map(a => {
                          const course = getCourse(a.courseId);
                          const group  = getGroup(a.groupId);
                          return (
                            <div key={a.id} className="item-card nested">
                              <div className="item-info">
                                <strong>{course?.name}</strong>
                                <span className="item-meta">
                                  Grupo: {group?.name} · {a.hoursPerWeek}h/sem
                                  {course && <> · {Math.ceil(a.hoursPerWeek / course.duration)} sesión(es) de {course.duration}h</>}
                                </span>
                              </div>
                              <button onClick={() => deleteAssignment(a.id)} className="btn-delete"><Trash2 size={16} /></button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {assignments.length === 0 && (
                    <div className="empty-state">Aún no hay asignaciones. Agrega profesores, cursos y grupos primero.</div>
                  )}
                </div>
              )}

              {activeTab === 'restrictions' && (
                <div className="section">
                  <h2>Restricciones de Disponibilidad</h2>
                  <div className="form-row">
                    <select value={newRestriction.teacherId} onChange={e => setNewRestriction({ ...newRestriction, teacherId: e.target.value })}>
                      <option value="">Seleccionar profesor</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={newRestriction.day} onChange={e => setNewRestriction({ ...newRestriction, day: e.target.value })}>
                      <option value="">Seleccionar día</option>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={newRestriction.timeSlot} onChange={e => setNewRestriction({ ...newRestriction, timeSlot: e.target.value })}>
                      <option value="">Seleccionar hora</option>
                      {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={addRestriction} className="btn-add"><Plus size={16} /> Agregar</button>
                  </div>
                  <div className="item-list">
                    {restrictions.map(r => {
                      const teacher = getTeacher(r.teacherId);
                      return (
                        <div key={r.id} className="item-card">
                          <div className="item-info">
                            <strong>{teacher?.name}</strong>
                            <span className="item-meta">No disponible: {r.day} a las {r.timeSlot}</span>
                          </div>
                          <button onClick={() => deleteRestriction(r.id)} className="btn-delete"><Trash2 size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="action-bar">
              <div className="action-summary">
                {assignments.length > 0
                  ? <span>✅ {assignments.length} asignaciones listas para generar</span>
                  : <span>⚠️ Agrega asignaciones en la pestaña "Asignaciones" para continuar</span>}
              </div>
              <button onClick={generateSchedule} className="btn-generate"><Play size={20} /> Generar Horario</button>
            </div>
          </div>
        ) : (
          <div className="schedule-container">
            <div className="schedule-header">
              <h2>Horario Generado</h2>
              <div className="schedule-actions">
                <div className="view-selector">
                  <button className={viewMode === 'general' ? 'view-btn active' : 'view-btn'} onClick={() => { setViewMode('general'); setSelectedFilter(null); }}>
                    <Eye size={16} /> General
                  </button>
                  <button className={viewMode === 'teacher' ? 'view-btn active' : 'view-btn'} onClick={() => setViewMode('teacher')}>
                    <Users size={16} /> Por Profesor
                  </button>
                  <button className={viewMode === 'group' ? 'view-btn active' : 'view-btn'} onClick={() => setViewMode('group')}>
                    <Filter size={16} /> Por Grupo
                  </button>
                </div>
                {(viewMode === 'teacher' || viewMode === 'group') && (
                  <select className="filter-select" value={selectedFilter || ''} onChange={e => setSelectedFilter(parseInt(e.target.value))}>
                    <option value="">Seleccionar...</option>
                    {viewMode === 'teacher'
                      ? teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      : groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                )}
                <button onClick={exportSchedule} className="btn-export"><Download size={16} /> Exportar</button>
                <button onClick={() => setSchedule(null)} className="btn-secondary">← Editar</button>
              </div>
            </div>
            {renderScheduleGrid()}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
