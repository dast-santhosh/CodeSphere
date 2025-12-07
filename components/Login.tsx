
import React, { useState } from 'react';
import { Code, User, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { User as UserType } from '../types';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const ADMIN_UID = "L0whAW8oagQK3Ix12QEurfwV4zs1";

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiLink, setShowApiLink] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowApiLink(false);

    try {
      let firebaseUser;
      let userRole = role;
      let completedLessonIds: string[] = [];

      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        
        // Update Profile Name
        await updateProfile(firebaseUser, { displayName: name });

        // Auto-promote if matches hardcoded Admin UID
        if (firebaseUser.uid === ADMIN_UID) {
            userRole = 'admin';
        }

        // Save Role to Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), {
          role: userRole,
          email: email,
          name: name,
          completedLessonIds: []
        });

      } else {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;

        // Fetch Role from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          let dbRole = data.role as 'student' | 'admin';
          
          // FORCE ADMIN PROMOTION FOR SPECIFIC UID
          if (firebaseUser.uid === ADMIN_UID && dbRole !== 'admin') {
              await updateDoc(doc(db, "users", firebaseUser.uid), { role: 'admin' });
              dbRole = 'admin';
          }
          
          // STRICT ROLE CHECK FOR ADMIN LOGIN
          if (role === 'admin' && dbRole !== 'admin') {
             await signOut(auth); // Sign out immediately
             throw new Error("Access Denied: This account does not have Instructor privileges.");
          }

          userRole = dbRole;
          completedLessonIds = data.completedLessonIds || [];
        } else {
            // Fallback if no role defined (legacy users)
            if (firebaseUser.uid === ADMIN_UID) {
                userRole = 'admin';
                await setDoc(doc(db, "users", firebaseUser.uid), { role: 'admin' }, { merge: true });
            } else {
                userRole = 'student';
            }
        }
      }

      const appUser: UserType = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || name || email.split('@')[0],
        email: firebaseUser.email || email,
        role: userRole,
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        completedLessonIds: completedLessonIds
      };

      onLogin(appUser);

    } catch (err: any) {
      console.error(err);
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setShowApiLink(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userRole = role;
      let completedLessonIds: string[] = [];

      if (!userDoc.exists()) {
          // Check for hardcoded Admin UID on creation
          if (user.uid === ADMIN_UID) {
              userRole = 'admin';
          }

          // Create new user with selected role from the UI state
          await setDoc(userDocRef, {
              role: userRole,
              email: user.email,
              name: user.displayName || name || '',
              avatar: user.photoURL,
              completedLessonIds: []
          });
      } else {
          // Check admin privileges if trying to login as admin
          const userData = userDoc.data();
          userRole = userData.role;
          completedLessonIds = userData.completedLessonIds || [];

          // FORCE ADMIN PROMOTION FOR SPECIFIC UID
          if (user.uid === ADMIN_UID && userRole !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
              userRole = 'admin';
          }

          if (role === 'admin' && userRole !== 'admin') {
              await signOut(auth);
              throw new Error("Access Denied: This account does not have Instructor privileges.");
          }
      }

      const appUser: UserType = {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email || '',
        role: userRole,
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        completedLessonIds: completedLessonIds
      };

      onLogin(appUser);

    } catch (err: any) {
      console.error(err);
      handleError(err);
      setIsLoading(false);
    }
  };

  const handleError = (err: any) => {
    let msg = err.message;
    setShowApiLink(false);

    // Provide more helpful error messages for common Firebase issues
    if (err.message.includes("Cloud Firestore API has not been used") || err.code === 'permission-denied') {
      msg = "Database API is not enabled. Please click the link below to enable it.";
      setShowApiLink(true);
    } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      msg = "Login method not enabled. Please check Firebase Console.";
    } else if (err.code === 'auth/email-already-in-use') {
      msg = "This email is already registered. Please log in instead.";
    } else if (err.code === 'auth/weak-password') {
      msg = "Password should be at least 6 characters.";
    } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      msg = "Invalid email or password.";
    } else if (err.code === 'auth/network-request-failed') {
      msg = "Network error. Please check your internet connection.";
    } else if (err.code === 'auth/popup-closed-by-user') {
      msg = "Sign in cancelled.";
    } else if (err.code === 'auth/unauthorized-domain') {
      msg = `Domain not authorized. Add "${window.location.hostname}" to Firebase Console > Auth > Settings > Authorized Domains.`;
    }

    setError(msg.replace('Firebase:', '').trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <Code size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-slate-400">
            {isSignUp ? 'Join the immersive coding sphere.' : 'Sign in to continue learning.'}
          </p>
        </div>

        {/* Portal/Role Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${role === 'student' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <User size={16} className="mr-2" />
                {isSignUp ? 'Student' : 'Student Login'}
            </button>
            <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${role === 'admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <ShieldCheck size={16} className="mr-2" />
                {isSignUp ? 'Instructor' : 'Admin Login'}
            </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@codesphere.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex flex-col items-start">
              <div className="flex items-center">
                  <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
              </div>
              {showApiLink && (
                  <a 
                    href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=codesphere-35dae"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-6 mt-2 text-primary-400 hover:text-primary-300 underline font-bold"
                  >
                    Enable Firestore API →
                  </a>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center group mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isSignUp ? 'Create Account' : `Sign In as ${role === 'admin' ? 'Admin' : 'Student'}`}
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-500">Or continue with</span>
            </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl transition-all hover:bg-slate-200 flex items-center justify-center mb-4"
        >
             <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            Sign in with Google
        </button>

        <div className="mt-2 text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setShowApiLink(false); }}
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center w-full"
          >
            {isSignUp ? (
                <>Already have an account? <span className="text-primary-500 ml-1 font-medium">Log in</span></>
            ) : (
                <>Don't have an account? <span className="text-primary-500 ml-1 font-medium">Sign Up</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
