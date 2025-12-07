
import React, { useState, useEffect } from 'react';
import { Layout, GraduationCap, Code, Video, LayoutDashboard, User as UserIcon, LogOut, Shield, AlertTriangle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LessonView from './components/LessonView';
import LiveClassroom from './components/LiveClassroom';
import CodeSandbox from './components/CodeSandbox';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LessonEditor from './components/LessonEditor';
import UserProfile from './components/UserProfile';
import WaitingRoom from './components/WaitingRoom';
import { Lesson, User, UserStatus } from './types';
import { INITIAL_CURRICULUM, APP_LOGO } from './constants';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, writeBatch, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';

type View = 'dashboard' | 'learn' | 'live' | 'sandbox' | 'profile' | 'admin-dashboard' | 'lesson-editor';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App Data State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // 1. Listen to Auth Changes and User Data Stream
  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            // Real-time listener for User Profile
            // This handles role updates and lesson completion sync immediately
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
                    // Fallback if doc doesn't exist yet (race condition on signup)
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

  // 2. Fetch Lessons
  useEffect(() => {
    // SECURITY: Do not attempt to fetch lessons if user is not logged in.
    // This prevents "Missing or insufficient permissions" errors on app load.
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, "lessons"), (snapshot) => {
        const fetchedLessons: Lesson[] = [];
        snapshot.forEach((doc) => {
            fetchedLessons.push(doc.data() as Lesson);
        });
        
        // Sort logic (by ID)
        fetchedLessons.sort((a, b) => a.id.localeCompare(b.id));

        setLessons(fetchedLessons);
        
        // Auto-Seed if empty and connected AND User is Admin
        if (fetchedLessons.length === 0 && !dbError && user.role === 'admin') {
            seedDatabase();
        }
    }, (error) => {
        console.error("Lessons fetch error:", error);
        if (error.code === 'permission-denied' || error.message.includes("Cloud Firestore API")) {
           setDbError("Firestore API is disabled or not accessible.");
        }
    });

    return () => unsubscribe();
  }, [user?.id, user?.role, dbError]);

  const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);
        INITIAL_CURRICULUM.forEach(lesson => {
            const ref = doc(db, "lessons", lesson.id);
            batch.set(ref, lesson);
        });
        await batch.commit();
        console.log("Database seeded successfully.");
    } catch (e) {
        console.error("Seeding failed (likely permission or API issue):", e);
    }
  };

  const handleLessonStart = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentView('learn');
  };

  const handleLessonComplete = async (lessonId: string, score: number = 100) => {
    if (!user) return;
    
    // Check if we need to update progress (if new or if score is better)
    const currentProgress = user.progress?.[lessonId];
    const isNew = !user.completedLessonIds.includes(lessonId);
    const isBetterScore = currentProgress && (currentProgress.score === undefined || score > currentProgress.score);

    if (isNew || isBetterScore) {
        const timestamp = new Date().toISOString();
        
        // Optimistic Update
        const newCompleted = isNew ? [...user.completedLessonIds, lessonId] : user.completedLessonIds;
        const newProgress = { 
            ...(user.progress || {}), 
            [lessonId]: { completedAt: timestamp, score } 
        };

        setUser({
            ...user, 
            completedLessonIds: newCompleted,
            progress: newProgress
        });

        // DB Update
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
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={() => {}} />; // Login component handles auth internally and triggers the auth listener
    }

    // CHECK USER STATUS: If pending and not admin, show Waiting Room
    if (user.status === 'pending' && user.role !== 'admin') {
        return <WaitingRoom user={user} onLogout={handleLogout} />;
    }

    if (user.status === 'rejected' && user.role !== 'admin') {
        return (
             <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-center p-8">
                <AlertTriangle size={64} className="text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">Registration Rejected</h1>
                <p className="text-slate-400 mb-8 max-w-lg">
                    Your application to join the course was declined by an administrator.
                </p>
                <button onClick={handleLogout} className="bg-slate-800 text-white px-6 py-2 rounded-lg">Sign Out</button>
            </div>
        );
    }

    if (dbError) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-center p-8">
                <AlertTriangle size={64} className="text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">Database Setup Required</h1>
                <p className="text-slate-400 mb-8 max-w-lg">
                    The connection to the backend database failed. This usually happens if the Firestore API hasn't been enabled for your project yet.
                </p>
                <a 
                    href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=codesphere-35dae"
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20"
                >
                    Enable Firestore API &rarr;
                </a>
            </div>
        );
    }

    return (
      <div className="flex h-screen overflow-hidden bg-slate-950">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-primary-500/20 border-2 border-primary-600/50">
                 <img src={APP_LOGO} alt="Apex Code Labs" className="w-full h-full object-cover" />
              </div>
              <span className="ml-3 font-bold text-xl text-white hidden lg:block tracking-tight">Apex Code Labs</span>
            </div>

            <nav className="p-4 space-y-2">
              <SidebarItem 
                icon={<LayoutDashboard size={20} />} 
                label="Dashboard" 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')} 
              />
              <SidebarItem 
                icon={<GraduationCap size={20} />} 
                label="Curriculum" 
                active={currentView === 'learn'} 
                onClick={() => {
                   if (lessons.length > 0) {
                       setActiveLesson(lessons[0]); // Default to first lesson if just clicking tab
                       setCurrentView('learn');
                   }
                }} 
              />
              <SidebarItem 
                icon={<Video size={20} />} 
                label="Live Class" 
                active={currentView === 'live'} 
                onClick={() => setCurrentView('live')} 
              />
              <SidebarItem 
                icon={<Code size={20} />} 
                label="Sandbox" 
                active={currentView === 'sandbox'} 
                onClick={() => setCurrentView('sandbox')} 
              />
              
              {user.role === 'admin' && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                    <div className="px-4 text-xs font-bold text-slate-500 uppercase mb-2 hidden lg:block">Instructor</div>
                    <SidebarItem 
                        icon={<Shield size={20} />} 
                        label="Admin Panel" 
                        active={currentView === 'admin-dashboard'} 
                        onClick={() => setCurrentView('admin-dashboard')} 
                    />
                </div>
              )}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800">
             <button 
                onClick={() => setCurrentView('profile')}
                className={`flex items-center w-full p-2 rounded-xl transition-all mb-2
                    ${currentView === 'profile' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}
             >
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 mr-0 lg:mr-3 border border-slate-600">
                     <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                 </div>
                 <div className="hidden lg:block text-left overflow-hidden">
                     <p className="text-sm font-bold text-white truncate">{user.name}</p>
                     <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
                 </div>
             </button>
             <button 
                onClick={handleLogout}
                className="flex items-center justify-center lg:justify-start w-full p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Sign Out"
             >
                 <LogOut size={20} className="lg:mr-3" />
                 <span className="hidden lg:inline text-sm font-medium">Sign Out</span>
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
          {currentView === 'dashboard' && (
            <Dashboard 
                lessons={lessons} 
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
             <div className="h-full flex flex-col items-center justify-center text-slate-500">
                 <GraduationCap size={48} className="mb-4 opacity-50" />
                 <p>Select a lesson from the Dashboard to start learning.</p>
                 <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-primary-400 hover:underline">Go to Dashboard</button>
             </div>
          )}

          {currentView === 'live' && (
            <LiveClassroom 
                role={user.role} 
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
                onCreateLesson={() => {
                    setEditingLesson(null);
                    setCurrentView('lesson-editor');
                }}
                onEditLesson={(lesson) => {
                    setEditingLesson(lesson);
                    setCurrentView('lesson-editor');
                }}
                onDeleteLesson={(id) => {
                    // Handled inside AdminDashboard, but we pass handler just in case we need app-level logic
                }}
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

           {/* Permission Guard for Admin Routes */}
           {(currentView === 'admin-dashboard' || currentView === 'lesson-editor') && user.role !== 'admin' && (
               <div className="h-full flex items-center justify-center">
                   <div className="text-center">
                       <Shield size={48} className="mx-auto text-red-500 mb-4" />
                       <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                       <p className="text-slate-400">You do not have permission to view this page.</p>
                       <button 
                        onClick={() => setCurrentView('dashboard')}
                        className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
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
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary-500/30">
        {renderContent()}
      </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group
      ${active 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    title={label}
  >
    <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{icon}</span>
    <span className="hidden lg:block ml-3 font-medium text-sm">{label}</span>
  </button>
);

export default App;
