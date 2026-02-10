import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, Clock, Plus, Trash2, Play, Download, Eye, Filter } from 'lucide-react';

// Utility functions for schedule generation
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const ScheduleGenerator = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [viewMode, setViewMode] = useState('general');
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [activeTab, setActiveTab] = useState('teachers');
  
  // Time slots (8am to 6pm in 1-hour blocks)
  const [timeSlots, setTimeSlots] = useState([
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

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .app-header {
          background: rgba(255, 255, 255, 0.98);
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .logo h1 {
          font-size: 2rem;
          color: #2d3748;
          font-weight: 700;
        }

        .logo svg {
          color: #667eea;
        }

        .subtitle {
          color: #718096;
          font-size: 1.1rem;
          margin-left: 3rem;
        }

        .main-content {
          max-width: 1400px;
          margin: 2rem auto;
          padding: 0 2rem;
        }

        .setup-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          background: #f7fafc;
        }

        .tab {
          flex: 1;
          padding: 1.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          color: #718096;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }

        .tab:hover {
          background: rgba(102, 126, 234, 0.05);
          color: #667eea;
        }

        .tab.active {
          background: white;
          color: #667eea;
          border-bottom: 3px solid #667eea;
        }

        .tab-content {
          padding: 2rem;
        }

        .section h2 {
          font-size: 1.5rem;
          color: #2d3748;
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        input, select {
          flex: 1;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn-add {
          padding: 0.875rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-add:hover {
          background: #5568d3;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .item-list {
          display: grid;
          gap: 0.75rem;
        }

        .item-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .item-card:hover {
          border-color: #cbd5e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .item-info strong {
          color: #2d3748;
          font-size: 1.05rem;
        }

        .item-meta {
          color: #718096;
          font-size: 0.9rem;
        }

        .btn-delete {
          padding: 0.5rem;
          background: #fed7d7;
          color: #c53030;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-delete:hover {
          background: #fc8181;
          color: white;
        }

        .action-bar {
          padding: 2rem;
          background: #f7fafc;
          border-top: 2px solid #e2e8f0;
          display: flex;
          justify-content: center;
        }

        .btn-generate {
          padding: 1rem 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-generate:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .schedule-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .schedule-header h2 {
          font-size: 1.75rem;
          color: #2d3748;
        }

        .schedule-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .view-selector {
          display: flex;
          gap: 0.5rem;
          background: #f7fafc;
          padding: 0.25rem;
          border-radius: 8px;
        }

        .view-btn {
          padding: 0.625rem 1rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .view-btn:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .view-btn.active {
          background: #667eea;
          color: white;
        }

        .filter-select {
          padding: 0.625rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          min-width: 200px;
        }

        .btn-export, .btn-secondary {
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .btn-export {
          background: #48bb78;
          color: white;
        }

        .btn-export:hover {
          background: #38a169;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .schedule-grid {
          overflow-x: auto;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
        }

        .grid-header {
          display: grid;
          grid-template-columns: 100px repeat(5, 1fr);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 700;
        }

        .time-column, .day-column {
          padding: 1rem;
          text-align: center;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }

        .grid-row {
          display: grid;
          grid-template-columns: 100px repeat(5, 1fr);
          border-bottom: 1px solid #e2e8f0;
        }

        .grid-row:last-child {
          border-bottom: none;
        }

        .time-cell {
          padding: 1rem;
          background: #f7fafc;
          font-weight: 600;
          color: #4a5568;
          text-align: center;
          border-right: 1px solid #e2e8f0;
        }

        .schedule-cell {
          padding: 0.5rem;
          border-right: 1px solid #e2e8f0;
          min-height: 80px;
          position: relative;
        }

        .assignment-card {
          background: #bee3f8;
          border-radius: 8px;
          padding: 0.75rem;
          height: 100%;
          border-left: 4px solid #3182ce;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .assignment-course {
          font-weight: 700;
          color: #2c5282;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .assignment-info {
          font-size: 0.85rem;
          color: #2d3748;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 1.5rem;
          }

          .logo h1 {
            font-size: 1.5rem;
          }

          .subtitle {
            font-size: 0.95rem;
            margin-left: 2.5rem;
          }

          .main-content {
            padding: 0 1rem;
          }

          .form-row {
            flex-direction: column;
          }

          .schedule-header {
            flex-direction: column;
          }

          .schedule-actions {
            width: 100%;
          }

          .view-selector {
            width: 100%;
            justify-content: space-between;
          }

          .filter-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ScheduleGenerator;
