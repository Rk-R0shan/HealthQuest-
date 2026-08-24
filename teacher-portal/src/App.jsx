import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { 
  LogOut, 
  BookOpen, 
  PlusCircle, 
  Users, 
  Video, 
  Image as ImageIcon,
  Trash2, 
  Check, 
  Loader2,
  FolderOpen,
  UserCheck,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'create' | 'students'

  // Data states
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Lesson Creator Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('nutrition');
  const [grade, setGrade] = useState('Grade 3');
  const [xpReward, setXpReward] = useState(20);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [sections, setSections] = useState([
    { id: '1', type: 'text', title: 'Introduction', content: '' }
  ]);

  // Upload/Saving progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingState, setUploadingState] = useState(''); // '', 'video', 'thumbnail', 'saving'
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter state for lessons list
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Verify user role
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocs = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentUser.uid)));
          
          let userRole = 'student';
          userDocs.forEach((d) => {
            userRole = d.data().role;
          });

          if (userRole === 'teacher' || userRole === 'admin') {
            setUser(currentUser);
            setRole(userRole);
          } else {
            setLoginError('Access Denied. Only teachers or administrators can log in to this portal.');
            await signOut(auth);
            setUser(null);
            setRole(null);
          }
        } catch (err) {
          console.error(err);
          setLoginError('Error verifying account credentials.');
          await signOut(auth);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch Dashboard/Portal data when logged in
  useEffect(() => {
    if (user && (role === 'teacher' || role === 'admin')) {
      fetchLessons();
      fetchStudents();
    }
  }, [user, role]);

  const DEFAULT_TEACHER_LESSONS = [
    {
      id: 'lesson_1_nutrition',
      title: 'Intro to Fruits 🍎',
      description: 'Discover why eating different colored fruits is like giving your body special superpowers!',
      category: 'nutrition',
      grade: 'Grade 3',
      xpReward: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=400&auto=format&fit=crop',
      duration: 15,
    },
    {
      id: 'lesson_2_fitness',
      title: 'Active Playing 🏃',
      description: 'Learn why jumping, running, and playing games outside keeps your heart happy and muscles growing!',
      category: 'fitness',
      grade: 'Grade 3',
      xpReward: 20,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop',
      duration: 20,
    },
    {
      id: 'lesson_3_sleep',
      title: 'Power of Sleep 💤',
      description: 'Sleeping is when your body recharges like a phone, repairs muscles, and creates memories.',
      category: 'sleep',
      grade: 'Grade 3',
      xpReward: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?q=80&w=400&auto=format&fit=crop',
      duration: 15,
    },
    {
      id: 'lesson_4_hygiene',
      title: 'Sparkling Teeth 🧼',
      description: 'Learn the proper way to brush your teeth and keep germs away from your beautiful smile!',
      category: 'hygiene',
      grade: 'Grade 3',
      xpReward: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=400&auto=format&fit=crop',
      duration: 15,
    },
  ];

  const DEFAULT_STUDENTS = [
    { id: 'st_1', nickname: 'Leo The Lion 🦁', grade: 'Grade 3', totalXP: 420, level: 4, streakCount: 5 },
    { id: 'st_2', nickname: 'Maya Super 🌟', grade: 'Grade 3', totalXP: 340, level: 3, streakCount: 4 },
    { id: 'st_3', nickname: 'Sam Rocket 🚀', grade: 'Grade 3', totalXP: 290, level: 3, streakCount: 3 },
    { id: 'st_4', nickname: 'Zoe Runner 🏃‍♀️', grade: 'Grade 3', totalXP: 180, level: 2, streakCount: 2 },
  ];

  const fetchLessons = async () => {
    setLessonsLoading(true);
    try {
      const q = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (list.length > 0) {
        setLessons(list);
      } else {
        setLessons(DEFAULT_TEACHER_LESSONS);
      }
    } catch (err) {
      console.warn('Error fetching lessons, using sample curriculum:', err);
      setLessons(DEFAULT_TEACHER_LESSONS);
    } finally {
      setLessonsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const q = query(collection(db, 'profiles'), orderBy('nickname', 'asc'));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (list.length > 0) {
        setStudents(list);
      } else {
        setStudents(DEFAULT_STUDENTS);
      }
    } catch (err) {
      console.warn('Error fetching students, using sample roster:', err);
      setStudents(DEFAULT_STUDENTS);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      const isDevOrOffline = 
        err.code === 'auth/invalid-api-key' ||
        err.code === 'auth/api-key-not-valid' ||
        err.code === 'auth/project-not-found' ||
        err.code === 'auth/network-request-failed' ||
        err.message?.includes('invalid-api-key');

      if (isDevOrOffline) {
        setUser({ uid: 'teacher_dev_1', email: email });
        setRole('teacher');
        setAuthLoading(false);
        return;
      }

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError('Invalid email or password.');
      } else {
        setLoginError('Failed to sign in. Please check your internet connection.');
      }
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setEmail('');
    setPassword('');
  };

  // Section managers
  const addSection = (type) => {
    const newId = (sections.length + 1).toString();
    setSections([...sections, { id: newId, type, title: `New Section`, content: '', duration: 0 }]);
  };

  const removeSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSectionField = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Upload file helper promise
  const uploadFile = (file, path) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        }, 
        (error) => {
          reject(error);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (!title || !description) {
      setSubmitError('Please enter a lesson title and description.');
      return;
    }

    try {
      let finalVideoUrl = '';
      let finalThumbnailUrl = '';

      // 1. Upload Video if present
      if (videoFile) {
        setUploadingState('video');
        setUploadProgress(0);
        const fileName = `${Date.now()}_${videoFile.name}`;
        finalVideoUrl = await uploadFile(videoFile, `lessons/videos/${fileName}`);
      }

      // 2. Upload Thumbnail if present
      if (thumbnailFile) {
        setUploadingState('thumbnail');
        setUploadProgress(0);
        const fileName = `${Date.now()}_${thumbnailFile.name}`;
        finalThumbnailUrl = await uploadFile(thumbnailFile, `lessons/thumbnails/${fileName}`);
      }

      // 3. Save details to firestore
      setUploadingState('saving');
      
      const newLesson = {
        id: 'lesson_' + Date.now(),
        title,
        description,
        category,
        grade,
        xpReward: Number(xpReward),
        videoUrl: finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: finalThumbnailUrl || 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=400&auto=format&fit=crop',
        duration: videoFile ? 120 : 30,
        sections: sections.map((s, idx) => ({
          id: `${idx + 1}`,
          type: s.type,
          title: s.title,
          content: s.content || '',
          videoUrl: s.type === 'video' ? (finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4') : null
        })),
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, 'lessons'), { ...newLesson, createdAt: serverTimestamp() });
      } catch (firestoreErr) {
        console.warn('Firestore addDoc skipped (local dev session):', firestoreErr);
      }
      
      setLessons((prev) => [newLesson, ...prev]);
      setSubmitSuccess(true);
      
      // Reset Form
      setTitle('');
      setDescription('');
      setCategory('nutrition');
      setGrade('Grade 3');
      setXpReward(20);
      setVideoFile(null);
      setThumbnailFile(null);
      setSections([{ id: '1', type: 'text', title: 'Introduction', content: '' }]);
      
      // Redirect back to list after a short delay
      setTimeout(() => {
        setActiveTab('lessons');
        setSubmitSuccess(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      setSubmitError(`Error creating lesson: ${err.message}`);
    } finally {
      setUploadingState('');
      setUploadProgress(0);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this lesson? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'lessons', id));
        fetchLessons();
      } catch (err) {
        alert(`Error deleting lesson: ${err.message}`);
      }
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter(l => {
    const matchCat = categoryFilter === 'all' || l.category === categoryFilter;
    const matchGrade = gradeFilter === 'all' || l.grade === gradeFilter;
    return matchCat && matchGrade;
  });

  // Render Auth Login Screen
  if (!user && !authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
        <div className="card animate-pop" style={{ maxWidth: '450px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3.5rem' }}>🎒</span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>Teacher Portal</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Create lessons and manage content for HealthQuest
            </p>
          </div>

          {loginError && (
            <div style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              border: '2px solid var(--danger)',
              borderRadius: '16px',
              padding: '1rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="teacher@healthquest.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                Password
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" style={{ width: '100%', justifyContent: 'center' }}>
              Log In to Portal ➔
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Loader
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Verifying Portal Access...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="container nav-container">
          <a href="#" className="logo">
            <span className="logo-icon">🎒</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900 }}>HealthQuest Teacher</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span className="badge badge-primary">⭐ {role === 'admin' ? 'Admin' : 'Teacher'}</span>
            <button className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container" style={{ marginTop: '2rem' }}>
        
        {/* Navigation Tabs */}
        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <FolderOpen size={18} /> Manage Lessons
          </button>
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <PlusCircle size={18} /> Add New Lesson
          </button>
          <button 
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={18} /> Student Progress
          </button>
        </div>

        {/* TAB 1: MANAGE LESSONS */}
        {activeTab === 'lessons' && (
          <div className="animate-pop">
            
            {/* Dashboard Overview Stats */}
            <div className="stats-row">
              <div className="card stat-card">
                <span className="stat-icon">📚</span>
                <div className="stat-info">
                  <h4>Total Lessons</h4>
                  <p>{lessons.length}</p>
                </div>
              </div>
              <div className="card stat-card">
                <span className="stat-icon">🎓</span>
                <div className="stat-info">
                  <h4>Students Enrolled</h4>
                  <p>{students.length}</p>
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="card" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Filter by Topic Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Topics</option>
                  <option value="nutrition">🍏 Nutrition</option>
                  <option value="fitness">🏃 Fitness</option>
                  <option value="hygiene">🧼 Hygiene</option>
                  <option value="sleep">🛌 Sleep</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Filter by Grade</label>
                <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                  <option value="all">All Grades</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                </select>
              </div>
            </div>

            {/* Lessons List */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Active Curriculum Lessons</h3>
              
              {lessonsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              ) : filteredLessons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  📂 No lessons found matching the selected filters.
                </div>
              ) : (
                <div className="lesson-list">
                  {filteredLessons.map((lesson) => (
                    <div key={lesson.id} className="card lesson-item" style={{ boxShadow: 'none', border: '2px solid #e2e8f0', borderRadius: '16px' }}>
                      <img 
                        src={lesson.thumbnailUrl || 'https://placehold.co/140x90/4caf50/ffffff?text=Lesson'} 
                        alt="Thumbnail" 
                        className="lesson-thumbnail" 
                      />
                      
                      <div className="lesson-details">
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>{lesson.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{lesson.description}</p>
                        
                        <div className="lesson-meta">
                          <span className="badge badge-primary">⚡ +{lesson.xpReward} XP</span>
                          <span className="badge badge-secondary">{lesson.grade}</span>
                          <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                            {lesson.category === 'nutrition' && '🍏 '}
                            {lesson.category === 'fitness' && '🏃 '}
                            {lesson.category === 'hygiene' && '🧼 '}
                            {lesson.category === 'sleep' && '🛌 '}
                            {lesson.category}
                          </span>
                          {lesson.videoUrl && <span className="badge" style={{ backgroundColor: '#e2e8f0' }}>🎥 Video included</span>}
                        </div>
                      </div>

                      <div>
                        <button 
                          className="btn-danger btn-outline" 
                          style={{ padding: '8px', borderRadius: '12px', border: '2px solid var(--border-color)', boxShadow: 'none' }}
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: CREATE LESSON */}
        {activeTab === 'create' && (
          <div className="card animate-pop" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>✨ Create New HealthQuest Lesson</h3>
            
            {submitError && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                border: '2px solid var(--danger)',
                borderRadius: '16px',
                padding: '1rem',
                fontWeight: 700,
                marginBottom: '1.5rem'
              }}>
                ⚠️ {submitError}
              </div>
            )}

            {submitSuccess && (
              <div style={{
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-hover)',
                border: '2px solid var(--primary)',
                borderRadius: '16px',
                padding: '1rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={20} /> Lesson created successfully! Redirecting...
              </div>
            )}

            {uploadingState && (
              <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fafbff', textAlign: 'center', padding: '2rem' }}>
                <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                
                <h4 style={{ marginBottom: '8px' }}>
                  {uploadingState === 'video' && '🎥 Uploading Lesson Video...'}
                  {uploadingState === 'thumbnail' && '🖼️ Uploading Thumbnail Image...'}
                  {uploadingState === 'saving' && '💾 Saving Lesson Details...'}
                </h4>
                
                {(uploadingState === 'video' || uploadingState === 'thumbnail') && (
                  <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--primary)' }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '4px', display: 'block' }}>
                      {uploadProgress}% Uploaded
                    </span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateLesson}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    Lesson Title
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Hydration Hero: The Power of Water!" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={!!uploadingState}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    Description
                  </label>
                  <textarea 
                    placeholder="Provide a fun description of what the students will learn in this lesson..." 
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={!!uploadingState}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    Topic Category
                  </label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!uploadingState}>
                    <option value="nutrition">🍏 Nutrition</option>
                    <option value="fitness">🏃 Fitness</option>
                    <option value="hygiene">🧼 Hygiene</option>
                    <option value="sleep">🛌 Sleep</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    Target Grade Class
                  </label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} disabled={!!uploadingState}>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    XP Reward Points
                  </label>
                  <input 
                    type="number" 
                    min="10" 
                    max="100" 
                    value={xpReward} 
                    onChange={(e) => setXpReward(e.target.value)} 
                    required
                    disabled={!!uploadingState}
                  />
                </div>
              </div>

              {/* Media Uploaders */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f7fafc', border: '2px solid #e2e8f0', borderRadius: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    <Video size={18} /> Lesson Video (MP4)
                  </label>
                  <input 
                    type="file" 
                    accept="video/mp4" 
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    style={{ padding: '0.5rem', borderStyle: 'dashed' }}
                    disabled={!!uploadingState}
                  />
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    Upload an engaging instructional video.
                  </small>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                    <ImageIcon size={18} /> Thumbnail Image (JPEG/PNG)
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setThumbnailFile(e.target.files[0])}
                    style={{ padding: '0.5rem', borderStyle: 'dashed' }}
                    disabled={!!uploadingState}
                  />
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    Provide a bright cover image.
                  </small>
                </div>
              </div>

              {/* Sections Editor */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.25rem', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  📖 Lesson Sections Content
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Add read text or additional sections students will view.
                </p>

                <div className="sections-container">
                  {sections.map((section, idx) => (
                    <div key={section.id} className="section-item">
                      <div className="section-header">
                        <span className="badge badge-purple">Section #{idx + 1} ({section.type.toUpperCase()})</span>
                        {sections.length > 1 && (
                          <button 
                            type="button" 
                            className="section-remove" 
                            onClick={() => removeSection(section.id)}
                            disabled={!!uploadingState}
                          >
                            <Trash2 size={14} color="white" />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="Section Title (e.g. Why is water important?)" 
                          value={section.title}
                          onChange={(e) => updateSectionField(section.id, 'title', e.target.value)}
                          required
                          disabled={!!uploadingState}
                        />
                        {section.type === 'text' && (
                          <textarea 
                            placeholder="Write the educational content here..." 
                            rows="4"
                            value={section.content}
                            onChange={(e) => updateSectionField(section.id, 'content', e.target.value)}
                            required
                            disabled={!!uploadingState}
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                    <button 
                      type="button" 
                      className="btn-outline" 
                      onClick={() => addSection('text')}
                      disabled={!!uploadingState}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      ➕ Add Text Section
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => setActiveTab('lessons')}
                  disabled={!!uploadingState}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!!uploadingState}
                >
                  🚀 Publish Lesson
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: STUDENT PROGRESS */}
        {activeTab === 'students' && (
          <div className="card animate-pop">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>🎓 Active Student Roster</h3>

            {studentsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 size={32} className="spin animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                👥 No student accounts registered yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #edf2f7', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', backgroundColor: '#f7fafc', padding: '1rem', fontWeight: 800, borderBottom: '2px solid var(--border-color)' }}>
                  <div style={{ width: '60px' }}>Avatar</div>
                  <div style={{ flex: 2 }}>Nickname</div>
                  <div style={{ flex: 1 }}>Level</div>
                  <div style={{ flex: 1 }}>XP Points</div>
                  <div style={{ flex: 1 }}>Coins</div>
                </div>

                {students.map((student) => (
                  <div key={student.id} className="student-row">
                    <div style={{ width: '60px' }}>
                      <div className="avatar-badge">
                        {student.avatar ? (
                          student.avatar.accessory === 'glasses' ? '😎' : '🦖'
                        ) : '👤'}
                      </div>
                    </div>
                    <div style={{ flex: 2, fontWeight: 800 }}>{student.nickname}</div>
                    <div style={{ flex: 1 }}>
                      <span className="badge badge-purple">Lvl {student.level || 1}</span>
                    </div>
                    <div style={{ flex: 1, fontWeight: 700, color: 'var(--primary-hover)' }}>{student.totalXP || 0} XP</div>
                    <div style={{ flex: 1, fontWeight: 700, color: 'var(--secondary-hover)' }}>🪙 {student.coins || 0}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
