
import React, { useState, useEffect } from 'react';
import { Layout, GraduationCap, Code, Video, LayoutDashboard, User as UserIcon, LogOut, Shield, AlertTriangle, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LessonView from './components/LessonView';
import LiveClassroom from './components/LiveClassroom';
import CodeSandbox from './components/CodeSandbox';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LessonEditor from './components/LessonEditor';
import UserProfile from './components/UserProfile';
import WaitingRoom from './components/WaitingRoom';
import { Lesson, User, UserStatus, ScheduledClass } from './types';
import { INITIAL_CURRICULUM, APP_LOGO } from './constants';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, writeBatch, updateDoc, arrayUnion, setDoc, query, orderBy, where } from 'firebase/firestore';

type View = 'dashboard' | 'learn' | 'live' | 'sandbox' | 'profile' | 'admin-dashboard' | 'lesson-editor';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App Data State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Live Class State
  const [activeLiveRoomId, setActiveLiveRoomId] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
      setIsSidebarCollapsed(!isSidebarCollapsed);
      // Trigger a window resize event to force the WebRTC video player (and other responsive elements) to recalculate aspect ratios
      setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
      }, 300); // Wait for transition
  };

  // 1. Listen to Auth Changes and User Data Stream
  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            // Real-time listener for User Profile
            unsubscribeUser = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    setUser({
                        id: firebaseUser.uid,
                        name: data.name || firebaseUser.displayName || 'User',
                        email: data.email || firebaseUser.email || '',
                        role: data.role || 'student',
                        status: data.status as UserStatus || 'pending',
                        avatar: data.avatar || firebaseUser.photoURL || '',
                        completedLessonIds: data.completedLessonIds || [],
                        progress: data.progress || {}
                    });
                } else {
                    setUser({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'User',
                        email: firebaseUser.email || '',
                        role: 'student',
                        status: 'pending',
                        avatar: firebaseUser.photoURL || '',
                        completedLessonIds: [],
                        progress: {}
                    });
                }
                setLoadingAuth(false);
            }, (error) => {
                console.error("User snapshot error:", error);
                if (error.code === 'permission-denied' || error.message.includes("Cloud Firestore API")) {
                    setDbError("Firestore API is not enabled. Please check console.");
                }
                setLoadingAuth(false);
            });
        } else {
            setUser(null);
            if (unsubscribeUser) unsubscribeUser();
            setLoadingAuth(false);
        }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  // 2. Fetch Lessons, Classes, and Live Config
  useEffect(() => {
    if (!user) return;

    // Fetch Lessons
    const unsubscribeLessons = onSnapshot(collection(db, "lessons"), (snapshot) => {
        const fetchedLessons: Lesson[] = [];
        snapshot.forEach((doc) => {
            fetchedLessons.push(doc.data() as Lesson);
        });
        fetchedLessons.sort((a, b) => a.id.localeCompare(b.id));
        setLessons(fetchedLessons);
        
        if (fetchedLessons.length === 0 && !dbError && user.role === 'admin') {
            seedDatabase();
        }
    }, (error) => {
        console.error("Lessons fetch error:", error);
        if (error.code === 'permission-denied' || error.message.includes("Cloud Firestore API")) {
           setDbError("Firestore API is disabled or not accessible.");
        }
    });

    // Fetch Scheduled Classes
    const qClasses = query(collection(db, "classes"));
    const unsubscribeClasses = onSnapshot(qClasses, (snapshot) => {
         const classes: ScheduledClass[] = [];
         const now = new Date();
         now.setHours(now.getHours() - 2); 

         snapshot.forEach((doc) => {
             const data = doc.data() as ScheduledClass;
             if (new Date(data.date) > now) {
                classes.push(data);
             }
         });
         
         classes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
         setScheduledClasses(classes);
    }, (error) => {
        console.error("Classes fetch error:", error);
    });
    
    // Listen for Active Live Class
    const unsubscribeLiveConfig = onSnapshot(doc(db, "rooms", "live-config"), (doc) => {
        if (doc.exists() && doc.data().active) {
            setActiveLiveRoomId(doc.data().roomId);
        } else {
            setActiveLiveRoomId(null);
        }
    });

    return () => {
        unsubscribeLessons();
        unsubscribeClasses();
        unsubscribeLiveConfig();
    };
  }, [user?.id, user?.role, dbError]);

  const seedDatabase = async () => {
    if (user?.role !== 'admin') return;

    try {
        const batch = writeBatch(db);
        INITIAL_CURRICULUM.forEach(lesson => {
            const ref = doc(db, "lessons", lesson.id);
            batch.set(ref, lesson);
        });
        await batch.commit();
        console.log("Database seeded successfully.");
    } catch (e) {
        console.error("Seeding failed:", e);
    }
  };

  const handleLessonStart = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentView('learn');
  };

  const handleLessonComplete = async (lessonId: string, score: number = 100) => {
    if (!user) return;
    
    const currentProgress = user.progress?.[lessonId];
    const isNew = !user.completedLessonIds.includes(lessonId);
    const isBetterScore = currentProgress && (currentProgress.score === undefined || score > currentProgress.score);

    if (isNew || isBetterScore) {
        const timestamp = new Date().toISOString();
        const newCompleted = isNew ? [...user.completedLessonIds, lessonId] : user.completedLessonIds;
        const newProgress = { 
            ...(user.progress || {}), 
            [lessonId]: { completedAt: timestamp, score } 
        };

        setUser({ ...user, completedLessonIds: newCompleted, progress: newProgress });

        try {
            const updates: any = {
                completedLessonIds: arrayUnion(lessonId),
                [`progress.${lessonId}`]: { completedAt: timestamp, score }
            };
            await updateDoc(doc(db, "users", user.id), updates);
        } catch (e) {
            console.error("Failed to save progress", e);
        }
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setUser(null);
        setCurrentView('dashboard');
    } catch (error) {
        console.error("Error signing out", error);
    }
  };

  const renderContent = () => {
    if (loadingAuth) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950">
                <div className="animate-spin h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={() => {}} />; 
    }

    if (user.status === 'pending' && user.role !== 'admin') {
        return <WaitingRoom user={user} onLogout={handleLogout} />;
    }

    if (user.status === 'rejected' && user.role !== 'admin') {
        return (
             <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950 text-center p-8">
                <AlertTriangle size={64} className="text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Registration Rejected</h1>
                <p className="text-gray-500 dark:text-neutral-400 mb-8 max-w-lg">
                    Your application to join the course was declined by an administrator.
                </p>
                <button onClick={handleLogout} className="bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white px-6 py-2 rounded-none hover:bg-gray-300 dark:hover:bg-neutral-700">Sign Out</button>
            </div>
        );
    }

    if (dbError) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950 text-center p-8">
                <AlertTriangle size={64} className="text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Database Setup Required</h1>
                <p className="text-gray-500 dark:text-neutral-400 mb-8 max-w-lg">
                    The connection to the backend database failed. This usually happens if the Firestore API hasn't been enabled for your project yet.
                </p>
                <a 
                    href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=codesphere-35dae"
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-none font-bold transition-all shadow-lg shadow-primary-500/20"
                >
                    Enable Firestore API &rarr;
                </a>
            </div>
        );
    }

    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-neutral-950">
        {/* Sidebar */}
        <aside 
            className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col justify-between transition-all duration-300 relative shrink-0`}
        >
          {/* Toggle Button */}
          <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-neutral-800 border border-neutral-700 text-neutral-400 p-1 rounded-full shadow-md hover:text-white z-50"
          >
             {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div>
            <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start px-6'} border-b border-gray-200 dark:border-neutral-800 overflow-hidden`}>
              <div className="w-10 h-10 shrink-0 overflow-hidden flex items-center justify-center shadow-lg shadow-primary-500/10 border border-primary-200 dark:border-primary-900/50 rounded-none">
                 <img src={APP_LOGO} alt="Apex Code Labs" className="w-full h-full object-cover" />
              </div>
              {!isSidebarCollapsed && (
                  <span className="ml-3 font-bold text-xl text-gray-900 dark:text-white tracking-tight whitespace-nowrap">Apex Code Labs</span>
              )}
            </div>

            <nav className="p-2 space-y-2">
              <SidebarItem 
                icon={<LayoutDashboard size={20} />} 
                label="Dashboard" 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<GraduationCap size={20} />} 
                label="Modules" 
                active={currentView === 'learn'} 
                onClick={() => {
                   if (lessons.length > 0) {
                       setActiveLesson(lessons[0]); 
                       setCurrentView('learn');
                   }
                }} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Video size={20} />} 
                label="Live Class" 
                active={currentView === 'live'} 
                onClick={() => setCurrentView('live')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Code size={20} />} 
                label="Sandbox" 
                active={currentView === 'sandbox'} 
                onClick={() => setCurrentView('sandbox')} 
                collapsed={isSidebarCollapsed}
              />
              
              {user.role === 'admin' && (
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-neutral-800">
                    {!isSidebarCollapsed && (
                        <div className="px-4 text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase mb-2">Admin Controls</div>
                    )}
                    <SidebarItem 
                        icon={<Shield size={20} />} 
                        label="Admin Panel" 
                        active={currentView === 'admin-dashboard'} 
                        onClick={() => setCurrentView('admin-dashboard')} 
                        collapsed={isSidebarCollapsed}
                    />
                </div>
              )}
            </nav>
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-neutral-800 space-y-2">
             <button
                onClick={toggleTheme}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} w-full p-2 text-gray-500 dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-none transition-all`}
                title="Toggle Theme"
             >
                 {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                 {!isSidebarCollapsed && <span className="ml-3 text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
             </button>

             <button 
                onClick={() => setCurrentView('profile')}
                className={`flex items-center w-full p-2 rounded-none transition-all mb-2
                    ${currentView === 'profile' ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50 text-gray-500 dark:text-neutral-400'}
                    ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title="Profile"
             >
                 <div className={`w-8 h-8 shrink-0 overflow-hidden bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-none`}>
                     <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                 </div>
                 {!isSidebarCollapsed && (
                     <div className="ml-3 text-left overflow-hidden">
                         <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                         <p className="text-xs text-gray-500 dark:text-neutral-500 truncate capitalize">{user.role}</p>
                     </div>
                 )}
             </button>
             <button 
                onClick={handleLogout}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} w-full p-2 text-gray-500 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-none transition-all`}
                title="Sign Out"
             >
                 <LogOut size={20} />
                 {!isSidebarCollapsed && <span className="ml-3 text-sm font-medium">Sign Out</span>}
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative transition-all duration-300">
          {currentView === 'dashboard' && (
            <Dashboard 
                lessons={lessons} 
                scheduledClasses={scheduledClasses}
                onStartLesson={handleLessonStart} 
                completedLessonIds={user.completedLessonIds}
            />
          )}
          
          {currentView === 'learn' && activeLesson && (
            <LessonView 
                lesson={activeLesson} 
                onBack={() => setCurrentView('dashboard')} 
                onComplete={handleLessonComplete}
            />
          )}

          {currentView === 'learn' && !activeLesson && (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500">
                 <GraduationCap size={48} className="mb-4 opacity-50" />
                 <p>Select a module from the Dashboard to start learning.</p>
                 <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-primary-500 hover:underline">Go to Dashboard</button>
             </div>
          )}

          {currentView === 'live' && (
            <LiveClassroom 
                role={user.role} 
                roomId={activeLiveRoomId}
                onLeave={() => setCurrentView('dashboard')} 
            />
          )}

          {currentView === 'sandbox' && <CodeSandbox />}
          
          {currentView === 'profile' && (
            <UserProfile 
                user={user} 
                lessons={lessons} 
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
            />
          )}

          {currentView === 'admin-dashboard' && user.role === 'admin' && (
            <AdminDashboard 
                lessons={lessons}
                scheduledClasses={scheduledClasses}
                onCreateLesson={() => {
                    setEditingLesson(null);
                    setCurrentView('lesson-editor');
                }}
                onEditLesson={(lesson) => {
                    setEditingLesson(lesson);
                    setCurrentView('lesson-editor');
                }}
                onDeleteLesson={(id) => { /* Handled in dashboard */ }}
                onStartLiveClass={() => setCurrentView('live')}
            />
          )}

          {currentView === 'lesson-editor' && user.role === 'admin' && (
              <LessonEditor 
                initialData={editingLesson}
                onSave={() => setCurrentView('admin-dashboard')}
                onCancel={() => setCurrentView('admin-dashboard')}
              />
          )}

           {/* Permission Guard */}
           {(currentView === 'admin-dashboard' || currentView === 'lesson-editor') && user.role !== 'admin' && (
               <div className="h-full flex items-center justify-center">
                   <div className="text-center">
                       <Shield size={48} className="mx-auto text-red-500 mb-4" />
                       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                       <p className="text-gray-500 dark:text-neutral-400">You do not have permission to view this page.</p>
                       <button 
                        onClick={() => setCurrentView('dashboard')}
                        className="mt-6 px-6 py-2 bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-neutral-700 rounded-none"
                       >
                           Return Home
                       </button>
                   </div>
               </div>
           )}

        </main>
      </div>
    );
  };

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 font-sans selection:bg-primary-500/30">
        {renderContent()}
      </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} p-3 transition-all duration-200 group rounded-none
      ${active 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
        : 'text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white'
      }`}
    title={label}
  >
    <span className={`${active ? 'text-white' : 'text-gray-500 dark:text-neutral-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>{icon}</span>
    {!collapsed && <span className="ml-3 font-medium text-sm whitespace-nowrap">{label}</span>}
  </button>
);

export default App;
