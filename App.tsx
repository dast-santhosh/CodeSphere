
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
import { Lesson, User } from './types';
import { INITIAL_CURRICULUM } from './constants';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, writeBatch, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';

type View = 'dashboard' | 'learn' | 'live' | 'sandbox' | 'profile' | 'admin-dashboard' | 'lesson-editor';

const ADMIN_UID = "L0whAW8oagQK3Ix12QEurfwV4zs1";

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
            // Safety Check: Force admin role if UID matches, even if not caught by Login
            if (firebaseUser.uid === ADMIN_UID) {
                try {
                     await setDoc(doc(db, "users", firebaseUser.uid), { role: 'admin' }, { merge: true });
                } catch (e) {
                    console.error("Failed to auto-promote admin in App.tsx", e);
                }
            }

            // Setup realtime listener for user profile to handle account creation race conditions
            unsubscribeUser = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
                let role: 'student' | 'admin' = 'student';
                let completedLessonIds: string[] = [];
                let name = firebaseUser.displayName || 'User';
                let avatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`;

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    role = data.role || 'student';
                    completedLessonIds = data.completedLessonIds || [];
                    if (data.name) name = data.name;
                    if (data.avatar) avatar = data.avatar;
                }

                const newUser: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    name: name,
                    role: role,
                    avatar: avatar,
                    completedLessonIds: completedLessonIds
                };

                setUser(newUser);
                setLoadingAuth(false);
            }, (error) => {
                console.error("User Profile Error:", error);
                if (error.message.includes("Cloud Firestore API has not been used") || error.code === 'permission-denied') {
                    setDbError("Firestore API is not enabled. Please enable it in the Google Cloud Console.");
                }
                // Don't block auth on profile load error, just use basic info
                setLoadingAuth(false);
            });
        } else {
            if (unsubscribeUser) unsubscribeUser();
            setUser(null);
            setLoadingAuth(false);
        }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  // Redirect admin logic moved to effect dependent on User state
  useEffect(() => {
    if (user && user.role === 'admin' && currentView === 'dashboard') {
        setCurrentView('admin-dashboard');
    }
  }, [user]);

  // 2. Listen to Lessons from Firestore
  useEffect(() => {
    if (!user) return;

    // Add error handling to the snapshot listener
    const unsubscribe = onSnapshot(collection(db, "lessons"), (snapshot) => {
        setDbError(null); // Clear previous errors on success
        const fetchedLessons: Lesson[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Lesson));

        // Seed data if empty (for demo purposes)
        if (fetchedLessons.length === 0 && user.role === 'admin') {
           seedDatabase().catch(e => {
               console.error("Seeding failed:", e);
               // If seeding fails due to permissions/API, it will be caught here or in the snapshot error handler
           });
        } else {
            setLessons(fetchedLessons);
        }
    }, (error) => {
        console.error("Firestore Error:", error);
        let errorMessage = "Failed to connect to the database.";
        
        if (error.message.includes("Cloud Firestore API has not been used") || error.code === 'permission-denied') {
            errorMessage = "Firestore API is not enabled. Please enable it in the Google Cloud Console.";
        } else if (error.code === 'unavailable') {
            errorMessage = "Service unavailable. You might be offline.";
        }
        
        setDbError(errorMessage);
    });

    return () => unsubscribe();
  }, [user]);

  const seedDatabase = async () => {
      console.log("Seeding database...");
      try {
        const batch = writeBatch(db);
        INITIAL_CURRICULUM.forEach(lesson => {
            const docRef = doc(db, "lessons", lesson.id);
            batch.set(docRef, lesson);
        });
        await batch.commit();
      } catch (e) {
          throw e;
      }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentView('dashboard');
    setActiveLesson(null);
  };

  // Student Actions
  const handleStartLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentView('learn');
  };

  const handleCompleteLesson = async (lessonId: string) => {
      if (!user) return;
      
      // Prevent duplicate updates
      if (user.completedLessonIds.includes(lessonId)) return;

      const newCompletedIds = [...user.completedLessonIds, lessonId];
      
      // Update Local State (optimistic)
      setUser({ ...user, completedLessonIds: newCompletedIds });

      // Update Firestore
      try {
          await updateDoc(doc(db, "users", user.id), {
              completedLessonIds: arrayUnion(lessonId)
          });
      } catch (e) {
          console.error("Error updating progress:", e);
      }
  };

  // Admin Actions
  const handleCreateLesson = () => {
    setEditingLesson(null);
    setCurrentView('lesson-editor');
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setCurrentView('lesson-editor');
  };

  const handleSaveLessonComplete = () => {
    setCurrentView('admin-dashboard');
  };

  const handleDeleteLesson = (id: string) => {
    // Handled in AdminDashboard now
  };

  // Render Logic
  if (loadingAuth) {
      return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-primary-500">
          <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
      </div>;
  }

  // Database Error Screen - Priority Over Login
  if (dbError) {
      return (
          <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[100px]"></div>
              
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md text-center relative z-10">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Setup Required</h2>
                  <p className="text-slate-400 mb-6">{dbError}</p>
                  
                  {dbError.includes("API") && (
                      <a 
                        href={`https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=codesphere-35dae`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-4 rounded-xl transition-all mb-3"
                      >
                          Enable Firestore API
                      </a>
                  )}
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-all"
                  >
                      Retry Connection
                  </button>
              </div>
          </div>
      );
  }

  if (!user) {
    return <Login onLogin={() => {}} />; 
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
            <Dashboard 
                lessons={lessons} 
                onStartLesson={handleStartLesson} 
                completedLessonIds={user.completedLessonIds}
            />
        );
      case 'learn':
        return (
            <LessonView 
                lesson={activeLesson || lessons[0]} 
                onBack={() => setCurrentView('dashboard')} 
                onComplete={handleCompleteLesson}
            />
        );
      case 'live':
        return <LiveClassroom role={user.role} onLeave={() => setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'dashboard')} />;
      case 'sandbox':
        return <CodeSandbox />;
      case 'admin-dashboard':
        return (
            <AdminDashboard 
                lessons={lessons}
                onCreateLesson={handleCreateLesson}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
                onStartLiveClass={() => setCurrentView('live')}
            />
        );
      case 'lesson-editor':
        return (
            <LessonEditor 
                onSave={handleSaveLessonComplete}
                onCancel={() => setCurrentView('admin-dashboard')}
                initialData={editingLesson}
            />
        );
      case 'profile':
        return (
            <UserProfile 
                user={user} 
                lessons={lessons} 
                onLogout={handleLogout} 
                onUpdateUser={setUser} 
            />
        );
      default:
        return (
            <Dashboard 
                lessons={lessons} 
                onStartLesson={handleStartLesson} 
                completedLessonIds={user.completedLessonIds}
            />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-20">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Code size={18} className="text-white" />
            </div>
            <span className="ml-3 font-bold text-lg hidden lg:block tracking-wide">CODESPHERE</span>
          </div>

          <nav className="mt-6 flex flex-col gap-2 px-2">
            {user.role === 'admin' ? (
                <>
                    <NavItem 
                        icon={<LayoutDashboard size={20} />} 
                        label="Overview" 
                        active={currentView === 'admin-dashboard'} 
                        onClick={() => setCurrentView('admin-dashboard')} 
                    />
                    <NavItem 
                        icon={<Video size={20} />} 
                        label="Live Class" 
                        active={currentView === 'live'} 
                        onClick={() => setCurrentView('live')} 
                    />
                     <NavItem 
                        icon={<Code size={20} />} 
                        label="Code Sandbox" 
                        active={currentView === 'sandbox'} 
                        onClick={() => setCurrentView('sandbox')} 
                    />
                </>
            ) : (
                <>
                    <NavItem 
                        icon={<LayoutDashboard size={20} />} 
                        label="Dashboard" 
                        active={currentView === 'dashboard'} 
                        onClick={() => setCurrentView('dashboard')} 
                    />
                    <NavItem 
                        icon={<GraduationCap size={20} />} 
                        label="Learn Python" 
                        active={currentView === 'learn'} 
                        onClick={() => {
                            setActiveLesson(null);
                            setCurrentView('learn');
                        }} 
                    />
                    <NavItem 
                        icon={<Code size={20} />} 
                        label="Code Sandbox" 
                        active={currentView === 'sandbox'} 
                        onClick={() => setCurrentView('sandbox')} 
                    />
                    <NavItem 
                        icon={<Video size={20} />} 
                        label="Live Class" 
                        active={currentView === 'live'} 
                        onClick={() => setCurrentView('live')} 
                    />
                </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex items-center justify-center lg:justify-start w-full p-2 rounded-lg hover:bg-slate-800 transition-colors ${currentView === 'profile' ? 'bg-slate-800' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600">
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="ml-3 hidden lg:block text-left overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <div className="flex-1 overflow-auto scroll-smooth">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center lg:justify-start w-full p-3 rounded-xl transition-all duration-200 group
      ${active 
        ? 'bg-primary-600/10 text-primary-500 shadow-sm shadow-primary-900/20 border border-primary-500/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <span className={`${active ? 'text-primary-500' : 'group-hover:text-white'}`}>{icon}</span>
    <span className="ml-3 font-medium hidden lg:block">{label}</span>
  </button>
);

export default App;
