import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, Clock, Plus, Trash2, Play, Download, Eye, Filter } from 'lucide-react';
import './App.css';

// Utility functions for schedule generation
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function App() {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [viewMode, setViewMode] = useState('general');
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [activeTab, setActiveTab] = useState('teachers');
  
  // Time slots (8am to 6pm in 1-hour blocks)
  const [timeSlots] = useState([
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ]);

  // Form states
  const [newTeacher, setNewTeacher] = useState({ name: '', maxHours: 20 });
  const [newCourse, setNewCourse] = useState({ name: '', hoursPerWeek: 2, duration: 1 });
  const [newGroup, setNewGroup] = useState({ name: '', capacity: 30 });
  const [newRestriction, setNewRestriction] = useState({
    type: 'teacher_unavailable',
    teacherId: '',
    day: '',
    timeSlot: ''
  });

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scheduleData');
    if (saved) {
      const data = JSON.parse(saved);
      setTeachers(data.teachers || []);
      setCourses(data.courses || []);
      setGroups(data.groups || []);
      setRestrictions(data.restrictions || []);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('scheduleData', JSON.stringify({
      teachers, courses, groups, restrictions
    }));
  }, [teachers, courses, groups, restrictions]);

  // Add functions
  const addTeacher = () => {
    if (newTeacher.name.trim()) {
      setTeachers([...teachers, { ...newTeacher, id: Date.now() }]);
      setNewTeacher({ name: '', maxHours: 20 });
    }
  };

  const addCourse = () => {
    if (newCourse.name.trim()) {
      setCourses([...courses, { ...newCourse, id: Date.now() }]);
      setNewCourse({ name: '', hoursPerWeek: 2, duration: 1 });
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
      setNewRestriction({
        type: 'teacher_unavailable',
        teacherId: '',
        day: '',
        timeSlot: ''
      });
    }
  };

  // Delete functions
  const deleteTeacher = (id) => setTeachers(teachers.filter(t => t.id !== id));
  const deleteCourse = (id) => setCourses(courses.filter(c => c.id !== id));
  const deleteGroup = (id) => setGroups(groups.filter(g => g.id !== id));
  const deleteRestriction = (id) => setRestrictions(restrictions.filter(r => r.id !== id));

  // Schedule generation algorithm
  const generateSchedule = () => {
    if (teachers.length === 0 || courses.length === 0 || groups.length === 0) {
      alert('Necesitas agregar al menos un profesor, un curso y un grupo');
      return;
    }

    const assignments = [];
    const teacherHours = {};
    teachers.forEach(t => teacherHours[t.id] = 0);

    // Create all possible assignments (course-group pairs)
    const possibleAssignments = [];
    groups.forEach(group => {
      courses.forEach(course => {
        possibleAssignments.push({
          course,
          group,
          teacher: null,
          day: null,
          timeSlot: null,
          scheduled: false
        });
      });
    });

    // Try to schedule each assignment
    possibleAssignments.forEach(assignment => {
      const { course, group } = assignment;
      
      // Find available teacher
      for (const teacher of teachers) {
        if (teacherHours[teacher.id] + course.hoursPerWeek <= teacher.maxHours) {
          // Find available time slot
          let scheduled = false;
          
          for (const day of DAYS) {
            if (scheduled) break;
            
            for (let i = 0; i < timeSlots.length; i++) {
              const timeSlot = timeSlots[i];
              
              // Check if teacher is available
              const isRestricted = restrictions.some(r => 
                r.teacherId === teacher.id.toString() && 
                r.day === day && 
                r.timeSlot === timeSlot
              );
              
              if (isRestricted) continue;
              
              // Check if slot is free for teacher and group
              const hasConflict = assignments.some(a => 
                (a.teacher.id === teacher.id || a.group.id === group.id) &&
                a.day === day &&
                a.timeSlot === timeSlot
              );
              
              if (hasConflict) continue;
              
              // Check if there are enough consecutive slots for the course
              let slotsAvailable = true;
              for (let j = 0; j < course.duration; j++) {
                const nextSlot = timeSlots[i + j];
                if (!nextSlot) {
                  slotsAvailable = false;
                  break;
                }
                
                const nextConflict = assignments.some(a => 
                  (a.teacher.id === teacher.id || a.group.id === group.id) &&
                  a.day === day &&
                  a.timeSlot === nextSlot
                );
                
                if (nextConflict) {
                  slotsAvailable = false;
                  break;
                }
              }
              
              if (slotsAvailable) {
                // Schedule the course
                for (let j = 0; j < course.duration; j++) {
                  assignments.push({
                    id: Date.now() + Math.random(),
                    course,
                    group,
                    teacher,
                    day,
                    timeSlot: timeSlots[i + j],
                    slotPart: j === 0 ? 'start' : (j === course.duration - 1 ? 'end' : 'middle')
                  });
                }
                
                teacherHours[teacher.id] += course.hoursPerWeek;
                scheduled = true;
                break;
              }
            }
          }
          
          if (scheduled) break;
        }
      }
    });

    setSchedule(assignments);
    setViewMode('general');
  };

  // Export schedule
  const exportSchedule = () => {
    const data = {
      teachers,
      courses,
      groups,
      restrictions,
      schedule,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horario-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Render schedule grid
  const renderScheduleGrid = () => {
    if (!schedule) return null;

    let filteredSchedule = schedule;
    if (viewMode === 'teacher' && selectedFilter) {
      filteredSchedule = schedule.filter(s => s.teacher.id === selectedFilter);
    } else if (viewMode === 'group' && selectedFilter) {
      filteredSchedule = schedule.filter(s => s.group.id === selectedFilter);
    }

    return (
      <div className="schedule-grid">
        <div className="grid-header">
          <div className="time-column">Hora</div>
          {DAYS.map(day => (
            <div key={day} className="day-column">{day}</div>
          ))}
        </div>
        
        {timeSlots.map(timeSlot => (
          <div key={timeSlot} className="grid-row">
            <div className="time-cell">{timeSlot}</div>
            {DAYS.map(day => {
              const assignment = filteredSchedule.find(
                s => s.day === day && s.timeSlot === timeSlot && s.slotPart === 'start'
              );
              
              const isContinuation = filteredSchedule.some(
                s => s.day === day && s.timeSlot === timeSlot && s.slotPart !== 'start'
              );
              
              return (
                <div key={`${day}-${timeSlot}`} className="schedule-cell">
                  {assignment && !isContinuation && (
                    <div 
                      className="assignment-card"
                      style={{ 
                        gridRow: `span ${assignment.course.duration}`,
                        background: `hsl(${assignment.course.id % 360}, 70%, 85%)`
                      }}
                    >
                      <div className="assignment-course">{assignment.course.name}</div>
                      <div className="assignment-info">
                        {viewMode !== 'group' && <div>Grupo: {assignment.group.name}</div>}
                        {viewMode !== 'teacher' && <div>Prof: {assignment.teacher.name}</div>}
                      </div>
                    </div>
                  )}
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
          <div className="logo">
            <Calendar size={32} />
            <h1>Generador de Horarios Académicos</h1>
          </div>
          <p className="subtitle">Organiza profesores, cursos y grupos de manera eficiente</p>
        </div>
      </header>

      <div className="main-content">
        {!schedule ? (
          <div className="setup-container">
            <div className="tabs">
              <button 
                className={activeTab === 'teachers' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('teachers')}
              >
                <Users size={18} />
                Profesores ({teachers.length})
              </button>
              <button 
                className={activeTab === 'courses' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen size={18} />
                Cursos ({courses.length})
              </button>
              <button 
                className={activeTab === 'groups' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('groups')}
              >
                <Users size={18} />
                Grupos ({groups.length})
              </button>
              <button 
                className={activeTab === 'restrictions' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('restrictions')}
              >
                <Clock size={18} />
                Restricciones ({restrictions.length})
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'teachers' && (
                <div className="section">
                  <h2>Profesores</h2>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Nombre del profesor"
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && addTeacher()}
                    />
                    <input
                      type="number"
                      placeholder="Horas máximas"
                      value={newTeacher.maxHours}
                      onChange={(e) => setNewTeacher({...newTeacher, maxHours: parseInt(e.target.value)})}
                      style={{ width: '150px' }}
                    />
                    <button onClick={addTeacher} className="btn-add">
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                  
                  <div className="item-list">
                    {teachers.map(teacher => (
                      <div key={teacher.id} className="item-card">
                        <div className="item-info">
                          <strong>{teacher.name}</strong>
                          <span className="item-meta">Máx: {teacher.maxHours}h/semana</span>
                        </div>
                        <button onClick={() => deleteTeacher(teacher.id)} className="btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="section">
                  <h2>Cursos</h2>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Nombre del curso"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && addCourse()}
                    />
                    <input
                      type="number"
                      placeholder="Horas/semana"
                      value={newCourse.hoursPerWeek}
                      onChange={(e) => setNewCourse({...newCourse, hoursPerWeek: parseInt(e.target.value)})}
                      style={{ width: '130px' }}
                    />
                    <input
                      type="number"
                      placeholder="Duración (horas)"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: parseInt(e.target.value)})}
                      style={{ width: '130px' }}
                    />
                    <button onClick={addCourse} className="btn-add">
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                  
                  <div className="item-list">
                    {courses.map(course => (
                      <div key={course.id} className="item-card">
                        <div className="item-info">
                          <strong>{course.name}</strong>
                          <span className="item-meta">
                            {course.hoursPerWeek}h/sem • {course.duration}h por sesión
                          </span>
                        </div>
                        <button onClick={() => deleteCourse(course.id)} className="btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="section">
                  <h2>Grupos</h2>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Nombre del grupo"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                      onKeyPress={(e) => e.key === 'Enter' && addGroup()}
                    />
                    <input
                      type="number"
                      placeholder="Capacidad"
                      value={newGroup.capacity}
                      onChange={(e) => setNewGroup({...newGroup, capacity: parseInt(e.target.value)})}
                      style={{ width: '120px' }}
                    />
                    <button onClick={addGroup} className="btn-add">
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                  
                  <div className="item-list">
                    {groups.map(group => (
                      <div key={group.id} className="item-card">
                        <div className="item-info">
                          <strong>{group.name}</strong>
                          <span className="item-meta">Capacidad: {group.capacity} estudiantes</span>
                        </div>
                        <button onClick={() => deleteGroup(group.id)} className="btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'restrictions' && (
                <div className="section">
                  <h2>Restricciones de Disponibilidad</h2>
                  <div className="form-row">
                    <select
                      value={newRestriction.teacherId}
                      onChange={(e) => setNewRestriction({...newRestriction, teacherId: e.target.value})}
                    >
                      <option value="">Seleccionar profesor</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <select
                      value={newRestriction.day}
                      onChange={(e) => setNewRestriction({...newRestriction, day: e.target.value})}
                    >
                      <option value="">Seleccionar día</option>
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      value={newRestriction.timeSlot}
                      onChange={(e) => setNewRestriction({...newRestriction, timeSlot: e.target.value})}
                    >
                      <option value="">Seleccionar hora</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    <button onClick={addRestriction} className="btn-add">
                      <Plus size={18} />
                      Agregar
                    </button>
                  </div>
                  
                  <div className="item-list">
                    {restrictions.map(restriction => {
                      const teacher = teachers.find(t => t.id.toString() === restriction.teacherId);
                      return (
                        <div key={restriction.id} className="item-card">
                          <div className="item-info">
                            <strong>{teacher?.name}</strong>
                            <span className="item-meta">
                              No disponible: {restriction.day} a las {restriction.timeSlot}
                            </span>
                          </div>
                          <button onClick={() => deleteRestriction(restriction.id)} className="btn-delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="action-bar">
              <button onClick={generateSchedule} className="btn-generate">
                <Play size={20} />
                Generar Horario
              </button>
            </div>
          </div>
        ) : (
          <div className="schedule-container">
            <div className="schedule-header">
              <h2>Horario Generado</h2>
              <div className="schedule-actions">
                <div className="view-selector">
                  <button
                    className={viewMode === 'general' ? 'view-btn active' : 'view-btn'}
                    onClick={() => {
                      setViewMode('general');
                      setSelectedFilter(null);
                    }}
                  >
                    <Eye size={18} />
                    Vista General
                  </button>
                  <button
                    className={viewMode === 'teacher' ? 'view-btn active' : 'view-btn'}
                    onClick={() => setViewMode('teacher')}
                  >
                    <Users size={18} />
                    Por Profesor
                  </button>
                  <button
                    className={viewMode === 'group' ? 'view-btn active' : 'view-btn'}
                    onClick={() => setViewMode('group')}
                  >
                    <Filter size={18} />
                    Por Grupo
                  </button>
                </div>
                
                {(viewMode === 'teacher' || viewMode === 'group') && (
                  <select
                    value={selectedFilter || ''}
                    onChange={(e) => setSelectedFilter(parseInt(e.target.value))}
                    className="filter-select"
                  >
                    <option value="">Seleccionar...</option>
                    {viewMode === 'teacher' 
                      ? teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      : groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                    }
                  </select>
                )}
                
                <button onClick={exportSchedule} className="btn-export">
                  <Download size={18} />
                  Exportar
                </button>
                <button onClick={() => setSchedule(null)} className="btn-secondary">
                  Volver a Editar
                </button>
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
